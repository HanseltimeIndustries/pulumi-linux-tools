import * as pulumi from "@pulumi/pulumi";
import { remote, types } from "@pulumi/command";
import { LIBRARY_PREFIX } from "./constants";
import { shellStrings } from "@hanseltime/pulumi-linux-base";

/**
 * A user that is added to the linux machine after the fact
 */
export class LinuxUser extends pulumi.ComponentResource {
	homeDir: pulumi.Output<string>;
	userName: pulumi.Output<string>;
	constructor(
		name: string,
		args: {
			/**
			 * A pulumi secret that will be used as the exact password
			 */
			password: pulumi.Input<string>;
			name: pulumi.Input<string>;
			groups: pulumi.Input<pulumi.Input<string>[]>;
			/**
			 * The connection information to the root/automation user that can assume sudo
			 * without a password
			 **/
			connection: pulumi.Input<types.input.remote.ConnectionArgs>;
			/**
			 * This should only be added for a trustworthy automation script user since this means
			 * the user does not need to enter their password to run sudo.
			 */
			passwordlessSudo?: boolean;
			/**
			 * If there are folders you would like to already have set up from the user root
			 */
			userHomeFolders?: string[];
			/**
			 * If the user should be allowed to edit their own .ssh folder.  In general, if you are
			 * creating a user on a remote machine for someone to SSH into, you probably want the root
			 * user to perform edits on the folder so that someone cannot get access to their .ssh and then
			 * add additional keys, etc. as a back door.
			 */
			canEditOwnSSH?: boolean;
		},
		opts?: pulumi.ComponentResourceOptions,
	) {
		super(`${LIBRARY_PREFIX}:User`, name, args, opts);

		const userDir = pulumi.output(args.name).apply((n) => `/home/${n}`);

		const { sudoersRemove, sudoersCreateOrupdate } = pulumi
			.output({
				passwordlessSudo: args.passwordlessSudo,
				groups: args.groups,
				name: args.name,
			})
			.apply(({ passwordlessSudo, groups, name }) => {
				if (passwordlessSudo && !groups.includes("sudo")) {
					throw new pulumi.InputPropertyError({
						propertyPath: "passwordlessSudo",
						reason:
							"Cannot set passwordless sudo without a sudo group membership",
					});
				}

				const sudoersRemove = `if [ -f "/etc/sudoers.d/${name}" ]; then rm "/etc/sudoers.d/${name}"; fi`;

				if (passwordlessSudo) {
					return {
						sudoersRemove,
						sudoersCreateOrupdate: `echo "${name} ALL=(ALL) NOPASSWD: ALL" > /etc/sudoers.d/${name}`,
					};
				} else {
					return {
						sudoersRemove,
						sudoersCreateOrupdate: `echo "" > /etc/sudoers.d/${name}`,
					};
				}
			});

		const extraDirs = pulumi
			.output({
				userHomeFolders: args.userHomeFolders,
				userDir,
				userName: args.name,
			})
			.apply(({ userHomeFolders, userDir, userName }) => {
				if (!userHomeFolders) {
					return "";
				}
				return userHomeFolders
					.map(
						(f) =>
							`mkdir -p ${userDir}/${f} && chown ${userName}:${userName} ${userDir}/${f}`,
					)
					.join(" && ");
			});

		const sshDir = pulumi
			.output({
				canEditOwnSSH: args.canEditOwnSSH,
				userDir,
				userName: args.name,
			})
			.apply(({ userDir, canEditOwnSSH, userName }) => {
				return `mkdir -p ${userDir}/.ssh && touch ${userDir}/.ssh/authorized_keys ${canEditOwnSSH ? `&& chown -R ${userName}:${userName} ${userDir}/.ssh` : ""}`;
			});

		const _createUser = new remote.Command(
			`${name}create-user`,
			{
				connection: args.connection,
				// Create ssh under root so it can't be manipulated by the user itself
				create: shellStrings.asSudoOutput(
					pulumi
						.secret({
							userDir,
							name: args.name,
							password: args.password,
							groups: args.groups,
							sudoersCreateOrupdate,
							extraDirs,
							sshDir,
						})
						// TODO - encrypt it too
						.apply(
							({
								userDir,
								name,
								password,
								groups,
								sudoersCreateOrupdate,
								extraDirs,
								sshDir,
							}) => {
								return `useradd ${groups ? `-G ${groups.join(",")}` : ""} -m -d ${userDir} -p $(openssl passwd -6 "${password}") -s /bin/bash ${name} && ${sshDir} && ${sudoersCreateOrupdate} ${extraDirs ? `&& ${extraDirs}` : ""}`;
							},
						),
				),
				update: shellStrings.asSudoOutput(
					pulumi
						.secret({
							userDir,
							name: args.name,
							password: args.password,
							groups: args.groups,
							sudoersCreateOrupdate,
							extraDirs,
							sshDir,
						})
						.apply(
							({
								userDir,
								name,
								password,
								groups,
								sudoersCreateOrupdate,
								extraDirs,
								sshDir,
							}) =>
								`usermod ${groups ? `-G ${groups.join(",")}` : ""} -m -d ${userDir} -p $(openssl passwd -6 "${password}") ${name} && ${sshDir} && ${sudoersCreateOrupdate} ${extraDirs ? `&& ${extraDirs}` : ""}`,
						),
				),
				// TODO: this is not a complete delete since we aren't cleaning up resources and rebuilding won't create the same id
				delete: shellStrings.asSudoOutput(
					pulumi
						.output({
							name: args.name,
							sudoersRemove,
							connection: args.connection,
						})
						.apply(({ name, sudoersRemove, connection }) => {
							if (name === connection.user) {
								return `echo "Skipping deletion of ${name} since it is expected to be the automation user and would deadlock"`;
							}
							return `userdel ${name} && ${sudoersRemove}`;
						}),
				),
			},
			{
				parent: this,
			},
		);

		this.homeDir = userDir;
		this.userName = pulumi.output(args.name);

		this.registerOutputs({
			homeDir: this.homeDir,
			userName: this.userName,
		});
	}
}
