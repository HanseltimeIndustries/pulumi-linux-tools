import type { v3 } from "@hanseltime/compose-types";
import { CopyableAsset } from "@hanseltime/pulumi-file-utils";
import * as pulumi from "@pulumi/pulumi";
import { dump } from "js-yaml";
import { isIP } from "net";
import type {
	DockerComposeServiceArgs,
	ServiceInputified,
} from "../DockerComposeService";
import { DockerComposeService } from "../DockerComposeService";
import { DockerDeployType } from "../types";
import { overrideLabelsOrEnv } from "../utils";

export interface PrometheusServiceArgs {
	connection: DockerComposeServiceArgs["connection"];
	homeDir: DockerComposeServiceArgs["homeDir"];
	tmpCopyDir: DockerComposeServiceArgs["tmpCopyDir"];
	usernsRemap: DockerComposeServiceArgs["usernsRemap"];
	/**
	 * Defaults to prometheus
	 */
	serviceName?: pulumi.Input<string>;
	/**
	 * This will preconfigure if this is an agent (lightweight pass through) or a server
	 */
	mode: pulumi.Input<"agent" | "server">;
	/**
	 * The port that we will expose the prometheus UI on and the interfaces attached.
	 *
	 * IMPORTANT - we do not recommend exposing this to the public internet
	 * since prometheus does not do authentication on its own and this could lead to outsiders
	 * triggering APIs that write.  Adding a proxy that performs authentication is outside the
	 * scope of this resource since it is normally meant to run on an internal network
	 * and be exposed via something like grafana.
	 *
	 * // loopback interface and the docker interface
	 * interfaceIps: ['127.0.0.1', 'dockerInstall.defaultDockerGatewayIP')],
	 */
	expose: pulumi.Input<{
		port: pulumi.Input<number>;
		/**
		 * These could be the ips or interface names of the interface's on the machine or an "all interface" ip
		 * like 0.0.0.0 or [::] for ipv6
		 *
		 * IMPORTANT - we do not recommend exposing this to the public internet
		 * since prometheus does not do authentication on its own and this could lead to outsiders
		 * triggering APIs that write.  Adding a proxy that performs authentication is outside the
		 * scope of this resource since it is normally meant to run on an internal network
		 * and be exposed via something like grafana.
		 *
		 * // loopback interface and the docker interface
		 * interfacesIps: ['127.0.0.1', dockerInstall.defaultDockerGatewayIP]
		 */
		interfaceIps: pulumi.Input<pulumi.Input<string>[]>;
	}>;
	/**
	 * Optional cli flags that you can apply.  We already provide a base set that points to the mounted prometheus.yml
	 * and points to a local volume by default.
	 *
	 * All other flags can be added here: https://prometheus.io/docs/prometheus/latest/command-line/prometheus/#flags
	 */
	cliFlags?: pulumi.Input<pulumi.Input<string>[]>;
	/**
	 * This is the prometheus config in object form.  It will be serialized to yaml and mounted for you.
	 *
	 * We alraedy set up a self-scraping configuration based on 'scrapeSelf'
	 */
	prometheusConfig: any;
	/**
	 * This will automatically add a scrape job called prometheus-self that scrapes this container.
	 *
	 * You may turn this off if say, you were doing docker service discovery and that would also
	 * scrape this container
	 */
	scrapeSelf: boolean;
	/**
	 * All docker compose arguments that are not explicitly set up by the specific arguments of this args
	 * interface can still be set.
	 */
	service?: Omit<
		DockerComposeServiceArgs["service"],
		"ports" | "command" | "user" | "healthcheck" | "networks"
	>;
	/**
	 * IMPORTANT - these mounts will have the prometheus config added to it.  These are only additional mounts.
	 */
	mounts?: DockerComposeServiceArgs["mounts"];
	secrets?: DockerComposeServiceArgs["secrets"];
	accessDockerSocket?: DockerComposeServiceArgs["accessDockerSocket"];
	reuploadId?: DockerComposeServiceArgs["reuploadId"];
	upArgs?: DockerComposeServiceArgs["upArgs"];
	/**
	 * This is here specifically if you have something like a central prometheus server and a
	 * prometheus agent on the same Docker machine.  This is kinda crazy since if you're on the
	 * same machine, you don't really need a light-weight agent andserver, but for demo/testing purposes we provide it.
	 */
	monitoringNetwork?: DockerComposeServiceArgs["monitoringNetwork"];
	/**
	 * Some prometheus config changes are not reingested on upload, this allows you to add some config changes
	 * that will create a replacement of the docker service since we actually need a full restart.
	 *
	 * You provide a lambda function that takes in the prometheus config and returns whatever objects you deem
	 * worthy of watching for changes.  This translates to a label with a hash that we add to the service
	 * and that will trigger reloads on change.
	 *
	 * Note: there are some basic keys that we already know trigger update (docker_sd_config jobs) and remote_write
	 * configs if an agent
	 */
	configKeysForReplace?: (prometheusConfig: any) => any[];
}

/**
 * Creates a DockerComposeService with prometheus setup that uploads your config in a reliable location.
 *
 * IMPORTANT! Prometheus is a data storage application and if you run it on the same machine as critical applications,
 * you will need to be aware of storage/cpu/memory constraints and how they may impact your other docker applications.
 *
 * If you do not want to have that risk, running prometheus on another machine and using an OpenTelemetryCollector may
 * be more desirable since collectors are just pipelines.
 */
export class PrometheusService extends DockerComposeService {
	/**
	 * The network name that this is on - ease of use for adding the network
	 * to other services
	 */
	monitoringNetwork: pulumi.Output<string>;
	/**
	 * The port that this prometheus is exposed on
	 */
	port: pulumi.Output<string>;
	/**
	 * This is the port that prometheus is locally exposed on.  This is accessible within compose networks
	 */
	privatePort: pulumi.Output<string>;
	constructor(
		name: string,
		args: PrometheusServiceArgs,
		options?: pulumi.ComponentResourceOptions,
	) {
		const {
			prometheusConfig,
			scrapeSelf,
			expose,
			service,
			cliFlags,
			mounts,
			serviceName,
			mode,
			configKeysForReplace,
			...commonArgs
		} = args;
		const { promConfigYamlAsset, promConfigReplaceSha } = pulumi
			.output({
				prometheusConfigIn: prometheusConfig,
				scrapeSelfIn: scrapeSelf,
				modeIn: mode,
				configKeysForReplaceIn: configKeysForReplace,
			})
			.apply(
				({
					prometheusConfigIn,
					scrapeSelfIn,
					modeIn,
					configKeysForReplaceIn,
				}) => {
					const modifiedConfig = prometheusConfigIn ?? {};
					if (scrapeSelfIn) {
						if (!modifiedConfig.scrape_configs) {
							modifiedConfig.scrape_configs = [];
						}
						modifiedConfig.scrape_configs.push({
							job_name: "prometheus-self",
							scrape_interval: "30s",
							static_configs: ["localhost:9090"],
						});
					}
					const getBaseKeys = (promConfig: any) => {
						const objects = [] as any[];
						if (promConfig.scrape_configs) {
							(promConfig.scrape_configs as any[]).forEach(
								(scrape_config: any) => {
									if (scrape_config.docker_sd_configs) {
										objects.push(scrape_config);
									}
								},
							);
						}
						if (modeIn === "agent") {
							if (promConfig.remote_write) {
								objects.push(promConfig.remote_write);
							}
						}
						if (configKeysForReplaceIn) {
							objects.push(...configKeysForReplaceIn(promConfig));
						}
						return objects;
					};

					return {
						promConfigYamlAsset: new pulumi.asset.StringAsset(
							dump(modifiedConfig),
						),
						promConfigReplaceSha: CopyableAsset.sha256AndLength(
							Buffer.from(JSON.stringify(getBaseKeys(modifiedConfig))),
						),
					};
				},
			);
		const configLocation = "/etc/prometheus/prometheus.yml";
		super(
			name,
			{
				...commonArgs,
				deployType: DockerDeployType.Replace,
				name: serviceName ?? "prometheus",
				service: pulumi
					.output({
						exposeIn: expose,
						serviceIn: service,
						cliFlagsIn: cliFlags,
						modeIn: mode,
						promConfigReplaceShaIn: promConfigReplaceSha,
					})
					.apply(
						({
							exposeIn,
							serviceIn,
							cliFlagsIn,
							modeIn,
							promConfigReplaceShaIn,
						}) => {
							// Make sure they're ips
							exposeIn.interfaceIps.forEach((i) => {
								if (isIP(i) === 0) {
									throw new Error(`${i} is not an ip address interface`);
								}
							});
							const commandFlags =
								modeIn === "server"
									? ["--storage.tsdb.path=/prometheus"]
									: ["--storage.agent.path=/prometheus", "--agent"];
							let command = [
								...commandFlags,
								`--config.file=${configLocation}`,
								"--web.console.libraries=/usr/share/prometheus/console_libraries",
								"--web.console.templates=/usr/share/prometheus/consoles",
							];
							const castService = serviceIn as v3.Service;

							if (cliFlagsIn) {
								// Make sure we don't override the config-file
								if (
									cliFlagsIn.some((f) => {
										return f.startsWith("--config.file");
									})
								) {
									throw new pulumi.InputPropertyError({
										propertyPath: "cliFlags",
										reason:
											"Cannot override --config.file since we mount it in a specific place for you",
									});
								}
								// Replace the base if there's overlap
								command = [
									...command.filter((flag) => {
										const f = flag.split("=")[0];
										return !cliFlagsIn.some((extF) =>
											extF.trim().startsWith(f),
										);
									}),
									...cliFlagsIn,
								];
							}

							const extraHosts = ["host.docker.internal:host-gateway"];
							if (castService?.extra_hosts) {
								if (Array.isArray(castService.extra_hosts)) {
									extraHosts.push(...castService.extra_hosts);
								} else {
									const castExtraHosts = castService.extra_hosts as {
										[k: string]: string | string[];
									};
									Object.keys(castExtraHosts).forEach((host) => {
										const mapping = castExtraHosts[host];
										if (Array.isArray(mapping)) {
											extraHosts.push(...mapping.map((m) => `${host}:${m}`));
										} else {
											extraHosts.push(`${host}:${mapping}`);
										}
									});
								}
							}

							const changeShaLabels = {
								"hanseltime.pulumi/sdconfigsha": promConfigReplaceShaIn,
							};

							return {
								...castService,
								image: castService?.image ?? "prom/prometheus:latest",
								labels: castService?.labels
									? overrideLabelsOrEnv(
											overrideLabelsOrEnv({}, castService.labels),
											changeShaLabels,
										)
									: changeShaLabels,
								ports: exposeIn.interfaceIps.map(
									(i) => `${i}:${exposeIn.port}:9090`,
								),
								restart: castService?.restart ?? "unless-stopped",
								healthcheck: {
									test: `wget --spider 127.0.0.1:9090`,
									// For now just use the defaults
								},
								command,
								volumes: [
									"prometheus_data:/prometheus",
									...(castService?.volumes ?? []),
								],
								// nobody user found by running 'id' in container
								user: {
									userId: 65534,
									groupId: 65534,
								},
								networks: ["default"],
								extra_hosts: extraHosts,
							} as ServiceInputified;
						},
					),
				mounts: pulumi.output(mounts).apply((mountsIn) => {
					return [
						{
							name: "prometheus.yml",
							resource: promConfigYamlAsset,
							onContainer: configLocation,
						},
						...(mountsIn ?? []),
					];
				}),
			},
			options,
		);

		this.monitoringNetwork = this.createdNetworks.apply((cn) => cn["default"]);
		this.port = pulumi.output(args.expose).apply(({ port }) => `${port}`);
		this.privatePort = pulumi.output("9090");

		this.registerOutputs({
			port: this.port,
			monitoringNetwork: this.monitoringNetwork,
			privatePort: this.privatePort,
		});
	}
}
