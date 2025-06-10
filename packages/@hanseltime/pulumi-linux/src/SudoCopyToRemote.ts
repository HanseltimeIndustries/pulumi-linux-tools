import * as pulumi from "@pulumi/pulumi";
import { remote, types } from "@pulumi/command";
import { statSync } from "fs";
import { basename } from "path";
import { shellStrings } from "@hanseltime/pulumi-linux-base";
import { LIBRARY_PREFIX } from "./constants";

export interface SudoCopyToRemoteArgs extends remote.CopyToRemoteArgs {
	/**
	 * This is the absolute path to a tmp directory where we upload the intermediate files before moving them
	 */
	userTmpPath: pulumi.Input<string>;
}

/**
 * If you are copying to a root location or another user's directory, this exists to use a non-root user that
 * can sudo (i.e. an automation user).
 *
 * This does end up using 3 compound resources... which is unfortunate but in essence it does:
 *
 * 1. Create a tmp directory for the automation user to copy to
 * 2. Copy to the tmp directory
 * 3. (sudo) Move file in the tmp directory to the target location and then remove the tmp directory
 */
export class SudoCopyToRemote extends pulumi.ComponentResource {
	readonly connection: pulumi.Output<types.output.remote.Connection>;
	/**
	 * The destination path on the remote host. The last element of the path will be created if it doesn't exist but it's an error when additional elements don't exist. When the remote path is an existing directory, the source file or directory will be copied into that directory. When the source is a file and the remote path is an existing file, that file will be overwritten. When the source is a directory and the remote path an existing file, the copy will fail.
	 */
	readonly remotePath: pulumi.Output<string>;
	/**
	 * An [asset or an archive](https://www.pulumi.com/docs/concepts/assets-archives/) to upload as the source of the copy. It must be path-based, i.e., be a `FileAsset` or a `FileArchive`. The item will be copied as-is; archives like .tgz will not be unpacked. Directories are copied recursively, overwriting existing files.
	 */
	readonly source: pulumi.Output<pulumi.asset.Asset | pulumi.asset.Archive>;
	/**
	 * Trigger replacements on changes to this input.
	 */
	readonly triggers: pulumi.Output<any[] | undefined>;

	constructor(
		name: string,
		args: SudoCopyToRemoteArgs,
		opts: pulumi.ComponentResourceOptions,
	) {
		super(`${LIBRARY_PREFIX}:SudoCopyToRemote`, name, args, opts);

		// So if the tempDirectory Exists, we still need to create a "name" directory for parallelism
		// Then we need to copy and then we need to transfer.... fuck that's alot

		const { tmpFolder } = pulumi.output(args).apply(async ({ userTmpPath }) => {
			const tmpFolder = `${userTmpPath}/${name}`;
			return {
				tmpFolder,
			};
		});

		const tmpCopyDir = new remote.Command(
			`${name}-createtmpcopydir`,
			{
				connection: args.connection,
				// Remove any failed ssh session and apply it under the conneciton user
				create: tmpFolder.apply(
					(tmpFolder) =>
						`mkdir -p ${tmpFolder} && ${shellStrings.deleteDirElements(tmpFolder)}`,
				),
				delete: shellStrings.asSudoOutput(
					tmpFolder.apply((tmpFolder) => `rm -rf ${tmpFolder}`),
				),
			},
			{
				parent: this,
			},
		);

		const copy = new remote.CopyToRemote(
			`${name}-copytotmp`,
			{
				connection: args.connection,
				source: args.source,
				remotePath: tmpFolder,
				triggers: args.triggers,
			},
			{
				parent: this,
				dependsOn: [tmpCopyDir],
			},
		);
		this.connection = copy.connection;
		this.source = copy.source;
		this.triggers = copy.triggers;
		this.remotePath = copy.remotePath;

		new remote.Command(
			`${name}-movetoprotected`,
			{
				connection: args.connection,
				create: shellStrings.asSudoOutput(
					pulumi
						.output({
							tmpFolder,
							remotePath: args.remotePath,
							source: args.source,
						})
						.apply(async ({ tmpFolder, remotePath, source }) => {
							if (
								(source as pulumi.asset.FileAsset | pulumi.asset.FileArchive)
									.path
							) {
								const p = await (
									source as pulumi.asset.FileArchive | pulumi.asset.FileAsset
								).path;

								if (statSync(p).isDirectory()) {
									return `mkdir -p ${remotePath} && cp -rf ${tmpFolder}/* ${remotePath} && rm -rf ${tmpFolder}`;
								} else {
									// Per pulumi-command code, if the path is an existing dir for a file, we insert it.  Otherwise we treat the path as a file
									return `if [ -d ${remotePath} ]; then cp -rf ${tmpFolder}/* ${remotePath}; else mv -f ${tmpFolder}/${basename(p)} ${remotePath}; fi && rm -rf ${tmpFolder}`;
								}
							} else {
								throw new Error(
									`Unexpected non-path based source for (${name})`,
								);
							}
						}),
				),
				triggers: [copy.source],
			},
			{
				parent: this,
				dependsOn: [copy],
			},
		);

		this.registerOutputs({
			connection: this.connection,
			source: this.source,
			triggers: this.triggers,
			remotePath: this.remotePath,
		});
	}
}
