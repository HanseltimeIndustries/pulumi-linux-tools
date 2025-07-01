import { CopyableAsset } from "@hanseltime/pulumi-file-utils";
import { LinodeInstance, VLAN } from "@hanseltime/pulumi-linode";
import { Network } from "@hanseltime/pulumi-linux";
import {
	IpSetResource,
	IpTablesChain,
	IpTablesInstall,
	IpTablesSave,
	PredefinedRules,
} from "@hanseltime/pulumi-linux-iptables";
import { WireGuardServer } from "@hanseltime/pulumi-linux-vpn";
import * as pulumi from "@pulumi/pulumi";
import * as std from "@pulumi/std";
import { readFileSync } from "fs";
import { homedir } from "os";
import { join } from "path";
import {
	blacklistV4,
	blacklistV6,
	globalBlockIpSetIpv4,
	globalBlockIpSetIpv6,
} from "./iptables";

CopyableAsset.setChangeDetectHashFunction(CopyableAsset.sha256AndLength);

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

const vlan = new VLAN("internal-vlan", "10.0.0.0/24");

const instance = new LinodeInstance("machinetls", {
	label: "machinetls",
	// Can be found by running linode-cli images list --json
	image: "linode/ubuntu24.10 ",
	region: REGION,
	// Can be found by running linode-cli linodes types --json
	type: "g6-nanode-1",
	rootPass: config.requireSecret("rootPassword"),
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
	nonRootUsers: {},
	tags: [],
	vlan: {
		network: vlan,
		ip: "10.0.0.1",
	},
});

const _instance2 = new LinodeInstance("machine2", {
	label: "machine2",
	// Can be found by running linode-cli images list --json
	image: "linode/ubuntu24.10 ",
	region: REGION,
	// Can be found by running linode-cli linodes types --json
	type: "g6-nanode-1",
	rootPass: config.requireSecret("rootPassword"),
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
	nonRootUsers: {},
	tags: [],
	vlan: {
		network: vlan,
		ip: "10.0.0.2",
	},
});

const ipTablesInstall = new IpTablesInstall(
	"iptables-install",
	{
		connection: instance.automationUserConnection,
	},
	{
		dependsOn: [instance],
	},
);

const vpnServer = new WireGuardServer(
	"machinetls-vpn-server",
	{
		connection: instance.automationUserConnection,
		interfaceName: "wg0",
		apt: {
			update: 0,
		},
		network: new Network("machinetls-vpn-network", "10.127.0.0/24"),
		serverIp: "10.127.0.1",
		listenPort: 51820,
		serverKeys: "create-on-server",
		// Note: you could have a vpn that proxies to the internet and has access to the vlan
		// by adding this
		// publicInternet: {
		// 	interface: "eth0",
		// },
		vlan: {
			interface: "eth1",
			cidr: vlan.cidr,
		},
		peers: [
			{
				name: "myvpn",
				ip: "10.127.0.2",
				publicKey: readFileSync(
					join(__dirname, "..", "public_keys", "vpn_myclient"),
				).toString(),
				presharedKey: "create-on-server",
			},
		],
	},
	{
		dependsOn: [instance, ipTablesInstall],
	},
);

// Start Create firewall resources
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
const forwardIpTablesChain = new IpTablesChain(
	"forward-chain",
	{
		name: "FORWARD",
		table: "filter",
		connection: instance.automationUserConnection,
		alreadyCreated: true,
		rulesIpV4: pulumi
			.output({
				fwdRules: vpnServer.ipTablesRules.filter.forward,
			})
			.apply(({ fwdRules }) => [blacklistV4, ...fwdRules]),
		rulesIpV6: [blacklistV6],
	},
	{
		dependsOn: [ipv4BlacklistSet, ipv6BlacklistSet, vpnServer],
	},
);
const inputIpTablesChain = new IpTablesChain(
	"input-v4-chain",
	{
		name: "INPUT",
		table: "filter",
		connection: instance.automationUserConnection,
		alreadyCreated: true,
		rulesIpV4: pulumi
			.output({
				vpnPortIn: vpnServer.port,
			})
			.apply(({ vpnPortIn }) => [
				blacklistV4,
				...PredefinedRules.onlyEgress({
					interface: "eth0",
					exceptionPorts: [
						{
							port: 22,
							protocols: ["tcp", "udp"],
						},
						{
							port: vpnPortIn,
							protocols: ["udp", "tcp"],
						},
					],
				}),
			]),
		rulesIpV6: [
			blacklistV6,
			...PredefinedRules.onlyEgress({
				interface: "eth0",
				exceptionPorts: [
					{
						port: 22,
						protocols: ["tcp", "udp"],
					},
				],
			}),
		],
	},
	{
		dependsOn: [ipv4BlacklistSet, ipv6BlacklistSet],
	},
);
// End Firewall rules

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
		],
	},
	{
		dependsOn: [instance],
	},
);

// Export the linode ipaddress
export const instanceIp: pulumi.Output<string> = instance.instance.ipAddress;
export const automationUser: pulumi.Output<string | undefined> = pulumi.output(
	instance.automationUserConnection.user,
);
export const vpnPublicKey: pulumi.Output<string> = vpnServer.publicKey;
export const vpnPort: pulumi.Output<number> = vpnServer.port;
export const myVpnClientIp: pulumi.Output<string> =
	vpnServer.getPeerAddress("myvpn");
export const myVpnClientPresharedKey: pulumi.Output<string> =
	vpnServer.getPeerPreSharedKey("myvpn");
export const vpnVlanCIDR = vlan.cidr;
