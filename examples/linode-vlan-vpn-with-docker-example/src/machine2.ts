/**
 * This would probably be something like your business application machine
 * with application containers that you actually expose to the public internet.
 *
 * Right now, we've just restricted everything for VLAN only access.
 */

import { LinodeInstance } from "@hanseltime/pulumi-linode";
import {
	CAdvisorService,
	DockerInstall,
	NodeExporterService,
	PrometheusWithDockerSD,
} from "@hanseltime/pulumi-linux-docker";
import {
	IpSetResource,
	IpTablesChain,
	IpTablesHelper,
	IpTablesInstall,
	IpTablesSave,
	PredefinedRules,
} from "@hanseltime/pulumi-linux-iptables";
import * as pulumi from "@pulumi/pulumi";
import {
	config,
	deployPrivateKey,
	initialRootKey1,
	REGION,
	vlan,
} from "./constants";
import {
	blacklistV4,
	blacklistV6,
	globalBlockIpSetIpv4,
	globalBlockIpSetIpv6,
} from "./iptables";
import { toolsInstance } from "./machineWithVpn";

const instance2 = new LinodeInstance("machine2", {
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

// Start Create firewall resources
const ipTablesInstall = new IpTablesInstall(
	"machine2-iptables-install",
	{
		connection: instance2.automationUserConnection,
	},
	{
		dependsOn: [instance2],
	},
);
const ipv4BlacklistSet = new IpSetResource(
	"machine2-ipv4-blacklist",
	{
		connection: instance2.automationUserConnection,
		ipSet: globalBlockIpSetIpv4,
	},
	{
		dependsOn: [instance2, ipTablesInstall],
	},
);

const ipv6BlacklistSet = new IpSetResource(
	"machine2-ipv6-blacklist",
	{
		connection: instance2.automationUserConnection,
		ipSet: globalBlockIpSetIpv6,
	},
	{
		dependsOn: [instance2, ipTablesInstall],
	},
);

// These are the normal chains on the linode - they cover all non-docker firewalls
const forwardIpTablesChain = new IpTablesChain(
	"machine2-forward-chain",
	{
		name: "FORWARD",
		table: "filter",
		connection: instance2.automationUserConnection,
		alreadyCreated: true,
		rulesIpV4: [blacklistV4],
		rulesIpV6: [blacklistV6],
	},
	{
		dependsOn: [ipv4BlacklistSet, ipv6BlacklistSet],
	},
);
const inputIpTablesChain = new IpTablesChain(
	"machine2-input-v4-chain",
	{
		name: "INPUT",
		table: "filter",
		connection: instance2.automationUserConnection,
		alreadyCreated: true,
		rulesIpV4: [
			blacklistV4,
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

// Install Docker so that we can add monitoring stacks as containers
const dockerInstall = new DockerInstall(
	"machine2-docker-install",
	{
		connection: instance2.automationUserConnection,
		homeDir: instance2.automationUserHomeDir,
		sudoCopyTmpDir: instance2.automationUserSudoCopyTmpDir,
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
				// Respect the blacklist and we only expect to allow access via the VLAN for docker containers on this machine
				blacklistV4,
				...PredefinedRules.onlyEgress({
					interface: "eth0",
					exceptionPorts: [],
				}),
			]),
			ipv6: IpTablesHelper.convertDestIPAndPortToConnTrack([
				// Respect the blacklist and we only expect to allow access via the VLAN for docker containers on this machine
				blacklistV6,
				...PredefinedRules.onlyEgress({
					interface: "eth0",
					exceptionPorts: [],
				}),
			]),
		},
		// We aren't running anything that needs zero-downtime on this machine
		blueGreen: false,
	},
	{
		dependsOn: [instance2, ipTablesInstall],
	},
);

// Set up a lightweight scraping agent that sends its information over VLAN to the central prometheus
const scrapePrometheus = new PrometheusWithDockerSD(
	"machine2-prometheus",
	{
		serviceName: "prometheus-agent",
		mode: "agent",
		connection: instance2.automationUserConnection,
		homeDir: instance2.automationUserHomeDir,
		tmpCopyDir: "./tmp",
		expose: {
			port: 9091,
			// Expose on the loopback and the internal VLAN so we can reach it over the network
			interfaceIps: ["127.0.0.1", instance2.vlanIp!],
		},
		usernsRemap: dockerInstall.usernsRemap,
		dockerSocketNetworkCIDR:
			dockerInstall.defaultInternalNetworkRange.claimIPCIDR(
				"172.255.0.64/26",
				"prometheus-socket-access",
			).cidr,
		upArgs: ["--force-recreate"],
		cliFlags: ["--web.enable-lifecycle"],
		dockerServiceDiscovery: {
			relabel_configs: [
				{
					// We'll add a host name here for us
					target_label: "host",
					replacement: instance2.instance.label,
				},
			],
		},
		prometheusConfig: {
			remote_write: [
				{
					url: pulumi
						.output({
							host: toolsInstance.vlanIp,
							port: 9090,
						})
						.apply(({ host, port }) => `http://${host}:${port}/api/v1/write`),
				},
			],
		},
		service: {
			image: "prom/prometheus:v3.4.2", // TODO - remove once prometheus fixes their broken latest tag being v2
		},
	},
	{
		dependsOn: [dockerInstall],
	},
);

new CAdvisorService(
	"machine2-cadvisor",
	{
		connection: instance2.automationUserConnection,
		homeDir: instance2.automationUserHomeDir,
		tmpCopyDir: "./tmp",
		usernsRemap: dockerInstall.usernsRemap,
		expose: {
			port: 8080,
			interfaceIps: ["127.0.0.1"], // Just put on loopback and use the prometheus agent to check connections
		},
		dockerSocketNetworkCIDR:
			dockerInstall.defaultInternalNetworkRange.claimIPCIDR(
				"172.255.1.0/26",
				"cadvisor-socket-access",
			).cidr,
		monitoringNetwork: scrapePrometheus.monitoringNetwork,
	},
	{
		dependsOn: [dockerInstall, scrapePrometheus],
	},
);

new NodeExporterService(
	"machine2-nodeexporter",
	{
		connection: instance2.automationUserConnection,
		homeDir: instance2.automationUserHomeDir,
		tmpCopyDir: "./tmp",
		usernsRemap: dockerInstall.usernsRemap,
		expose: {
			port: 8081,
			interfaceIps: ["127.0.0.1", dockerInstall.defaultDockerGatewayIP], // Just put on loopback and docker bridge - connect to prometheus agent to verify target
		},
	},
	{
		dependsOn: [dockerInstall],
	},
);

// Make sure that we persist the configuration from these chains
new IpTablesSave(
	"machine2-save-config",
	{
		connection: instance2.automationUserConnection,
		ipTablesResources: [
			ipv4BlacklistSet,
			ipv6BlacklistSet,
			forwardIpTablesChain,
			inputIpTablesChain,
			dockerInstall.dockerUserIpTablesChain,
		],
	},
	{
		dependsOn: [instance2, dockerInstall],
	},
);
