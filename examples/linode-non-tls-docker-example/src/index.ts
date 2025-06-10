import * as pulumi from "@pulumi/pulumi";
import * as std from "@pulumi/std";
import { join } from "path";
import { LinodeInstance } from "@hanseltime/pulumi-linode";
import { homedir } from "os";
import { readFileSync } from "fs";
import {
	IpSetResource,
	IpTablesChain,
	IpTablesHelper,
	IpTablesInstall,
	IpTablesSave,
} from "@hanseltime/pulumi-linux-iptables";
import {
	blacklistV4,
	blacklistV6,
	globalBlockIpSetIpv4,
	globalBlockIpSetIpv6,
} from "./iptables";
import {
	DockerComposeService,
	DockerDeployType,
	DockerInstall,
} from "@hanseltime/pulumi-linux-docker";
import { TraefikRouteRule } from "@hanseltime/traefik";

const config = new pulumi.Config();
const REGION = config.require("linodeRegion");

const publicKeysDirectory = join(__dirname, "..", "public_keys");

const initialRootKeyName = config.require("deploymentSSHKey");

const initialRootKey1 = std
	.file({
		input: join(publicKeysDirectory, initialRootKeyName),
	})
	.then((invoke) =>
		std.chomp({
			input: invoke.result,
		}),
	)
	.then((invoke) => invoke.result);

// We'll get the initial key that was also generated on our machine, we could also technically have saved the key
// to a secret or loaded it onto the machine if it was a CI/CD machine.
const deployPrivateKey = pulumi.secret(
	readFileSync(
		join(
			homedir(),
			".ssh",
			initialRootKeyName.substring(0, initialRootKeyName.lastIndexOf(".")) ||
				initialRootKeyName,
		),
	).toString(),
);

const instance = new LinodeInstance("machine1", {
	label: "machine1",
	// Can be found by running linode-cli images list --json
	image: "linode/ubuntu24.10 ",
	region: REGION,
	// Can be found by running linode-cli linodes types --json
	type: "g6-nanode-1",
	rootPass: config.require("rootPassword"),
	initialRootKey: initialRootKey1,
	sshKey: deployPrivateKey,
	sshKeyPassword: config.requireSecret("sshPassword"),
	automationUser: {
		password: config.requireSecret("automationUserPassword"),
		sshKeys: [
			{
				name: "cicd_key",
				key: initialRootKey1,
			},
		],
	},
	nonRootUsers: {
		// TODO - you could add your own admin users for troubleshooting for your ops admins
	},
	tags: [],
	// no vlan for this example, but it would be more secure if you could keep things in a vlan
});

// Start Create firewall resources
const ipTablesInstall = new IpTablesInstall(
	"iptables-install",
	{
		connection: instance.automationUserConnection,
	},
	{
		dependsOn: [instance],
	},
);
const ipv4BlacklistSet = new IpSetResource(
	"ipv4-blacklist",
	{
		connection: instance.automationUserConnection,
		ipSet: globalBlockIpSetIpv4,
	},
	{
		dependsOn: [instance, ipTablesInstall],
	},
);

const ipv6BlacklistSet = new IpSetResource(
	"ipv6-blacklist",
	{
		connection: instance.automationUserConnection,
		ipSet: globalBlockIpSetIpv6,
	},
	{
		dependsOn: [instance, ipTablesInstall],
	},
);

// These are the normal chains on the linode - they cover all non-docker firewalls
const baseRules = {
	rulesIpV4: [blacklistV4],
	rulesIpV6: [blacklistV6],
};
const forwardIpTablesChain = new IpTablesChain(
	"forward-chain",
	{
		name: "FORWARD",
		table: "filter",
		connection: instance.automationUserConnection,
		alreadyCreated: true,
		...baseRules,
	},
	{
		dependsOn: [ipv4BlacklistSet, ipv6BlacklistSet],
	},
);
const inputIpTablesChain = new IpTablesChain(
	"input-v4-chain",
	{
		name: "INPUT",
		table: "filter",
		connection: instance.automationUserConnection,
		alreadyCreated: true,
		...baseRules,
	},
	{
		dependsOn: [ipv4BlacklistSet, ipv6BlacklistSet],
	},
);
// End Firewall rules

// Start Docker Resources
const dockerInstall = new DockerInstall(
	"machine1-docker-install",
	{
		connection: instance.automationUserConnection,
		homeDir: instance.automationUserHomeDir,
		sudoCopyTmpDir: instance.automationUserSudoCopyTmpDir,
		connectionIsRoot: false,
		tmpCopyDir: "./tmp",
		networking: {
			// We don't anticipate having that many pods on the default network
			default: "172.17.0.1/24",
			// Almost all traffic will go through blue green
			blueGreen: "172.18.0.0/16",
		},
		firewall: {
			ipv4: IpTablesHelper.convertDestIPAndPortToConnTrack([
				// Make sure we keep the base rules and then we can add others
				...baseRules.rulesIpV4,
			]),
			ipv6: IpTablesHelper.convertDestIPAndPortToConnTrack([
				...baseRules.rulesIpV6,
			]),
		},
		blueGreen: {
			staticConfig: {
				entryPoints: {
					web: {
						address: ":80",
					},
				},
				// Keep a provider here in case we want to upload dynamic configs
				// if you add it later, the traefik needs downtime
				providers: {
					file: {
						directory: "/etc/traefik/dynamic",
					},
				},
			},
			mounts: [
				{
					// Per traefik, use a directory for reloads to not be missed
					name: "dynamic",
					onContainer: "/etc/traefik/dynamic",
					resource: new pulumi.asset.AssetArchive({
						placeholder: new pulumi.asset.StringAsset(
							"This is a placeholder file.  Normally, you'll add more dynamic configuration .yml files",
						),
						other: new pulumi.asset.StringAsset("heyooo"),
					}),
				},
			],
		},
	},
	{
		dependsOn: [ipv6BlacklistSet, ipv4BlacklistSet, instance],
	},
);

new DockerComposeService(
	"basic-server-replace",
	{
		name: "basic-server-replace",
		connection: instance.automationUserConnection,
		homeDir: instance.automationUserHomeDir,
		tmpCopyDir: "./tmp",
		deployType: DockerDeployType.Replace,
		service: {
			build: {
				context: new pulumi.asset.FileArchive("../test-server"),
			},
			healthcheck: "NO_SHELL",
			ports: ["8089:3000"],
			// testuser
			user: {
				userId: 10001,
				groupId: 10005,
			},
			restart: "unless-stopped",
		},
		secrets: [
			{
				name: "huh",
				value: "something22",
			},
		],
		mounts: [
			{
				name: "mountedVolumeTest",
				onContainer: "/var/mountedvolume",
				resource: new pulumi.asset.AssetArchive({
					"file1.txt": new pulumi.asset.StringAsset("This is file 1"),
					"file2.json": new pulumi.asset.StringAsset(
						JSON.stringify({ val: "this is file2" }),
					),
				}),
			},
		],
		usernsRemap: dockerInstall.usernsRemap,
	},
	{
		dependsOn: [dockerInstall],
	},
);

// For our server that does blue-green, we route all traffic to it through the blue-green gateway
// In reality, having something like host or even path routing is more preferrable
new DockerComposeService(
	"basic-server-bluegreen",
	{
		name: "basic-server-bg",
		connection: instance.automationUserConnection,
		homeDir: instance.automationUserHomeDir,
		tmpCopyDir: "./tmp",
		deployType: DockerDeployType.BlueGreen,
		service: {
			image: "traefik/whoami",
			command: ["--name=newName"],
			healthcheck: "NO_SHELL",
			user: "ROOT_USER",
		},
		blueGreen: {
			networkName: dockerInstall.blueGreenNetwork,
			ports: [
				{
					entrypoint: "web",
					local: 80,
					rule: TraefikRouteRule.pathPrefix("/"),
					healthCheck: {
						path: "/",
					},
					tls: false,
				},
			],
		},
		usernsRemap: dockerInstall.usernsRemap,
	},
	{
		dependsOn: [dockerInstall],
	},
);

// Make sure that we persist the configuration from these chains
new IpTablesSave(
	"save-config",
	{
		connection: instance.automationUserConnection,
		ipTablesResources: [
			ipv4BlacklistSet,
			ipv6BlacklistSet,
			forwardIpTablesChain,
			inputIpTablesChain,
			dockerInstall.dockerUserIpTablesChain,
		],
	},
	{
		dependsOn: [instance],
	},
);

// Export the linode ipaddress
export const instanceIp: pulumi.Output<string> = instance.instance.ipAddress;
