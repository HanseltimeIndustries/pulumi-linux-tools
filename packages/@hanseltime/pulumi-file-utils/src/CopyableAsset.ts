import * as pulumi from "@pulumi/pulumi";
import { existsSync, rmSync, statSync } from "fs";
import {
	cp,
	mkdir,
	readdir,
	readFile,
	rm,
	utimes,
	writeFile,
} from "fs/promises";
import { isAbsolute, join, resolve } from "path";
import * as tar from "tar";

const INTERRUPT_EVENTS = [
	`exit`,
	`SIGINT`,
	`SIGUSR1`,
	`SIGUSR2`,
	`uncaughtException`,
	`SIGTERM`,
];

const CLEAN_UP_DIRS = [] as string[];

// Because we're composing a temp asset, we always need to keep the timestamps the same so the file check doesn't replace everytime
const DUMMY_TIMESTAMP = new Date("1995-12-17T03:24:00");

function cleanUpDirs() {
	// Empty in the event of multiple interrupt triggers
	const dirs = [...CLEAN_UP_DIRS];
	CLEAN_UP_DIRS.length = 0;
	dirs.forEach((dir) => {
		rmSync(dir, {
			recursive: true,
			force: true,
		});
	});
}

interface HiddenResource {
	__parentResource?: pulumi.Resource;
	__name: string;
	__pulumiType: string;
}

export interface CopyableAssetArgs {
	asset: pulumi.Input<pulumi.asset.Asset | pulumi.asset.Archive>;
	/**
	 * Only necessary if the asset is not a file or folder already on the system
	 */
	tmpCopyDir?: pulumi.Input<string>;
	/**
	 * Only necessary if the asset is not a file or folder already on the system.
	 * This will provide file folder name since the copy commands copy this root name
	 * and structure into a folder
	 */
	synthName?: pulumi.Input<string>;
	/**
	 * This class will normally add itself to the process exit handler to remove the temporary directory.
	 * Setting this will skip that for this.
	 */
	noClean?: boolean;
}

/**
 * Class that simplifies copy commands by allowing for Synthetic assets by writing them to a temporary folder
 */
export class CopyableAsset {
	static ids = new Set<string>();

	// changeDetect: pulumi.Output<Buffer | pulumi.asset.FileAsset | pulumi.asset.FileArchive>;

	readonly id: string;

	readonly copyableSource: pulumi.Output<
		pulumi.asset.Asset | pulumi.asset.Archive
	>;

	private static registered: boolean = false;
	private static registerCleanup() {
		if (!this.registered) {
			INTERRUPT_EVENTS.forEach((eventType) => {
				process.once(eventType, cleanUpDirs);
			});
			this.registered = true;
		}
	}

	/**
	 * Generates a resource from a parent resource so that you get a unique id
	 * based on the encapsulating parent.
	 *
	 * Note - this is reliant on hidden fields from pulumi since we run into a
	 * loop if we use outputs
	 *
	 * @param parent - the parent resource that we will adapt the urn to
	 * @param postFix - a postfix that will be added
	 * @param args
	 */
	static fromParent(
		parent: pulumi.Resource,
		postFix: pulumi.Input<string>,
		args: CopyableAssetArgs,
	): CopyableAsset {
		return new CopyableAsset(
			`${this.calculateUrn(parent).replaceAll(/[:\$/\\]/g, "_")}_${postFix}`,
			args,
		);
	}

	static calculateUrn(resource: pulumi.Resource, post = ""): string {
		const cast = resource as unknown as HiddenResource;

		const urnComponent = `${cast.__pulumiType}:${cast.__name}${post ? `:${post}` : ""}`;
		if (cast.__parentResource) {
			return this.calculateUrn(cast.__parentResource);
		}
		return urnComponent;
	}

	/**
	 * The id must be unique to all othe resources in the run.  It is used to create temporary directories
	 * for any assets that are synthetic.
	 *
	 * @param id
	 * @param asset
	 * @param tmpCopyDir
	 */
	constructor(id: string, args: CopyableAssetArgs) {
		if (CopyableAsset.ids.has(id)) {
			throw new pulumi.RunError(
				`CopyableAsset(${id}): Muliple CopyableAssets with the exact same id: ${id}`,
			);
		}

		// Validate the ids
		const valid = /^[a-zA-Z0-9_-]+$/;
		if (!id.match(valid)) {
			throw new pulumi.RunError(
				`CopyableAsset(${id}): id should only match: ${valid.source}`,
			);
		}

		this.id = id;

		const tmpDir = pulumi
			.output(args)
			.apply(async ({ tmpCopyDir, asset, synthName }) => {
				const assetType = this.assetType(asset);
				if (
					assetType === AssetTypes.StringAsset ||
					assetType === AssetTypes.AssetArchive
				) {
					if (!tmpCopyDir) {
						throw new pulumi.RunError(
							`CopyableAsset(${this.id}): Must supply a tmpCopyDir to use an AssetArchive or StringAsset`,
						);
					}
					if (!synthName) {
						throw new pulumi.RunError(
							`CopyableAsset(${this.id}): Must supply a synthName to use an AssetArchive or StringAsset`,
						);
					}

					if (isAbsolute(tmpCopyDir)) {
						throw new pulumi.RunError(
							`CopyableAsset(${this.id}): Cannot supply an absolute path ${tmpCopyDir}.  This will not work cross-machine since paths are part of hashing.`,
						);
					}

					const tmpDir = "./" + join(tmpCopyDir, id);
					if (existsSync(tmpDir)) {
						// remove any previously copied data
						await rm(tmpDir, {
							recursive: true,
							force: true,
						});
					}
					await mkdir(tmpDir, {
						recursive: true,
					});
					await utimes(tmpDir, DUMMY_TIMESTAMP, DUMMY_TIMESTAMP);
					return tmpDir;
				}
				return undefined;
			});
		this.copyableSource = pulumi
			.output({
				...args,
				tmpDir,
			})
			.apply(async ({ asset, synthName, noClean, tmpDir }) => {
				const assetType = this.assetType(asset);
				if (
					assetType === AssetTypes.StringAsset ||
					assetType === AssetTypes.AssetArchive
				) {
					await this.createSyntheticAsset(asset, synthName!, tmpDir!);

					// Add to exit handler array
					if (!noClean) {
						CLEAN_UP_DIRS.push(resolve(process.cwd(), tmpDir!));
					}

					if (statSync(join(tmpDir!, synthName!)).isDirectory()) {
						return new pulumi.asset.FileArchive(join(tmpDir!, synthName!));
					} else {
						return new pulumi.asset.FileAsset(join(tmpDir!, synthName!));
					}
				} else {
					return asset;
				}
			});

		CopyableAsset.registerCleanup();
	}

	private async createSyntheticAsset(
		asset: pulumi.asset.Asset | pulumi.asset.Archive,
		assetName: string,
		cwd: string,
	) {
		const assetPath = join(cwd, assetName);
		const assetType = this.assetType(asset);
		if (assetType === AssetTypes.AssetArchive) {
			const assetMap = await (asset as pulumi.asset.AssetArchive).assets;
			await mkdir(assetPath, {
				recursive: true,
			});
			await utimes(assetPath, DUMMY_TIMESTAMP, DUMMY_TIMESTAMP);
			await Promise.all(
				Object.keys(assetMap).map((newAssetName) =>
					this.createSyntheticAsset(
						assetMap[newAssetName],
						newAssetName,
						assetPath,
					),
				),
			);
		} else if (assetType === AssetTypes.StringAsset) {
			await writeFile(
				assetPath,
				await (asset as pulumi.asset.StringAsset).text,
			);
			await utimes(assetPath, DUMMY_TIMESTAMP, DUMMY_TIMESTAMP);
		} else if (assetType === AssetTypes.PathBasedAsset) {
			await cp(
				await (asset as pulumi.asset.FileArchive | pulumi.asset.FileAsset).path,
				assetPath,
				{
					recursive: true,
					preserveTimestamps: true,
				},
			);
		} else {
			throw new pulumi.RunError(
				`CopyableAsset(${this.id}): Unexpected asset type for creating synthetic asset! ${assetType}`,
			);
		}
	}

	/**
	 * We have to duck-type since pulumi.output strips class indentification
	 */
	assetType(asset: pulumi.asset.Archive | pulumi.asset.Asset) {
		if ((asset as pulumi.asset.AssetArchive).assets) {
			return AssetTypes.AssetArchive;
		} else if ((asset as pulumi.asset.StringAsset).text) {
			return AssetTypes.StringAsset;
		} else if (
			(asset as pulumi.asset.FileAsset | pulumi.asset.FileArchive).path
		) {
			return AssetTypes.PathBasedAsset;
		} else if (
			(asset as pulumi.asset.RemoteArchive | pulumi.asset.RemoteAsset).uri
		) {
			return AssetTypes.RemoteAsset;
		} else {
			throw new pulumi.RunError(
				`CopyableAsset(${this.id}): Unable to tell what type of Archive was supplied! ${JSON.stringify(asset)}`,
			);
		}
	}

	async createChangeDetect(dir: string) {
		const testFileName = `change-detect.tgz`;
		const files = (await readdir(dir)).filter((f) => f !== testFileName);
		const testFilePath = join(dir, testFileName);
		try {
			await tar.create(
				{
					gzip: true,
					file: testFilePath,
					cwd: dir + "/",
					mtime: new Date("1995-12-17T03:24:00"),
					sync: true,
					portable: true,
					noDirRecurse: false,
				},
				files,
			);
			return await readFile(testFilePath);
		} finally {
			if (existsSync(testFilePath)) {
				// await rm(testFilePath);
			}
		}
	}
}

// TODO - we can change this to duck-typing functions below
enum AssetTypes {
	AssetArchive = "AssetArchive",
	StringAsset = "StringAsset",
	PathBasedAsset = "PathBasedAsset",
	RemoteAsset = "RemoteAsset",
}

// helper assert functions
export function isPathAsset(
	asset: pulumi.asset.Asset | pulumi.asset.Archive,
): asset is pulumi.asset.FileArchive | pulumi.asset.FileAsset {
	return !!(asset as pulumi.asset.FileArchive | pulumi.asset.FileAsset).path;
}

export function isAssetArchive(
	asset: pulumi.asset.Asset | pulumi.asset.Archive,
): asset is pulumi.asset.AssetArchive {
	return !!(asset as pulumi.asset.AssetArchive).assets;
}

export function isStringAsset(
	asset: pulumi.asset.Asset | pulumi.asset.Archive,
): asset is pulumi.asset.StringAsset {
	return !!(asset as pulumi.asset.StringAsset).text;
}

export function isRemoteAsset(
	asset: pulumi.asset.Asset | pulumi.asset.Archive,
): asset is pulumi.asset.RemoteArchive | pulumi.asset.RemoteAsset {
	return !!(asset as pulumi.asset.RemoteArchive | pulumi.asset.RemoteAsset).uri;
}
