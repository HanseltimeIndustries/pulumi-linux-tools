import type { v3 } from "@hanseltime/compose-types";
import { CopyableAsset } from "@hanseltime/pulumi-file-utils";
import { Network, SudoCopyToRemote } from "@hanseltime/pulumi-linux";
import { shellStrings } from "@hanseltime/pulumi-linux-base";
import type {
	IpV4TablesRule,
	IpV6TablesRule,
} from "@hanseltime/pulumi-linux-iptables";
import { IpTablesChain } from "@hanseltime/pulumi-linux-iptables";
import type { StaticConfiguration } from "@hanseltime/traefik";
import type { types } from "@pulumi/command";
import { remote } from "@pulumi/command";
import * as pulumi from "@pulumi/pulumi";
import { dump } from "js-yaml";
import { resolve } from "path";
import { ASSET_PATH, LIBRARY_PREFIX } from "./constants";
import type { DockerComposeServiceArgs } from "./DockerComposeService";
import { DockerComposeService } from "./DockerComposeService";
import type { Inputify } from "./helperTypes";
import type {
	DockerDaemonJson,
	TempCopyDirArgs,
	WaitOnChildren,
} from "./types";
import { DockerDeployType } from "./types";

export type CIDR = string;

export enum FireWallPresets {
	/**
	 * Any ip requester is allowed through
	 */
	DangerousAllAccess = "dangerousallaccess",
}

interface DockerInstallArgs extends TempCopyDirArgs {
	connection: pulumi.Input<types.input.remote.ConnectionArgs>;
	homeDir: pulumi.Input<string>;
	/**
	 * Required if connectionIsRoot = false.
	 *
	 * This is the directory for the connection user where we will copy docker files like the daemon.json
	 * and then transfer via sudo to their correct locations.
	 */
	sudoCopyTmpDir?: pulumi.Input<string>;
	/**
	 * We supply this because if you are managing the docker installation with the explicit root user (not a passwordless sudo user),
	 * then you do not need as many steps to copy files to the protected locations.
	 *
	 * Note, it is often encouraged to not use the well-known root user over ssh to avoid brute forcing attacks, so you might want to
	 * aim for an automation user like the auto-generated one we make in the @hanseltime/pulumi-linonde - LinodeInstance component
	 */
	connectionIsRoot: boolean;
	/**
	 * This controls the IP addresses allocated to your docker default network (the one where you don't
	 * supply any network in compose) and your blue-green network (the network with the traefik machines and
	 * all service apps)
	 *
	 * Note 1: choose a network CIDR for each that will not conflict with any other local network interfaces that
	 * you may attach (i.e. a vlan that you create at 10.0.0.0/24)
	 *
	 * Note 2: Make sure that you have at least 2 * (sum0..X(serviceX * num replicas)) + 1 (for the blue-green reverse proxy)
	 *   This is the worst case scenario where all services blue-green at the same time and therefore scale to double.
	 */
	networking: pulumi.Input<{
		/**
		 * The cidr that the default network will stay on - this can be ignored if you specify useDaemon and a daemon argument
		 */
		default: pulumi.Input<CIDR | "useDaemon">;
		/**
		 * Required if blue green is not false
		 * Simple - all the ips available to the bluegreen network that docker will auto-assign to containers
		 * Complex - specify the entire network ipam yourself
		 */
		blueGreen?: pulumi.Input<CIDR | v3.Network["ipam"]>;
	}>;
	/**
	 * If you want to set up a completely custom docker daemon, you can do so by supplying an object that reflects the daemon.json
	 *
	 * https://docs.docker.com/reference/cli/dockerd/#daemon-configuration-file
	 */
	daemonJson?: pulumi.Input<any>;
	/**
	 * If you are adding a blue-green reverse proxy for blue-green deployment
	 */
	blueGreen:
		| false
		| {
				/**
				 * The static configuration for traefik that will be mounted into the Dockerfile
				 */
				staticConfig: pulumi.Input<StaticConfiguration>;
				mounts?: DockerComposeServiceArgs["mounts"];
				secrets?: DockerComposeServiceArgs["secrets"];
		  };
	/**
	 * If you need to reupload assets for this installation, you can change the reuploadId to a new number
	 * and it will trigger a reupload
	 */
	reuploadId?: number;
	/**
	 * This applies the supplied iptables rules to the DOCKER-USER chain (and fully manages it - do not add additional rules elsewhere) that follows https://docs.docker.com/engine/network/packet-filtering-firewalls
	 *
	 * IMPORTANT - Docker bypasses ufw on linux so this is a MUST for completene or you have to use the 'DANGEROUS_OFF' enum
	 *
	 * This means that, if you add iptables rules for something like port :80 to the standard INPUTS chain, you will also need to add
	 * it here for completeness if you are concerned about port :80 being opened.
	 *
	 * IMPORTANT 2 - Normally, do not use "all" interface rules for a DROP target since that will apply to all the bridge and virtual networks created by docker
	 * as well and will stop all outbound requests from the container since they will not have an IP you expect. Specify your network interfaces explicitly or
	 * using a prefix like `eth+` if you know eth prefixed interfaces are external ingresses.
	 */
	firewall:
		| Inputify<{
				ipv4: IpV4TablesRule[];
				ipv6: IpV6TablesRule[];
		  }>
		| FireWallPresets.DangerousAllAccess;
	/**
	 * Default: 231072:65536
	 *
	 * In order to avoid container breaches gaining access to more of the host machine, we require you
	 * to specify a range of IP addresses that Docker will start with.
	 *
	 * IMPORTANT - changing this after the initial condition can break all types of file system permissions.
	 * If you want to change it, we recommend creating a new install on a new machine and migrating or performing
	 * clean-up manually (or contibuting an automatic fix)
	 *
	 * Make sure they don't overlap with uid's on your host system and it is large enough to handle your
	 * max uid.
	 *
	 * Example (start: 10000, length: 65536)
	 *
	 * root user (0) -> 10000
	 *
	 * redis user (999) -> 10999
	 *
	 * We will apply this range to both group ids and user ids
	 */
	usernsRemap?: pulumi.Input<{
		start: pulumi.Input<number>;
		length: pulumi.Input<number>;
	}>;
}

/**
 * This is the default rule that docker come with, it lets everyone through who gets to it
 */
export const DEFAULT_DOCKER_RULE: IpV4TablesRule | IpV6TablesRule =
	Object.freeze({
		jump: "RETURN",
	});

const REMAP_USER = "dockercontainers";

/**
 * These are the result of tools like https://github.com/docker/docker-bench-security
 * that suggest better security practices
 */
export const BASE_DEFAULT_DOCKER_DAEMON: DockerDaemonJson = {
	/**
	 * 2.14 Ensure containers are restricted from acquiring new privileges
	 */
	"no-new-privileges": true,
	/**
	 * Ensure network traffic is restricted between containers on the default bridge
	 *
	 * https://docs.datadoghq.com/security/default_rules/8r2-zyy-shg/
	 */
	icc: false,
	/**
	 * 2.15 Ensure live restore is enabled
	 */
	"live-restore": true,
	/**
	 * 2.16 Ensure Userland Proxy is Disabled
	 *
	 * Audit indicates that only older systems without hairpin NAT would still need this
	 */
	"userland-proxy": false,
	/**
	 * 2.9 - Enable user namespace support
	 *
	 * We automatically enforce that all users are mapped to a namespace to avoid bleeding root and other users onto the host
	 */
	"userns-remap": REMAP_USER,
	/**
	 * We use the local log-driver to avoid disk pressure since the default json-logging will not clean up
	 * files.
	 */
	"log-driver": "local",
};

/**
 * Runs ubuntu docker installation commands from a shell
 */
export class DockerInstall
	extends pulumi.ComponentResource
	implements WaitOnChildren
{
	/**
	 * The iptables chain that this install controls
	 */
	dockerUserIpTablesChain: IpTablesChain;
	/**
	 * This specifies the start id and length of all ids supported in the namespace that docker remaps to.
	 *
	 * It is recommended that you export this fromm your stack if using distributed stacks for your other
	 * DockerComposeServices to reference since we need to calculate user permissions for any mounted volumes.
	 */
	usernsRemap: pulumi.Output<{
		start: number;
		length: number;
	}>;
	/**
	 * The expected network ip of the default docker gateway (that things like mounting the host-gateway will involve)
	 *
	 * Note: if you have a very exotic network setup, this only infers from daemon.json and may be wrong.
	 */
	defaultDockerGatewayIP: pulumi.Output<string>;

	last: pulumi.Input<pulumi.Resource>;

	defaultInternalNetworkRange: Network;

	/**
	 * The full network name for compose services
	 */
	readonly blueGreenNetwork: string;
	constructor(
		name: string,
		args: DockerInstallArgs,
		opts?: pulumi.ComponentResourceOptions,
	) {
		super(`${LIBRARY_PREFIX}:DockerInstall`, name, args, opts);

		this.defaultInternalNetworkRange = new Network(
			`name-default-internal-range`,
			"172.255.0.0/16",
		);

		// Commands taken from: https://docs.docker.com/engine/install/ubuntu/
		const installCommand =
			`apt-get update && apt-get install -y ca-certificates curl acl && ` +
			`install -m 0755 -d /etc/apt/keyrings && curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc && ` +
			`chmod a+r /etc/apt/keyrings/docker.asc && ` +
			`echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo \${UBUNTU_CODENAME:-$VERSION_CODENAME}) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null && ` +
			`apt-get update && apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin && ` +
			`mkdir -p $HOME/.docker/cli-plugins && ` +
			// Some apt updates were dropping the docker group so we add it
			`(getent group docker || sudo groupadd docker && newgrp docker && echo "we have added a docker group")`;

		const fullDaemonJson = pulumi
			.output({
				networking: args.networking,
				daemonJson: args.daemonJson,
			})
			.apply(({ networking, daemonJson }) => {
				const overrideBip = daemonJson?.bip;
				if (networking.default === "useDaemon") {
					if (!overrideBip) {
						throw new pulumi.InputPropertyError({
							propertyPath: "daemonJson.bip",
							reason:
								'if you specify use networking.default = useDaemon, you must supply "bip" CIDR',
						});
					}
				} else {
					if (overrideBip) {
						throw new pulumi.InputPropertyError({
							propertyPath: "daemonJson.bip",
							reason: "Only specify bip if networking.default = useDaemon",
						});
					}
				}

				const bip = overrideBip ?? networking.default;

				const lastOctet = bip.split("/")[0].split(".")[3];
				if (lastOctet === "0") {
					throw new pulumi.InputPropertyError({
						propertyPath: "networking.default",
						reason:
							"defaultCIDR/daemonJson.bip must have a non-zero number to specify the bridge ip (i.e. 172.17.0.1/16)",
					});
				}

				return {
					...BASE_DEFAULT_DOCKER_DAEMON,
					...daemonJson,
					bip: overrideBip ?? networking.default,
				};
			});

		this.defaultDockerGatewayIP = fullDaemonJson.apply(
			(daemonJson: DockerDaemonJson) => {
				if (daemonJson["host-gateway-ip"]) {
					return daemonJson["host-gateway-ip"];
				}
				if (daemonJson.bip) {
					const ipPieces = daemonJson.bip.split("/")[0].split(".");
					let lastOctet = ipPieces[3];
					if (lastOctet === "0") {
						lastOctet = "1";
					}
					return `${ipPieces[0]}.${ipPieces[1]}.${ipPieces[2]}.${lastOctet}`;
				}
				if (daemonJson["default-address-pools"]) {
					const defaultAddressPools = daemonJson["default-address-pools"];
					if (defaultAddressPools.length > 0) {
						// We just use the first here
						const initialCIDR = defaultAddressPools[0].base;
						const ipPieces = initialCIDR.split("/")[0].split(".");
						let lastOctet = ipPieces[3];
						if (lastOctet === "0") {
							lastOctet = "1";
						}
						return `${ipPieces[0]}.${ipPieces[1]}.${ipPieces[2]}.${lastOctet}`;
					}
				}
				// Use the default network gateway address
				return "172.17.0.1";
			},
		);

		const etcDocker = fullDaemonJson.apply((daemonJson) => {
			const daemonFile = new pulumi.asset.StringAsset(
				JSON.stringify(daemonJson, undefined, "  "),
			);
			// Do this so that on start up, we create the docker directory if necessary
			return new pulumi.asset.AssetArchive({
				"daemon.json": daemonFile,
			});
		});

		const etcDockerCopyable = new CopyableAsset(`${name}-daemonconfig`, {
			synthName: "docker",
			asset: etcDocker,
			noClean: false,
			tmpCopyDir: args.tmpCopyDir,
		});

		const configTriggers = [
			pulumi.output(args.daemonJson),
			pulumi.output(args.networking).apply((n) => n.default),
		];

		let daemonConfig: remote.CopyToRemote | SudoCopyToRemote;
		if (args.connectionIsRoot) {
			daemonConfig = new remote.CopyToRemote(
				`${name}-daemonconfig`,
				{
					source: etcDockerCopyable.copyableSource,
					remotePath: "/etc",
					connection: pulumi.output(args.connection).apply((conn) => {
						if (conn.user !== "root") {
							throw new pulumi.InputPropertyError({
								propertyPath: "connection",
								reason: `you have marked connectionIsRoot, but the connection user name is not root: ${conn.user}`,
							});
						}
						return conn;
					}),
					triggers: configTriggers,
				},
				{
					parent: this,
				},
			);
		} else {
			if (!args.sudoCopyTmpDir) {
				throw new pulumi.InputPropertyError({
					propertyPath: "sudoCopyTmpDir",
					reason:
						"If the connection is not root, you must supply a copy tmp dir for the connection user to temporarily load files into before moving them to a root-protected location",
				});
			}
			daemonConfig = new SudoCopyToRemote(
				`${name}-daemonconfig`,
				{
					source: etcDockerCopyable.copyableSource,
					remotePath: "/etc",
					connection: args.connection,
					triggers: configTriggers,
					userTmpPath: args.sudoCopyTmpDir,
				},
				{
					parent: this,
				},
			);
		}

		// This adds a user and then updates the ip range
		const usernsRemapOutput = pulumi.output(
			args.usernsRemap ?? { start: 231072, length: 65536 },
		);
		const setupNamespace = usernsRemapOutput.apply(({ start, length }) => {
			return `if ! id "${REMAP_USER}" &> /dev/null; then groupadd -g ${start} ${REMAP_USER} && useradd -g ${REMAP_USER} -u ${start} -m ${REMAP_USER}; fi && ${shellStrings.insertNamespaceRange("/etc/subgid", REMAP_USER, start, length)} && ${shellStrings.insertNamespaceRange("/etc/subuid", REMAP_USER, start, length)}`;
		});
		this.usernsRemap = usernsRemapOutput;

		const dockerInstall = new remote.Command(
			`${name}-docker-install`,
			{
				connection: args.connection,
				// Pulled from https://www.linode.com/community/questions/21095/how-to-add-an-ssh-key-to-an-existing-linode
				create: shellStrings.asSudoOutput(
					setupNamespace.apply(
						(setupNamespaceIn) => `${setupNamespaceIn} && ${installCommand}`,
					),
				),
				delete: shellStrings.asSudoOutput(
					`for pkg in docker.io docker-doc docker-compose docker-compose-v2 podman-docker containerd runc; do apt-get remove $pkg; done && rm -rf $HOME/.docker/cli-plugins`,
				),
				triggers: [args.reuploadId],
			},
			{ parent: this, dependsOn: [daemonConfig] },
		);

		// If we update the daemon.json we need to do a restart of docker
		const dockerRestart = new remote.Command(
			`${name}-docker-restart`,
			{
				connection: args.connection,
				// Add a sleep since we can contend with the installation's boot apparently
				create: shellStrings.asSudoOutput("service docker restart"),
				triggers: [configTriggers],
			},
			{
				parent: this,
				dependsOn: [dockerInstall],
			},
		);

		// We want to make this relative so that it works across
		const rolloutAsset = resolve(ASSET_PATH, "docker-rollout");

		/**
		 * TODO - allow for installing and adding more plugins
		 */
		const dockerPlugins = new CopyableAsset(`${name}docker-plugins`, {
			synthName: "cli-plugins",
			asset: new pulumi.asset.AssetArchive({
				"docker-rollout": new pulumi.asset.FileAsset(rolloutAsset),
			}),
			tmpCopyDir: "./tmp",
			noClean: false,
		});
		// Install our version of docker release for blue-green deployments
		let dockerReleaseInstall: remote.CopyToRemote | SudoCopyToRemote;
		const rootDockerRemotePath = pulumi
			.output({
				homeDir: args.homeDir,
				connectionIsRoot: args.connectionIsRoot,
			})
			.apply(({ homeDir, connectionIsRoot }) => {
				// Since the docker is installed under root permissions, need to install in root
				return connectionIsRoot ? `${homeDir}/.docker` : `/root/.docker`;
			});
		if (args.connectionIsRoot) {
			dockerReleaseInstall = new remote.CopyToRemote(
				`${name}-docker-release-plugin`,
				{
					connection: args.connection,
					source: dockerPlugins.copyableSource,
					remotePath: rootDockerRemotePath,
					triggers: [dockerPlugins.copyableSource, args.reuploadId],
				},
				{
					parent: this,
					dependsOn: [dockerInstall],
				},
			);
		} else {
			dockerReleaseInstall = new SudoCopyToRemote(
				`${name}-docker-release-plugin`,
				{
					connection: args.connection,
					source: dockerPlugins.copyableSource,
					remotePath: rootDockerRemotePath,
					triggers: [dockerPlugins.copyableSource, args.reuploadId],
					userTmpPath: args.sudoCopyTmpDir!,
				},
				{
					parent: this,
					dependsOn: [dockerInstall],
				},
			);
		}
		const markExecutables = new remote.Command(
			`${name}-make-executable`,
			{
				connection: args.connection,
				create: shellStrings.asSudoOutput(
					rootDockerRemotePath.apply(
						(rootDockerRemotePathIn) =>
							`chmod +x ${rootDockerRemotePathIn}/cli-plugins/*`,
					),
				),
				triggers: [dockerPlugins.copyableSource, args.reuploadId],
			},
			{
				parent: this,
				dependsOn: [dockerReleaseInstall],
			},
		);
		const blueGreenNetwork = "bluegreengateway";
		const gatewayProject = "blue-green-traefik";
		this.blueGreenNetwork = `${gatewayProject}_${blueGreenNetwork}`;

		// Before we set up any services that can expose a port, we want to apply the correct rules
		if (args.firewall === FireWallPresets.DangerousAllAccess) {
			console.warn(
				`WARNING: All ports exposed through docker are accessible to EVERYONE. If this is production, please add some ip rules to the firewall property`,
			);
		}

		pulumi.output(args.firewall).apply((firewall) => {
			if (firewall !== FireWallPresets.DangerousAllAccess) {
				(firewall.ipv4 as IpV4TablesRule[]).map((rule) => {
					rule.sourcePorts;
				});
			}
		});

		const dockerFirewall = new IpTablesChain(
			`${name}-docker-firewall-rules`,
			{
				connection: args.connection,
				table: "filter",
				// Created by docker
				name: "DOCKER-USER",
				rulesIpV4:
					args.firewall === FireWallPresets.DangerousAllAccess
						? [DEFAULT_DOCKER_RULE as IpV4TablesRule]
						: (args.firewall.ipv4 as IpV4TablesRule[]),
				rulesIpV6:
					args.firewall === FireWallPresets.DangerousAllAccess
						? [DEFAULT_DOCKER_RULE as IpV6TablesRule]
						: (args.firewall.ipv6 as IpV6TablesRule[]),
				alreadyCreated: true,
			},
			{
				parent: this,
				dependsOn: [dockerInstall],
			},
		);
		this.dockerUserIpTablesChain = dockerFirewall;
		const dockerSocketProxyServiceName = "dockersocketproxy";
		let blueGreenProxy: DockerComposeService | undefined;
		if (args.blueGreen) {
			const mergedStaticConfig = pulumi
				.output(args.blueGreen)
				.apply(({ staticConfig }) => {
					return {
						// By default add ping
						ping: {},
						...staticConfig,
						providers: {
							...staticConfig.providers,
							docker: {
								...staticConfig.providers?.docker,
								// Settings for docker integration
								endpoint: `tcp://${dockerSocketProxyServiceName}:2375`,
								exposedByDefault: false,
								watch: true,
								network: blueGreenNetwork,
							},
						},
					};
				});
			const { portsToExpose, pingPort } = mergedStaticConfig.apply(
				(staticConfig) => {
					const pingConfig = staticConfig.ping;
					let pingPortRet = "8080";
					if (pingConfig.entryPoint) {
						const address =
							staticConfig.entryPoints[pingConfig.entryPoint].address;
						const [_, portProtocol] = address.split(":");
						pingPortRet = portProtocol.split("/")[0];
					}
					const portSet = new Set<string>();
					Object.keys(staticConfig.entryPoints).forEach((ePoint) => {
						const ePointConfig = staticConfig.entryPoints[ePoint];
						const [host, portProtocol] = ePointConfig.address.split(":");
						const port = portProtocol.split("/")[0];
						if (!host || host === "*") {
							portSet.add(`${port}:${port}`);
						} else {
							portSet.add(`${host}:${port}:${port}`);
						}
					});
					return {
						portsToExpose: Array.from(portSet),
						pingPort: pingPortRet,
					};
				},
			);
			const mounts = pulumi
				.output({
					mergedStaticConfigIn: mergedStaticConfig,
					mountsIn: args.blueGreen.mounts,
				})
				.apply(({ mergedStaticConfigIn, mountsIn }) => {
					const staticAsset = new pulumi.asset.StringAsset(
						dump(mergedStaticConfigIn),
					);

					return [
						{
							name: "traefik.yml",
							resource: staticAsset,
							onContainer: "/traefik.yml",
						},
						...(mountsIn ?? []),
					];
				});

			// Make sure the networking IPs are specified
			const ipam = pulumi.output(args.networking).apply((networking) => {
				if (!networking.blueGreen) {
					throw new pulumi.InputPropertyError({
						propertyPath: "networking.blueGreenCIDR",
						reason:
							"Must supply a blueGreenCIDR if using bluegreen deployment!",
					});
				}

				if (typeof networking.blueGreen === "string") {
					const lastOctet = networking.blueGreen.split("/")[0].split(".")[3];
					if (lastOctet !== "0") {
						throw new pulumi.InputPropertyError({
							propertyPath: `networking.blueGreen`,
							reason: `Last octet of network subnet for compose must be 0: ${networking.blueGreen}`,
						});
					}
				} else {
					networking.blueGreen.config?.forEach((c, idx) => {
						if (c.subnet) {
							const lastOctet = c.subnet.split("/")[0].split(".")[3];
							if (lastOctet !== "0") {
								throw new pulumi.InputPropertyError({
									propertyPath: `networking.blueGreen.config[${idx}].subnet`,
									reason: `Last octet of network subnet for compose must be 0: ${c.subnet}`,
								});
							}
						}
					});
				}

				return typeof networking.blueGreen === "string"
					? {
							driver: "default",
							config: [
								{
									subnet: networking.blueGreen,
								},
							],
						}
					: networking.blueGreen;
			});

			blueGreenProxy = new DockerComposeService(
				`${name}-blue-green-proxy`,
				{
					upArgs: ["--force-recreate"],
					usernsRemap: this.usernsRemap,
					name: gatewayProject,
					deployType: DockerDeployType.Replace,
					connection: args.connection,
					homeDir: args.homeDir,
					tmpCopyDir: args.tmpCopyDir,
					networks: {
						[blueGreenNetwork]: {
							driver: "bridge",
							ipam,
						},
					},
					secrets: args.blueGreen ? args.blueGreen.secrets : undefined,
					mounts,
					accessDockerSocket: {
						name: dockerSocketProxyServiceName,
						readonly: true,
						apis: {
							CONTAINERS: 1,
						},
						networkCIDR: this.defaultInternalNetworkRange.claimIPCIDR(
							"172.255.0.0/26",
							"bluegreen-socket-access",
						).cidr,
					},
					service: {
						image: "traefik:v3.3",
						labels: [
							"traefik.http.routers.api.rule=Host(`localhost`)",
							"traefik.http.routers.api.service=api@internal",
						],
						networks: [blueGreenNetwork],
						ports: portsToExpose,
						restart: "unless-stopped",
						healthcheck: {
							test: pingPort.apply(
								(port) => `wget --spider 127.0.0.1:${port}/ping`,
							),
							// For now just use the defaults
						},
						user: "ROOT_USER",
					},
					reuploadId: args.reuploadId,
				},
				{
					parent: this,
					dependsOn: [
						dockerRestart,
						dockerReleaseInstall,
						markExecutables,
						dockerFirewall,
					],
				},
			);
		}

		this.last = blueGreenProxy?.last ?? markExecutables;

		this.registerOutputs({
			last: this.last,
			usernsRemap: this.usernsRemap,
			defaultDockerGatewayIP: this.defaultDockerGatewayIP,
		});
	}
}
