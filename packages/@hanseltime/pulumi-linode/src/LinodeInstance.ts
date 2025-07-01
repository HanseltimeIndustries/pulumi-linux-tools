import { CopyableAsset } from "@hanseltime/pulumi-file-utils";
import {
	LinuxUser,
	SSHDConfig,
	SudoCopyToRemote,
} from "@hanseltime/pulumi-linux";
import { shellStrings } from "@hanseltime/pulumi-linux-base";
import { OutputDependency } from "@hanseltime/pulumi-utils";
import type { types } from "@pulumi/command";
import { remote } from "@pulumi/command";
import * as linode from "@pulumi/linode";
import * as pulumi from "@pulumi/pulumi";
import { createHash } from "crypto";
import { existsSync, mkdirSync, rmSync } from "fs";
import { isAbsolute, join } from "path";
import { getLinodeInfoByLabel, tagLinode } from "./linodeApi";
import type { VLAN } from "./vlan";

const AUTOMATION_LABEL_PREFIX = "hanseltime-pulumi-linode-automation-";
const AUTOMATION_USER_TEMP_DIR = "sudo-copy-tmp";

interface SSHEntry {
	/**
	 * When stored for the user, we will place this public key under .ssh/public_keys with the name
	 */
	name: pulumi.Input<string>;
	key: pulumi.Input<pulumi.asset.Asset | string>;
}

interface LinodeInstanceArgs
	extends Omit<linode.InstanceArgs, "authorizedKeys" | "interfaces"> {
	/**
	 * We require a label so that we can look up some tags for the instance.
	 */
	label: pulumi.Input<string>;
	/**
	 * This is the public key that is applied to the root user for the instance when it it brought up.
	 *
	 * This key needs to be available for the initial creation of the node since we end up doing
	 * ssh commands afterwards via the root user in order to set up the automation user and then lock down
	 * the root user to provide more security.
	 *
	 * MAKE SURE to set this root key is in your automation sshkeys as well, since
	 * all additional remote commands are performed using the automation user on initialization.
	 *
	 * You SHOULD NEVER change this after the initialization because it will trigger a full replacement
	 * of the machine.  Instead, look at the automation user sshkeys and change those when a rotation is necessary.
	 */
	initialRootKey: pulumi.Input<string>;
	/**
	 * Explicit users that we want created for us.  Note, some installations like apache and mysql
	 * create their own and don't need this declared here
	 */
	nonRootUsers: {
		[user: string]: {
			/**
			 * The password to configure for the user - do not commit it.  Use a config set --secret entry
			 */
			password: pulumi.Input<string>;
			/**
			 * Any ssh keys that are allowed to login as the user
			 */
			sshKeys?: pulumi.Input<pulumi.Input<SSHEntry>[]>;

			groups: pulumi.Input<pulumi.Input<string>[]>;
		};
	};
	/**
	 * To lockdown the linode, we end up creating a sudoer (without password) that this pulumi
	 * automation will use.  In general, this adds a little more security by obscurity since
	 * we create a dynamic username unless you specify the name and lots of blind attacks
	 * can take advantage of the known root user.
	 *
	 * Important note - during initial deployment, this key is also applied to the root
	 * user and then is removed for the root user once the automation user is set up.
	 */
	automationUser: {
		/**
		 * This is if you want a deterministic name.  Otherwise, we create a pulumi<hash> user
		 * that will be the automation user.
		 */
		name?: pulumi.Input<string>;
		/**
		 * The user password for the automation user.
		 */
		password: pulumi.Input<string>;
		/**
		 * These are the keys that should be given access to the automation user.
		 *
		 * We use multiple here in particular for key rotation purposes
		 */
		sshKeys: pulumi.Input<pulumi.Input<SSHEntry>[]>;
	};
	vlan?: {
		network: VLAN;
		/**
		 * The ip of this specific machine on that VLAN
		 */
		ip: pulumi.Input<string>;
	};
	/**
	 * The private sshKey that you supplied (either by file lookup on the system or as some secret pulled from a secret location)
	 * That matches one of the root public ssh keys (either the initialRootKey or the rootUser) that have already been
	 * deployed. This is used for performing machine updates via ssh.
	 *
	 * Important - on create, this has to match the initialRootKey, since that will be the only key available after starting a base
	 * machine.  If you disable the initialRootKey, you will need to make sure that the private key matches a rootUser.sshKey[]
	 * that already was uploade before the disable call.
	 */
	sshKey: pulumi.Input<string>;
	/**
	 * The ssh password for the key provided for machine updates via ssh
	 */
	sshKeyPassword: pulumi.Input<string>;
	/**
	 * If supplied, this is where this component will create public key archives for each user
	 *
	 * Must be relative to the root project so it can be run on any other machines
	 */
	tmpDir?: string;
	/**
	 * If you feel like files did not get uploaded, this will upload them when you change the number
	 */
	reuploadId?: number;
	/**
	 * You can configure additional sshd configuration options here by adding key: value
	 *
	 * This ultimately creates the SSHDConfig resource from '@hanseltime/pulumi-linux`
	 */
	sshdConfig?: {
		[sshdKey: string]: string;
	};
}

/**
 * An improved Linode Instance with better arguments so that we can update things on the machine without triggering
 * reboots, etc.
 */
export class LinodeInstance extends pulumi.ComponentResource {
	private tmpDir: string;
	private name: string;
	/**
	 * This is information for the automation user to use with other pulumi resources that
	 * should be applied via this user
	 */
	automationUserHomeDir: pulumi.Output<string>;
	automationUserConnection: pulumi.Output<types.input.remote.ConnectionArgs>;
	automationUserSudoCopyTmpDir: pulumi.Output<string>;
	instance: linode.Instance;
	vlanIp: pulumi.Output<string> | undefined;

	constructor(
		name: string,
		args: LinodeInstanceArgs,
		opts?: pulumi.ComponentResourceOptions,
	) {
		super("hanseltime:linode:LinodeInstance", name, args, opts);

		this.name = name;
		this.tmpDir = args.tmpDir ?? "./tmp";
		if (isAbsolute(this.tmpDir)) {
			throw new Error(
				"Must provide a relative tmp directory for cross-platform compatibility!",
			);
		}

		const automationTag = pulumi.output(args.label).apply(async (label) => {
			const info = await getLinodeInfoByLabel(label);
			return info?.tags.find((t) => t.startsWith(AUTOMATION_LABEL_PREFIX));
		});

		const instance = new linode.Instance(
			`${name}instance`,
			{
				...args,
				authorizedKeys: [args.initialRootKey],
				interfaces: [
					{
						// Public internet interface is always eth0
						purpose: "public",
					},
					// Add a vlan network interface if provided with the ip providedunt for new resources of a given type, finds which new resources are not yet tracked by Pulumi, imports them and sends a Ch
					...(args.vlan
						? [
								pulumi
									.output(args.vlan.ip)
									.apply((ip) => args.vlan!.network.getInterfaceEntry(ip)),
							]
						: []),
				],
				tags: pulumi
					.output({
						automationTagIn: automationTag,
						tags: args.tags,
					})
					.apply(({ automationTagIn, tags }) => {
						return [
							...(tags ?? []),
							...(automationTagIn ? [automationTagIn] : []),
						];
					}),
			},
			{
				parent: this,
			},
		);
		this.instance = instance;

		const automationUserName = pulumi
			.output({
				automationTagIn: automationTag,
				automationName:
					args.automationUser.name ?? this.createRandomAutomationUserName(),
			})
			.apply(({ automationTagIn, automationName }) => {
				if (automationTagIn) {
					return automationTagIn.replace(AUTOMATION_LABEL_PREFIX, "");
				}
				return automationName;
			});

		const connection = pulumi
			.output({
				automationTagIn: automationTag,
				automationUserNameIn: automationUserName,
				ipAddress: instance.ipAddress,
				privateKey: pulumi.secret(args.sshKey),
				privateKeyPassword: pulumi.secret(args.sshKeyPassword),
			})
			.apply(
				async ({
					automationTagIn,
					automationUserNameIn,
					ipAddress,
					privateKey,
					privateKeyPassword,
				}) => {
					if (automationTagIn) {
						return {
							host: ipAddress,
							user: automationUserNameIn,
							privateKey,
							privateKeyPassword,
						};
					} else {
						return {
							host: ipAddress,
							user: "root",
							privateKey,
							privateKeyPassword,
						};
					}
				},
			);

		const automationUser = new LinuxUser(
			`${name}automationuser`,
			{
				connection,
				name: automationUserName,
				password: args.automationUser.password,
				groups: ["sudo"],
				passwordlessSudo: true,
				userHomeFolders: [AUTOMATION_USER_TEMP_DIR],
				canEditOwnSSH: true,
			},
			{
				dependsOn: [instance],
				parent: this,
			},
		);

		const automationUserPropsConneciton = pulumi
			.output({
				automationTagIn: automationTag,
				automationUserNameIn: automationUserName,
				ipAddress: instance.ipAddress,
				privateKey: pulumi.secret(args.sshKey),
				privateKeyPassword: pulumi.secret(args.sshKeyPassword),
				userPassword: args.automationUser.password,
			})
			.apply(
				async ({
					automationTagIn,
					automationUserNameIn,
					ipAddress,
					privateKey,
					privateKeyPassword,
					userPassword,
				}) => {
					// If there's an automation tag then we've already added these keys and will use keys
					if (automationTagIn) {
						return {
							host: ipAddress,
							user: automationUserNameIn,
							privateKey,
							privateKeyPassword,
						};
					} else {
						return {
							host: ipAddress,
							user: automationUserNameIn,
							password: userPassword,
						};
					}
				},
			);

		const addAutomationSSHKeys = this.createSSHKeys(
			`${name}automationuser`,
			automationUserName,
			{
				sshKeys: pulumi.output(args.automationUser.sshKeys).apply((sshKeys) => {
					if (sshKeys.length === 0) {
						throw new pulumi.InputPropertyError({
							propertyPath: "automationUser.sshKeys",
							reason:
								"Must have at least one public ssh key for pulumi to use the automation user",
						});
					}
					return sshKeys;
				}),
				connection: automationUserPropsConneciton,
				userHomeDir: automationUser.homeDir,
				userTmpDir: automationUser.homeDir.apply(
					(homeDir) => `${homeDir}/${AUTOMATION_USER_TEMP_DIR}`,
				),
				reuploadId: args.reuploadId,
				noNeedToSudoUpload: true,
			},
			{
				dependsOn: [automationUser],
			},
		);

		const tagLinodeWithReadyUser = new OutputDependency(
			`${name}addautomationusertag`,
			{
				output: pulumi
					.output({
						nameIn: automationUserName,
						id: instance.id,
						automationTagIn: automationTag,
						// We add it here to ensure a dependency on there being valid ssh keys
						_stdout: addAutomationSSHKeys.stdout,
					})
					.apply(async ({ nameIn, id, automationTagIn }) => {
						if (!automationTagIn) {
							await tagLinode(
								`${AUTOMATION_LABEL_PREFIX}${nameIn}`,
								parseInt(id),
							);
						}
					}),
			},
			{
				parent: this,
				dependsOn: [addAutomationSSHKeys],
			},
		);

		this.automationUserHomeDir = automationUser.homeDir;
		this.automationUserSudoCopyTmpDir = automationUser.homeDir.apply(
			(homeDir) => `${homeDir}/${AUTOMATION_USER_TEMP_DIR}`,
		);
		this.automationUserConnection = pulumi
			.output({
				ipAddress: instance.ipAddress,
				nameIn: automationUser.userName,
				privateKey: args.sshKey,
				privateKeyPassword: args.sshKeyPassword,
			})
			.apply(({ ipAddress, nameIn, privateKey, privateKeyPassword }) => {
				return {
					host: ipAddress,
					user: nameIn,
					privateKey,
					privateKeyPassword,
				};
			});

		// Let's go ahead and run under the automation connection and then button up sshd_config
		const sshdUpdate = new SSHDConfig(
			`${name}-sshd-update`,
			{
				connection: this.automationUserConnection,
				config: {
					PermitRootLogin: "no",
					PasswordAuthentication: "no",
					...args.sshdConfig,
				},
			},
			{
				parent: this,
				dependsOn: [addAutomationSSHKeys, tagLinodeWithReadyUser],
			},
		);

		// Create users and their SSH keys
		const _users = Object.keys(args.nonRootUsers).map((userName) => {
			const userInfo = args.nonRootUsers[userName];
			const user = new LinuxUser(
				`${name}${userName}`,
				{
					connection: this.automationUserConnection,
					name: userName,
					password: userInfo.password,
					groups: userInfo.groups,
				},
				{
					parent: this,
					dependsOn: [
						instance,
						addAutomationSSHKeys,
						sshdUpdate,
						tagLinodeWithReadyUser,
					],
				},
			);

			if (userInfo.sshKeys) {
				this.createSSHKeys(
					`${name}${userName}`,
					userName,
					{
						sshKeys: userInfo.sshKeys,
						connection: this.automationUserConnection,
						userHomeDir: user.homeDir,
						reuploadId: args.reuploadId,
						userTmpDir: automationUser.homeDir.apply(
							(homeDir) => `${homeDir}/${AUTOMATION_USER_TEMP_DIR}`,
						),
					},
					{
						dependsOn: [
							user,
							addAutomationSSHKeys,
							sshdUpdate,
							tagLinodeWithReadyUser,
						],
					},
				);
			}
			return user;
		});
		this.vlanIp = args.vlan ? pulumi.output(args.vlan.ip) : undefined;
		this.registerOutputs({
			automationUserConnection: this.automationUserConnection,
			automationUserHomeDir: this.automationUserHomeDir,
			automationUserSudoCopyTmpDir: this.automationUserSudoCopyTmpDir,
			vlanIp: this.vlanIp,
		});
	}

	private createSSHKeys(
		// pulumi doesn't seem to prefix with parents
		name: string,
		userName: pulumi.Input<string>,
		args: {
			sshKeys: pulumi.Input<pulumi.Input<SSHEntry>[]>;
			userHomeDir: pulumi.Input<string>;
			userTmpDir: pulumi.Input<string>;
			connection: pulumi.Input<types.input.remote.ConnectionArgs>;
			reuploadId?: number;
			noNeedToSudoUpload?: boolean;
		},
		opts?: {
			// If a resource is necessary (like the LinuxUser)
			dependsOn: pulumi.Resource[];
		},
	) {
		const { sshKeys, userHomeDir, connection } = args;
		pulumi.output(userName).apply((userNameIn) => {
			const dir = join(this.tmpDir, `linodeinstance`, this.name, userNameIn);
			const pubDir = join(dir, "public_keys");
			if (existsSync(pubDir)) {
				rmSync(pubDir, {
					recursive: true,
				});
			}
			mkdirSync(pubDir, { recursive: true });
			return pubDir;
		});
		const publicKeysAsset = CopyableAsset.fromParent(this, `${name}-ssh-keys`, {
			asset: pulumi.output(sshKeys).apply((sshKeysIn) => {
				return new pulumi.asset.AssetArchive(
					sshKeysIn.reduce((assetMap, key) => {
						assetMap[key.name] =
							typeof key.key === "string"
								? new pulumi.asset.StringAsset(key.key)
								: key.key;
						return assetMap;
					}, {} as pulumi.asset.AssetMap),
				);
			}),
			tmpCopyDir: this.tmpDir,
			synthName: "public_keys",
		});
		const clear = new remote.Command(
			`${name}-clear-previous-keys`,
			{
				connection,
				// Remove the public keys here so we can upload the new set without keeping old ones
				// echo the date so we can tell when this is changed and make sure to copy
				create: shellStrings.asSudoOutput(
					pulumi
						.output(userHomeDir)
						.apply(
							(home) =>
								`${shellStrings.deleteDirElements(`${home}/.ssh/public_keys`)} && echo "$(date)"`,
						),
				),
				triggers: [publicKeysAsset.copyableSource, args.reuploadId],
			},
			{
				parent: this,
				dependsOn: opts?.dependsOn,
			},
		);
		let copy: SudoCopyToRemote | remote.CopyToRemote;
		if (args.noNeedToSudoUpload) {
			copy = new remote.CopyToRemote(
				`${name}-public-keys`,
				{
					connection,
					source: publicKeysAsset.copyableSource,
					// need the absolute path since we can't use shell variables
					remotePath: pulumi
						.output(userHomeDir)
						.apply((home) => `${home}/.ssh`),
					triggers: [clear.stdout, args.reuploadId],
				},
				{
					parent: this,
					dependsOn: [clear],
				},
			);
		} else {
			copy = new SudoCopyToRemote(
				`${name}-public-keys`,
				{
					connection,
					source: publicKeysAsset.copyableSource,
					// need the absolute path since we can't use shell variables
					remotePath: pulumi
						.output(userHomeDir)
						.apply((home) => `${home}/.ssh`),
					triggers: [clear.stdout, args.reuploadId],
					userTmpPath: args.userTmpDir,
				},
				{
					parent: this,
					dependsOn: [clear],
				},
			);
		}

		const updateAuthorizedKeys = new remote.Command(
			`${name}-update-authorized-keys`,
			{
				connection,
				// Pulled from https://www.linode.com/community/questions/21095/how-to-add-an-ssh-key-to-an-existing-linode
				create: shellStrings.asSudoOutput(
					pulumi.output(userHomeDir).apply(
						(home) =>
							// Since we are using a root/admin user to not allow logged on users to change their own keys, we have to 755
							// Additionally, this will mean that we don't change the automation user afterwards
							// Somehow readonly doesn't work
							`cat ${home}/.ssh/public_keys/* > ${home}/.ssh/authorized_keys && chmod -R 755 ${home}/.ssh`,
					),
				),
				triggers: [
					copy.source,
					// Sometimaes source reads as the same
					clear.stdout,
					args.reuploadId,
				],
			},
			{
				parent: this,
				dependsOn: [copy],
			},
		);
		return updateAuthorizedKeys;
	}

	private createRandomAutomationUserName() {
		var shasum = createHash("sha1");
		shasum.update(new Date().toString());
		return `pulumi${shasum.digest("hex").substring(0, 6)}`;
	}
}
