import { shellStrings } from "@hanseltime/pulumi-linux-base";
import type { types } from "@pulumi/command";
import { remote } from "@pulumi/command";
import * as pulumi from "@pulumi/pulumi";
import { LIBRARY_PREFIX } from "./constants";

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
				nameIn: args.name,
			})
			.apply(({ passwordlessSudo, groups, nameIn }) => {
				if (passwordlessSudo && !groups.includes("sudo")) {
					throw new pulumi.InputPropertyError({
						propertyPath: "passwordlessSudo",
						reason:
							"Cannot set passwordless sudo without a sudo group membership",
					});
				}

				const sudoersRemoveIn = `if [ -f "/etc/sudoers.d/${nameIn}" ]; then rm "/etc/sudoers.d/${nameIn}"; fi`;

				if (passwordlessSudo) {
					return {
						sudoersRemove: sudoersRemoveIn,
						sudoersCreateOrupdate: `echo "${nameIn} ALL=(ALL) NOPASSWD: ALL" > /etc/sudoers.d/${nameIn}`,
					};
				} else {
					return {
						sudoersRemove: sudoersRemoveIn,
						sudoersCreateOrupdate: `echo "" > /etc/sudoers.d/${nameIn}`,
					};
				}
			});

		const extraDirs = pulumi
			.output({
				userHomeFolders: args.userHomeFolders,
				userDirIn: userDir,
				userName: args.name,
			})
			.apply(({ userHomeFolders, userDirIn, userName }) => {
				if (!userHomeFolders) {
					return "";
				}
				return userHomeFolders
					.map(
						(f) =>
							`mkdir -p ${userDirIn}/${f} && chown ${userName}:${userName} ${userDirIn}/${f}`,
					)
					.join(" && ");
			});

		const sshDir = pulumi
			.output({
				canEditOwnSSH: args.canEditOwnSSH,
				userDirIn: userDir,
				userName: args.name,
			})
			.apply(({ userDirIn, canEditOwnSSH, userName }) => {
				return `mkdir -p ${userDirIn}/.ssh && touch ${userDirIn}/.ssh/authorized_keys ${canEditOwnSSH ? `&& chown -R ${userName}:${userName} ${userDirIn}/.ssh` : ""}`;
			});

		const _createUser = new remote.Command(
			`${name}create-user`,
			{
				connection: args.connection,
				// Create ssh under root so it can't be manipulated by the user itself
				create: shellStrings.asSudoOutput(
					pulumi
						.secret({
							userDirIn: userDir,
							nameIn: args.name,
							password: args.password,
							groups: args.groups,
							sudoersCreateOrupdateIn: sudoersCreateOrupdate,
							extraDirsIn: extraDirs,
							sshDirIn: sshDir,
						})
						// TODO - encrypt it too
						.apply(
							({
								userDirIn,
								nameIn,
								password,
								groups,
								sudoersCreateOrupdateIn,
								extraDirsIn,
								sshDirIn,
							}) => {
								return `useradd ${groups ? `-G ${groups.join(",")}` : ""} -m -d ${userDirIn} -p $(openssl passwd -6 '${password}') -s /bin/bash ${nameIn} && ${sshDirIn} && ${sudoersCreateOrupdateIn} ${extraDirsIn ? `&& ${extraDirsIn}` : ""}`;
							},
						),
				),
				update: shellStrings.asSudoOutput(
					pulumi
						.secret({
							userDirIn: userDir,
							nameIn: args.name,
							password: args.password,
							groups: args.groups,
							sudoersCreateOrupdateIn: sudoersCreateOrupdate,
							extraDirsIn: extraDirs,
							sshDirIn: sshDir,
						})
						.apply(
							({
								userDirIn,
								nameIn,
								password,
								groups,
								sudoersCreateOrupdateIn,
								extraDirsIn,
								sshDirIn,
							}) =>
								`usermod ${groups ? `-G ${groups.join(",")}` : ""} -m -d ${userDirIn} -p $(openssl passwd -6 '${password}') ${nameIn} && ${sshDirIn} && ${sudoersCreateOrupdateIn} ${extraDirsIn ? `&& ${extraDirsIn}` : ""}`,
						),
				),
				// TODO: this is not a complete delete since we aren't cleaning up resources and rebuilding won't create the same id
				delete: shellStrings.asSudoOutput(
					pulumi
						.output({
							nameIn: args.name,
							sudoersRemoveIn: sudoersRemove,
							connection: args.connection,
						})
						.apply(({ nameIn, sudoersRemoveIn, connection }) => {
							if (nameIn === connection.user) {
								return `echo "Skipping deletion of ${nameIn} since it is expected to be the automation user and would deadlock"`;
							}
							return `userdel ${nameIn} && ${sudoersRemoveIn}`;
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
