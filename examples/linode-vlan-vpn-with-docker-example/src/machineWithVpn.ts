import { LinodeInstance } from "@hanseltime/pulumi-linode";
import { Network } from "@hanseltime/pulumi-linux";
import {
	CAdvisorService,
	DockerInstall,
	GrafanaService,
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
import { WireGuardServer } from "@hanseltime/pulumi-linux-vpn";
import * as pulumi from "@pulumi/pulumi";
import * as grafana from "@pulumiverse/grafana";
import { readFileSync } from "fs";
import { join } from "path";
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

export const toolsInstance = new LinodeInstance("machineWithVpn", {
	label: "machineWithVpn",
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

const ipTablesInstall = new IpTablesInstall(
	"machineWithVpn-iptables-install",
	{
		connection: toolsInstance.automationUserConnection,
	},
	{
		dependsOn: [toolsInstance],
	},
);

export const vpnServer = new WireGuardServer(
	"machineWithVpn-vpn-server",
	{
		connection: toolsInstance.automationUserConnection,
		interfaceName: "wg0",
		apt: {
			update: 0,
		},
		network: new Network("machineWithVpn-vpn-network", "10.127.0.0/24"),
		serverIp: "10.127.0.1",
		listenPort: 51820,
		serverKeys: "create-on-server",
		// Note: you could have a vpn that proxies to the internet and has access to the vlan
		// by adding this
		// publicInternet: {
		// 	interface: "eth0",
		// },
		vlan: {
			interface: toolsInstance.vlanIp!,
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
		dependsOn: [ipTablesInstall, toolsInstance],
	},
);

// Start Create firewall resources
const ipv4BlacklistSet = new IpSetResource(
	"machineWithVpn-ipv4-blacklist",
	{
		connection: toolsInstance.automationUserConnection,
		ipSet: globalBlockIpSetIpv4,
	},
	{
		dependsOn: [toolsInstance, ipTablesInstall],
	},
);

const ipv6BlacklistSet = new IpSetResource(
	"machineWithVpn-ipv6-blacklist",
	{
		connection: toolsInstance.automationUserConnection,
		ipSet: globalBlockIpSetIpv6,
	},
	{
		dependsOn: [toolsInstance, ipTablesInstall],
	},
);

// These are the normal chains on the linode - they cover all non-docker firewalls
const forwardIpTablesChain = new IpTablesChain(
	"machineWithVpn-forward-chain",
	{
		name: "FORWARD",
		table: "filter",
		connection: toolsInstance.automationUserConnection,
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
	"machineWithVpn-input-v4-chain",
	{
		name: "INPUT",
		table: "filter",
		connection: toolsInstance.automationUserConnection,
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

// Install Docker so that we can add monitoring stacks as containers
const dockerInstall = new DockerInstall(
	"machineWithVpn-docker-install",
	{
		connection: toolsInstance.automationUserConnection,
		homeDir: toolsInstance.automationUserHomeDir,
		sudoCopyTmpDir: toolsInstance.automationUserSudoCopyTmpDir,
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
		dependsOn: [toolsInstance, ipTablesInstall],
	},
);

// We'll use prometheus with docker service discovery on this machine to monitor ourselves
// This will also be a receiver for external agents on the other machines in the network
const prometheusCentral = new PrometheusWithDockerSD(
	"machineWithVpn-central-prometheus",
	{
		serviceName: "prometheus-central",
		mode: "server",
		connection: toolsInstance.automationUserConnection,
		homeDir: toolsInstance.automationUserHomeDir,
		tmpCopyDir: "./tmp",
		usernsRemap: dockerInstall.usernsRemap,
		expose: {
			port: 9090,
			// Expose this on loopback and the internal vlan
			interfaceIps: ["127.0.0.1", toolsInstance.vlanIp!],
		},
		cliFlags: ["--web.enable-remote-write-receiver", "--web.enable-lifecycle"],
		dockerSocketNetworkCIDR:
			dockerInstall.defaultInternalNetworkRange.claimIPCIDR(
				"172.255.0.64/26",
				"prometheus-socket-access",
			).cidr,
		dockerServiceDiscovery: {
			requireScrapeLabel: false, // Normally it's probably better to have this on in production
			relabel_configs: [
				{
					// We'll add a host name here for us
					target_label: "host",
					replacement: toolsInstance.instance.label,
				},
			],
		},
		prometheusConfig: {},
		service: {
			image: "prom/prometheus:v3.4.2", // TODO - remove once prometheus fixes their broken latest tag being v2
		},
	},
	{
		dependsOn: [dockerInstall],
	},
);

new CAdvisorService(
	"machineWithVpn-cadvisor",
	{
		connection: toolsInstance.automationUserConnection,
		homeDir: toolsInstance.automationUserHomeDir,
		tmpCopyDir: "./tmp",
		usernsRemap: dockerInstall.usernsRemap,
		expose: {
			port: 8080,
			interfaceIps: ["127.0.0.1", toolsInstance.vlanIp!],
		},
		dockerSocketNetworkCIDR:
			dockerInstall.defaultInternalNetworkRange.claimIPCIDR(
				"172.255.1.0/26",
				"cadvisor-socket-access",
			).cidr,
		monitoringNetwork: prometheusCentral.monitoringNetwork,
	},
	{
		dependsOn: [dockerInstall, prometheusCentral],
	},
);

new NodeExporterService(
	"machineWithVpn-nodeexporter",
	{
		connection: toolsInstance.automationUserConnection,
		homeDir: toolsInstance.automationUserHomeDir,
		tmpCopyDir: "./tmp",
		usernsRemap: dockerInstall.usernsRemap,
		expose: {
			port: 8081,
			// Expose on internal vlan since we trust those connected via vpn
			interfaceIps: [
				"127.0.0.1",
				dockerInstall.defaultDockerGatewayIP,
				toolsInstance.vlanIp!,
			],
		},
	},
	{
		dependsOn: [dockerInstall],
	},
);

const grafanaInstance = new GrafanaService(
	"machineWithVpn-grafana",
	{
		name: "grafana",
		connection: toolsInstance.automationUserConnection,
		homeDir: toolsInstance.automationUserHomeDir,
		tmpCopyDir: "./tmp",
		usernsRemap: dockerInstall.usernsRemap,
		expose: {
			port: 3000,
			interfaceIps: ["127.0.0.1", toolsInstance.vlanIp!], // Expose on the VLAN interface
		},
		admin: {
			initialPassword: config.requireSecret("grafanaAdminInitialPassword"),
			currentPassword: config.requireSecret("grafanaAdminCurrentPassword"),
		},
		// We join to the prometheus network so we can look it up by service name and privatePort
		monitoringNetwork: prometheusCentral.monitoringNetwork,
		// We are simulating an internal network only application - we would want to add TLS if we wanted this publicly available
		tls: "NO_PUBLIC_CONNECTION",
		providerConnection: {
			protocol: "http",
			host: toolsInstance.vlanIp,
		},
	},
	{
		dependsOn: [prometheusCentral],
	},
);

const datasource = new grafana.oss.DataSource(
	"machineWithVpn-prometheus-datasource",
	{
		name: "PrometheusCentral",
		type: "prometheus",
		accessMode: "proxy",
		url: pulumi
			.output({
				serviceName: prometheusCentral.serviceName,
				port: prometheusCentral.privatePort,
			})
			.apply(({ serviceName, port }) => `http://${serviceName}:${port}`),
		isDefault: true,
	},
	{
		dependsOn: [grafanaInstance],
		provider: grafanaInstance.getGrafanaProvider(),
	},
);

// Substitute in our datasource id via minimal schema
const dashboardJson = datasource.uid.apply((datasourceUid) => {
	const datasourceConfig = JSON.parse(
		readFileSync(join(__dirname, "dockerAndSystemDashboard.json")).toString(),
	) as {
		templating: {
			list: {
				datasource?: string;
			}[];
		};
		panels: {
			datasource?: {
				type: string;
				uid: string;
			};
			targets?: {
				datasource?: {
					type: string;
					uid: string;
				};
			}[];
		}[];
	};
	datasourceConfig.templating.list = datasourceConfig.templating.list.map(
		(l) => {
			if (l.datasource) {
				return {
					...l,
					datasource: datasourceUid,
				};
			}
			return l;
		},
	);
	datasourceConfig.panels = datasourceConfig.panels.map((panel) => {
		return {
			...panel,
			datasource: panel.datasource
				? {
						type: "prometheus",
						uid: datasourceUid,
					}
				: undefined,
			targets: panel.targets
				? panel.targets.map((t) => {
						return {
							...t,
							datasource: {
								type: "prometheus",
								uid: datasourceUid,
							},
						};
					})
				: undefined,
		};
	});

	return JSON.stringify(datasourceConfig, undefined, 2);
});

/**
 * This is a slightly tweaked dashboard imported from #893 that will use
 * cadvisor and node exporter values for monitoring.
 */
new grafana.oss.Dashboard(
	"machineWithVpn-dockerSystemsDashboard",
	{
		configJson: dashboardJson,
		overwrite: true,
	},
	{
		dependsOn: [grafanaInstance, datasource],
		provider: grafanaInstance.getGrafanaProvider(),
	},
);

// Make sure that we persist the configuration from these chains
new IpTablesSave(
	"machineWithVpn-save-config",
	{
		connection: toolsInstance.automationUserConnection,
		ipTablesResources: [
			ipv4BlacklistSet,
			ipv6BlacklistSet,
			forwardIpTablesChain,
			inputIpTablesChain,
			dockerInstall.dockerUserIpTablesChain,
		],
	},
	{
		dependsOn: [toolsInstance, dockerInstall],
	},
);
