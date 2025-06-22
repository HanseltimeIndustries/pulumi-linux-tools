import * as pulumi from "@pulumi/pulumi";
import { createHash } from "crypto";
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
import { dirname, isAbsolute, join, resolve } from "path";
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
		if (existsSync(dir)) {
			rmSync(dir, {
				recursive: true,
				force: true,
			});
		}
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

	/**
	 * the unique id of this asset (has to be unique across all assets created so that we don't
	 * overwrite)
	 */
	readonly id: string;
	/**
	 * The location where all of the assets are built to or just the path if the base asset was
	 * just a file or directory
	 */
	readonly path: pulumi.Output<string>;
	/**
	 * If you use the 'changeDetect' function, this will create the tar of this directory
	 * in this location
	 */
	readonly tmpChangeDetectDir: pulumi.Output<string | undefined>;

	readonly copyableSource: pulumi.Output<
		pulumi.asset.Asset | pulumi.asset.Archive
	>;

	private static registered: boolean = false;
	private static registerCleanup() {
		if (!CopyableAsset.registered) {
			INTERRUPT_EVENTS.forEach((eventType) => {
				process.once(eventType, cleanUpDirs);
			});
			CopyableAsset.registered = true;
		}
	}

	private static hashFunction: ((compressed: Buffer, asset: CopyableAsset) => Buffer | string) | undefined
	/**
	 * This sets a hash function that will take the compressed bytes of a buffer for an asset and returns
	 * a Buffer or string that should be used for change detect.
	 * 
	 * The second parameter of function you pass is the asset so that you can create custom hashes
	 * for only certain problematic assets if need be.
	 * @param func 
	 */
	public static setChangeDetectHashFunction(func: (compressed: Buffer, asset: CopyableAsset) => Buffer | string) {
		if (this.hashFunction) {
			throw new Error('Can only setChangeDetectHashFunction once!')
		}
		this.hashFunction = func
	}

	/**
	 * Simple hash algorithm that calculates the sha256 of a buffer and also appends the length
	 * so that collisions from different lengths can be minimized
	 * @param buffer 
	 * @returns 
	 */
	public static sha256AndLength(buffer: Buffer) {
		const hash = createHash('sha256').update(buffer).digest('hex');
		return `${hash}:${buffer.length}`
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
			`${CopyableAsset.calculateUrn(parent).replaceAll(/[:$/\\]/g, "_")}_${postFix}`,
			args,
		);
	}

	static calculateUrn(resource: pulumi.Resource, post = ""): string {
		const cast = resource as unknown as HiddenResource;

		const urnComponent = `${cast.__pulumiType}:${cast.__name}${post ? `:${post}` : ""}`;
		if (cast.__parentResource) {
			return CopyableAsset.calculateUrn(cast.__parentResource);
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

		const { tmpChangeDetectDir, path, copyableSource } = pulumi
			.output(args)
			.apply(async ({ tmpCopyDir, asset, synthName, noClean }) => {
				const assetType = this.assetType(asset);
				const isSynthetic =
					assetType === AssetTypes.StringAsset ||
					assetType === AssetTypes.AssetArchive;
				if (isSynthetic) {
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
				}

				let tmpDirRet: string | undefined;
				let tmpChangeDetectDirRet: string | undefined;
				if (tmpCopyDir) {
					tmpDirRet = `./${join(tmpCopyDir, id)}`;
					tmpChangeDetectDirRet = `${tmpDirRet}-cdetect`;
					if (existsSync(tmpDirRet)) {
						// remove any previously copied data
						await rm(tmpDirRet, {
							recursive: true,
							force: true,
						});
					}
					await mkdir(tmpDirRet, {
						recursive: true,
					});
					// Add to exit handler array
					if (!noClean) {
						CLEAN_UP_DIRS.push(resolve(process.cwd(), tmpDirRet!));
					}
					await utimes(tmpDirRet, DUMMY_TIMESTAMP, DUMMY_TIMESTAMP);
					if (existsSync(tmpChangeDetectDirRet)) {
						// remove any previously copied data
						await rm(tmpChangeDetectDirRet, {
							recursive: true,
							force: true,
						});
					}
					await mkdir(tmpChangeDetectDirRet, {
						recursive: true,
					});
					// We want to clean up these files since they could hold the same amount of info
					// as the synthetic
					if (!noClean) {
						if (isAbsolute(tmpChangeDetectDirRet)) {
							CLEAN_UP_DIRS.push(tmpChangeDetectDirRet);
						} else {
							CLEAN_UP_DIRS.push(resolve(process.cwd(), tmpChangeDetectDirRet));
						}
					}
				}

				let pathRet: string = "";
				if (isSynthetic) {
					pathRet = join(tmpDirRet!, synthName!);
				} else if (assetType === AssetTypes.PathBasedAsset) {
					pathRet = await (
						asset as pulumi.asset.FileAsset | pulumi.asset.FileArchive
					).path;
				} else {
					throw new Error("Unexpected asset type " + assetType);
				}

				let copyableSourceRet:
					| pulumi.asset.FileAsset
					| pulumi.asset.FileArchive;
				if (isSynthetic) {
					await this.createSyntheticAsset(asset, synthName!, tmpDirRet!);

					if (statSync(join(tmpDirRet!, synthName!)).isDirectory()) {
						copyableSourceRet = new pulumi.asset.FileArchive(
							join(tmpDirRet!, synthName!),
						);
					} else {
						copyableSourceRet = new pulumi.asset.FileAsset(
							join(tmpDirRet!, synthName!),
						);
					}
				} else if (assetType === AssetTypes.PathBasedAsset) {
					copyableSourceRet = asset as
						| pulumi.asset.FileArchive
						| pulumi.asset.FileAsset;
				} else {
					throw new Error(`Unexpected asset type ${assetType}`);
				}
				const ret = {
					tmpDir: tmpDirRet,
					tmpChangeDetectDir: tmpChangeDetectDirRet,
					path: pathRet,
					copyableSource: copyableSourceRet,
				};
				return ret;
			});
		this.path = path;
		this.tmpChangeDetectDir = tmpChangeDetectDir;
		this.copyableSource = copyableSource;

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
			const onMachinePath = await (
				asset as pulumi.asset.FileArchive | pulumi.asset.FileAsset
			).path;
			await cp(onMachinePath, assetPath, {
				recursive: true,
				preserveTimestamps: true,
			});
			// There's a bug where the times on the context may be different for a directory
			const stats = statSync(onMachinePath);
			if (stats.isDirectory()) {
				utimes(assetPath, DUMMY_TIMESTAMP, DUMMY_TIMESTAMP);
			}
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

	/**
	 * Creates a deterministic tar of the this asset that can be used as a comparison buffer
	 * for changes.  This is better than using the "source" as a comparison point since things
	 * like permissions changes, etc. can become a problem and we have sane settings to only compare
	 * contents.
	 * @param {string} subPath - If provided this will only detect changes on a certain subpath
	 * @param {boolean} pathMayNotExist - if the subPath does not exist and that is not an error, will just return null
	 * @returns
	 */
	createChangeDetect(
		subPath?: string,
		pathMayNotExist?: boolean,
	): pulumi.Output<Buffer | string | null> {
		// TODO: sanitize the
		const testFileName = subPath
			? `change-detect_${subPath}.tgz`
			: `change-detect.tgz`;
		return pulumi
			.secret({
				path: this.path,
				tmpChangeDetectDir: this.tmpChangeDetectDir,
				// This is here just to make sure we do not run this before the
				copyableSource: this.copyableSource,
			})
			.apply(async ({ path, tmpChangeDetectDir }) => {
				if (!tmpChangeDetectDir) {
					throw new Error(
						`Must supply tmpCopyDir for changeDetect to work when creating CopyableAsset`,
					);
				}
				const testFilePath = join(tmpChangeDetectDir, testFileName);
				// This is expensive so only compute it when necessary
				if (existsSync(testFilePath)) {
					const content = await readFile(testFilePath)
					if (CopyableAsset.hashFunction) {
						return CopyableAsset.hashFunction(content, this);
					}
					return content;
				}

				const files: string[] = [];
				let cwd: string;
				if (statSync(path).isDirectory()) {
					const fullPath = subPath ? join(path, subPath) : path;
					if (pathMayNotExist && !existsSync(fullPath)) {
						return null;
					}
					files.push(...(await readdir(fullPath)));
					cwd = fullPath;
				} else {
					if (subPath) {
						throw new Error(
							`Cannot perform subPath change detect on non-directroy asset: ${path}.  Subpath: ${subPath}`,
						);
					}
					files.push(path);
					cwd = dirname(path);
				}
				await tar.create(
					{
						gzip: true,
						file: testFilePath,
						cwd,
						mtime: new Date(DUMMY_TIMESTAMP),
						sync: true,
						portable: true,
						noDirRecurse: false,
					},
					files,
				);
				const content = await readFile(testFilePath)
				if (CopyableAsset.hashFunction) {
					return CopyableAsset.hashFunction(content, this);
				}
				return content;
			});
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
