import { CopyableAsset } from "@hanseltime/pulumi-file-utils";
import { LinodeInstance } from "@hanseltime/pulumi-linode";
import {
	CAdvisorService,
	DockerComposeService,
	DockerDeployType,
	DockerInstall,
	GrafanaService,
	NodeExporterService,
	PrometheusService,
	PrometheusWithDockerSD,
} from "@hanseltime/pulumi-linux-docker";
import {
	IpSetResource,
	IpTablesChain,
	IpTablesHelper,
	IpTablesInstall,
	IpTablesSave,
} from "@hanseltime/pulumi-linux-iptables";
import { TraefikRouteRule } from "@hanseltime/traefik";
import * as pulumi from "@pulumi/pulumi";
import * as std from "@pulumi/std";
import * as grafana from "@pulumiverse/grafana";
import { readFileSync } from "fs";
import { homedir } from "os";
import { join } from "path";
import {
	blacklistV4,
	blacklistV6,
	globalBlockIpSetIpv4,
	globalBlockIpSetIpv6,
} from "./iptables";

// We are fine with risking a collision for a faster comparison of docker files
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

const instance = new LinodeInstance("machine1", {
	label: "machine1",
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

// Enables CAdvisor, NodeExporter, Prometheus (With an agent)
const withMonitoring = config.get("withMonitoring");
if (withMonitoring) {
	const prometheusAgentMock = config.get("prometheusAgentMock");
	// To support agent -> central server behavior (but on the same machine), we swap some server properties
	const prometheusCentralArgs = prometheusAgentMock
		? {
				cliFlags: [
					"--web.enable-remote-write-receiver",
					"--web.enable-lifecycle",
				],
				scrapeSelf: false, // In this scenario, the service discovery find this and self-reports
			}
		: {
				cliFlags: ["--web.enable-lifecycle"],
				scrapeSelf: true, // Since there's no agent on this machine, we do the scraping
			};

	let scrapePrometheus: PrometheusService;
	let prometheusCentral: PrometheusService;
	if (prometheusAgentMock) {
		prometheusCentral = new PrometheusService(
			"central-prometheus",
			{
				serviceName: "prometheus-central",
				mode: "server",
				connection: instance.automationUserConnection,
				homeDir: instance.automationUserHomeDir,
				tmpCopyDir: "./tmp",
				usernsRemap: dockerInstall.usernsRemap,
				expose: {
					port: 9090,
					// We will access this via grafana so only exposing it on the loopback is fine for ssh troubleshoots
					interfaceIps: ["127.0.0.1"],
				},
				...prometheusCentralArgs,
				prometheusConfig: {},
			},
			{
				dependsOn: [dockerInstall],
			},
		);
		scrapePrometheus = new PrometheusWithDockerSD(
			"prometheus",
			{
				serviceName: "prometheus-agent",
				mode: "agent",
				connection: instance.automationUserConnection,
				homeDir: instance.automationUserHomeDir,
				tmpCopyDir: "./tmp",
				expose: {
					port: 9091,
					// We will access this via grafana so only exposing it on the loopback is fine for ssh troubleshoots
					interfaceIps: ["127.0.0.1"],
				},
				usernsRemap: dockerInstall.usernsRemap,
				dockerSocketNetworkCIDR:
					dockerInstall.defaultInternalNetworkRange.claimIPCIDR(
						"172.255.0.64/26",
						"prometheus-socket-access",
					).cidr,
				upArgs: ["--force-recreate"],
				cliFlags: ["--web.enable-lifecycle"],
				prometheusConfig: {
					remote_write: [
						{
							url: pulumi
								.output({
									sName: prometheusCentral.serviceName,
									port: prometheusCentral.privatePort,
								})
								.apply(
									({ sName, port }) => `http://${sName}:${port}/api/v1/write`,
								),
						},
					],
				},
				monitoringNetwork: prometheusCentral.monitoringNetwork,
			},
			{
				dependsOn: [dockerInstall, prometheusCentral],
			},
		);
	} else {
		prometheusCentral = new PrometheusWithDockerSD(
			"central-prometheus",
			{
				serviceName: "prometheus-central",
				mode: "server",
				connection: instance.automationUserConnection,
				homeDir: instance.automationUserHomeDir,
				tmpCopyDir: "./tmp",
				usernsRemap: dockerInstall.usernsRemap,
				expose: {
					port: 9090,
					// We will access this via grafana so only exposing it on the loopback is fine for ssh troubleshoots
					interfaceIps: ["0.0.0.0"],
				},
				dockerSocketNetworkCIDR:
					dockerInstall.defaultInternalNetworkRange.claimIPCIDR(
						"172.255.0.64/26",
						"prometheus-socket-access",
					).cidr,
				...prometheusCentralArgs,
				prometheusConfig: {},
			},
			{
				dependsOn: [dockerInstall],
			},
		);
		scrapePrometheus = prometheusCentral;
	}

	new CAdvisorService(
		"cadvisor",
		{
			connection: instance.automationUserConnection,
			homeDir: instance.automationUserHomeDir,
			tmpCopyDir: "./tmp",
			usernsRemap: dockerInstall.usernsRemap,
			expose: {
				port: 8080,
				interfaceIps: ["127.0.0.1"],
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
		"nodeexporter",
		{
			connection: instance.automationUserConnection,
			homeDir: instance.automationUserHomeDir,
			tmpCopyDir: "./tmp",
			usernsRemap: dockerInstall.usernsRemap,
			expose: {
				port: 8081,
				interfaceIps: ["127.0.0.1", dockerInstall.defaultDockerGatewayIP],
			},
		},
		{
			dependsOn: [dockerInstall],
		},
	);

	const grafanaInstance = new GrafanaService(
		"grafana",
		{
			name: "grafana",
			connection: instance.automationUserConnection,
			homeDir: instance.automationUserHomeDir,
			tmpCopyDir: "./tmp",
			usernsRemap: dockerInstall.usernsRemap,
			expose: {
				port: 3000,
				interfaceIps: ["0.0.0.0"],
			},
			admin: {
				initialPassword: config.requireSecret("grafanaAdminInitialPassword"),
				currentPassword: config.requireSecret("grafanaAdminCurrentPassword"),
			},
			// We join to the prometheus network so we can look it up by service name and privatePort
			monitoringNetwork: prometheusCentral.monitoringNetwork,
			tls: {
				certKey: config.requireSecret("grafanacertkey"),
				certCrt: config.requireSecret("grafanacertcrt"),
				rootUrl: "grafana.example.com", // initialize.sh should have made the key for this url
			},
			providerConnection: {
				caCert: readFileSync(
					join(__dirname, "..", "certs", "ca-chain-for-node.pem"),
					"utf8",
				).toString(),
			},
		},
		{
			dependsOn: [prometheusCentral],
		},
	);

	const datasource = new grafana.oss.DataSource(
		"prometheus-datasource",
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
		"dockerSystemsDashboard",
		{
			configJson: dashboardJson,
			overwrite: true,
		},
		{
			dependsOn: [grafanaInstance, datasource],
			provider: grafanaInstance.getGrafanaProvider(),
		},
	);
}

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
