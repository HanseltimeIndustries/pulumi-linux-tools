import * as pulumi from "@pulumi/pulumi";
import { remote, types } from "@pulumi/command";
import { shellStrings } from "@hanseltime/pulumi-linux-base";

/**
 * This construct will manage your SSHDConfig for you (it will overwrite manual changes.)
 *
 * The way it works:
 *
 * 1. It will take the specified ssh config file and make a copy of it at <file>.orig
 * 2. It will then construct a <file>.new where it:
 *     1. replaces any entries in config completely with the config values
 *     2. maps over any missing keys in the config with the values from <file>.orig
 * 3. Finally it will replace the <file> with <file>.new
 *
 * In the event of a delete, we re-establish the .orig file
 */
export class SSHDConfig extends remote.Command {
	constructor(
		name: string,
		args: {
			/**
			 * The connection that must have passwordless sudo available to it.
			 */
			connection: pulumi.Input<types.input.remote.ConnectionArgs>;
			/**
			 * Any keyed names that you would normally put in an sshd config file like `PermitRootLogin no`
			 * will be a key: value pair like { PermitRootLogin: 'no' }
			 *
			 * Additionally, if you are using a multi-line option that can be repeated multiple times,
			 * you can supply an array of values and they will be added.
			 */
			config: { [k: string]: string | string[] };
		},
		opts: pulumi.ComponentResourceOptions,
	) {
		const sshFolder = "/etc/ssh";
		const sshPath = `${sshFolder}/sshd_config`;
		const sshOrigPath = `${sshPath}.orig`;
		const sshNewPath = `${sshPath}.new`;
		const createOrig = `if [ ! -f "${sshOrigPath}" ]; then cp ${sshPath} ${sshOrigPath}; fi`;
		const createNew = `cp -f ${sshOrigPath} ${sshNewPath}`;
		const configKeys: (keyof (typeof args)["config"] & string)[] = Object.keys(
			args.config,
		);
		// Clear anything that we're adding to the file
		const clearKeys = configKeys
			.map((k) => `sed -i '/^[[:space:]]*${k}[[:space:]].*/d' ${sshNewPath}`)
			.join(" && ");
		const addKeys = configKeys
			.map((k) => {
				const val = args.config[k];
				if (Array.isArray(val)) {
					return val
						.map((v) => `echo "${k} ${v}" | tee -a ${sshNewPath}`)
						.join(" && ");
				} else {
					return `echo "${k} ${val}" | tee -a ${sshNewPath}`;
				}
			})
			.join(" && ");

		// This is rough support from the linode article - the socket approach does not seem to work
		const restartSSH =
			'. /etc/os-release && if [ "$NAME" == "Ubuntu" ] && (( ${VERSION%%.*} >= 22 )); then systemctl restart ssh; else command -v systemctl >/dev/null && systemctl restart sshd || service sshd restart; fi';

		const createOrUpdate = `${createOrig} && ${createNew} && ${clearKeys} && ${addKeys} && cp -f ${sshNewPath} ${sshPath} && ${restartSSH} && rm ${sshNewPath}`;
		const deleteCommand = `cp -f ${sshOrigPath} ${sshPath} && ${restartSSH}`;
		super(
			name,
			{
				connection: args.connection,
				create: shellStrings.asSudoOutput(createOrUpdate),
				delete: shellStrings.asSudoOutput(deleteCommand),
			},
			opts,
		);
	}
}
