import * as pulumi from "@pulumi/pulumi";
import type { DockerComposeServiceArgs } from "../DockerComposeService";
import type { PrometheusServiceArgs } from "./PrometheusService";
import { PrometheusService } from "./PrometheusService";
import type { PrometheusHttpConfig } from "./prometheusTypes";

export interface PrometheusWithDockerSDArgs {
	connection: DockerComposeServiceArgs["connection"];
	homeDir: DockerComposeServiceArgs["homeDir"];
	tmpCopyDir: DockerComposeServiceArgs["tmpCopyDir"];
	usernsRemap: DockerComposeServiceArgs["usernsRemap"];
	/**
	 * Defaults to prometheus
	 */
	serviceName?: string;
	mode: PrometheusServiceArgs["mode"];
	expose: PrometheusServiceArgs["expose"];
	/**
	 * Since Prometheus service discovery binds to the docker socket proxy, we need to set up an internal network
	 * with enough ips for a gateway + cadvisor + socker proxy server
	 *
	 * We recommend setting a CIDR of /26 or /28 on an unused CIDR.  If you used DockerInstall, you can use the `.defaultInternalNetworkRange`
	 * dockerInstall.defaultInternalNetworkRange.claimIPCIDR('172.255.0.0/26', 'prometheus').cidr
	 *
	 * Keep in mind that the defaultInternalNetworkRange tracks used cidrs in the same project per docker install (which shoujld be one per machine),
	 * so it will throw an error if some other network has claimed that range (helping avoid deploy time errors on the machine).
	 */
	dockerSocketNetworkCIDR: pulumi.Input<string>;
	dockerServiceDiscovery?: pulumi.Input<
		{
			/**
			 * This will add a 'keep' filter to the top of the relabel_configs that checks
			 * for prometheus.io/scrape=true labels before scraping the container.
			 */
			requireScrapeLabel?: pulumi.Input<boolean>;
			/**
			 * The port to scrape metrics from, when `role` is nodes, and for discovered
			 * tasks and services that don't have published ports.
			 *
			 * default: 80
			 */
			port?: pulumi.Input<number>;
			/**
			 * Sort all non-nil networks in ascending order based on network name and
			 * get the first network if the container has multiple networks defined,
			 * thus avoiding collecting duplicate targets.
			 *
			 * default: true
			 */
			match_first_network?: pulumi.Input<boolean>;
			/**
			 * Optional filters to limit the discovery process to a subset of available
			 * resources.
			 * The available filters are listed in the upstream documentation:
			 * https://docs.docker.com/engine/api/v1.40/#operation/ContainerList
			 */
			filters?: pulumi.Input<
				pulumi.Input<{
					name: pulumi.Input<string>;
					values: pulumi.Input<string | string[]>;
				}>[]
			>;
			/**
			 * The time after which the containers are refreshed.
			 *
			 * defautl: 60s
			 */
			refresh_interval?: string;
			/**
			 * This is a relabel config for specific additional steps.  We alread construct the front portion
			 * of the relable configs so that prometheus.io/port is used in order to make sure that host containers
			 * have a port to look for.  Additionally, the 'requireScrapeLabel' configuration adds the easliest
			 * rule to support prometheus.io/scrape=true for on/off functionality.
			 */
			relabel_configs?: any[];
		} & Partial<PrometheusHttpConfig>
	>;
	/**
	 * This is the prometheus config in object form.  It will be serialized to yaml and mounted for you.
	 *
	 * Because we are already setting up safe docker socket access for docker_sd_config, you should not provide
	 * the host property for docker_sd_config.
	 */
	prometheusConfig?: any;
	service?: PrometheusServiceArgs["service"];
	/**
	 * IMPORTANT - these mounts will have the prometheus config added to it.  These are only additional mounts.
	 */
	mounts?: PrometheusServiceArgs["mounts"];
	secrets?: PrometheusServiceArgs["secrets"];
	cliFlags?: PrometheusServiceArgs["cliFlags"];
	accessDockerSocket?: PrometheusServiceArgs["accessDockerSocket"];
	reuploadId?: DockerComposeServiceArgs["reuploadId"];
	upArgs?: DockerComposeServiceArgs["upArgs"];
	/**
	 * This is here specifically if you have something like a central prometheus server and a
	 * prometheus agent on the same Docker machine.  This is kinda crazy since if you're on the
	 * same machine, you don't really need a light-weight agent andserver, but for demo/testing purposes we provide it.
	 */
	monitoringNetwork?: DockerComposeServiceArgs["monitoringNetwork"];
}

/**
 * Creates a DockerComposeService with prometheus setup with an automatic service discovery on the local docker socket.
 *
 * This is meant to provide a safe (internal only) docker socket proxy for your prometheus instance to scrape from.
 *
 * IMPORTANT! Prometheus is a data storage application and if you run it on the same machine, you will need to be aware
 * of storage/cpu/memory constraints and how they may impact your other docker applications.
 *
 * If you do not want to have that risk, running prometheus on another machine and using an OpenTelemetryCollector may
 * be more desirable since collectors are just pipelines.
 *
 * TODO: standardize a way to skip services that are on internal networks or not connected aside from just requiring
 * a prometheus.io/scrape label
 */
export class PrometheusWithDockerSD extends PrometheusService {
	constructor(
		name: string,
		args: PrometheusWithDockerSDArgs,
		options?: pulumi.ComponentResourceOptions,
	) {
		const { prometheusConfig, dockerServiceDiscovery, ...commonArgs } = args;

		const dockerSocketProxyService = "dockersocketproxy";
		const promConfig = pulumi
			.output({
				prometheusConfigIn: prometheusConfig,
				dockerServiceDiscoveryIn: dockerServiceDiscovery,
			})
			.apply(({ prometheusConfigIn, dockerServiceDiscoveryIn }) => {
				const extraScrapeConfigs = (prometheusConfigIn?.scrape_configs ??
					[]) as {
					job_name: string;
					docker_sd_configs?: any;
				}[];
				extraScrapeConfigs.forEach((c, idx) => {
					if (c.docker_sd_configs) {
						throw new pulumi.InputPropertyError({
							propertyPath: `prometheusConfig.scrape_configs[${idx}]`,
							reason: `Any docker service discovery config should be done in dockerServiceDiscovery!`,
						});
					}
				});

				const { requireScrapeLabel, relabel_configs, ...sdConfig } =
					dockerServiceDiscoveryIn ?? {};

				const dockerSDJob = {
					job_name: "docker-discovered-containers",
					docker_sd_configs: [
						{
							...sdConfig,
							host: `http://${dockerSocketProxyService}:2375`,
							host_networking_host: "host.docker.internal",
						},
					],
					relabel_configs: [
						...(requireScrapeLabel
							? [
									{
										source_labels: [
											"__meta_docker_container_label_prometheus_io_scrape",
										],
										regex: true,
										action: "keep",
									},
								]
							: []),
						// Host networked machines need to have their ports added since they're not inferred
						{
							source_labels: [
								"__meta_docker_container_network_mode",
								"__meta_docker_container_label_prometheus_io_port",
								"__address__",
							],
							regex: "host;(.*);(.*)",
							target_label: "__address__",
							replacement: "${2}:${1}",
							action: "replace",
						},
						// Respect the prometheus port mapping for non-host containers
						{
							source_labels: [
								"__meta_docker_container_network_mode",
								"__meta_docker_container_name",
								"__meta_docker_container_label_prometheus_io_port",
							],
							regex: "^(?:[^h]|h[^o]|ho[^s]|hos[^t]).*;\\/?(.+);(.+)",
							target_label: "__address__",
							action: "replace",
							replacement: "${1}:${2}",
						},
						// Non-host networked machines should be resolved by their container name since we're
						// expecting them to join to our network
						{
							source_labels: [
								"__meta_docker_container_network_mode",
								"__meta_docker_container_name",
								"__meta_docker_port_private",
								"__meta_docker_container_label_prometheus_io_port",
							],
							regex: "^(?:[^h]|h[^o]|ho[^s]|hos[^t]).*;\/?(.+);(.+);$",
							target_label: "__address__",
							action: "replace",
							replacement: "${1}:${2}",
						},
						{
							source_labels: ["__meta_docker_container_name"],
							target_label: "container_name",
							action: "replace",
						},
						{
							source_labels: [
								"__meta_docker_container_label_com_docker_compose_service",
							],
							target_label: "service",
							action: "replace",
						},
						{
							source_labels: ["__meta_docker_container_name"],
							target_label: "container_name",
							action: "replace",
						},
						...(relabel_configs ?? []),
					],
				};

				const promConfigObj = {
					...prometheusConfigIn,
					scrape_configs: [...extraScrapeConfigs, dockerSDJob],
				};
				return promConfigObj;
			});
		super(
			name,
			{
				...commonArgs,
				// This is covered by service discovery
				scrapeSelf: false,
				prometheusConfig: promConfig,
				accessDockerSocket: {
					name: dockerSocketProxyService,
					readonly: true,
					apis: {
						CONTAINERS: 1,
						SERVICES: 1,
						TASKS: 1,
						IMAGES: 1,
						NETWORKS: 1,
						VOLUMES: 1,
					},
					networkCIDR: args.dockerSocketNetworkCIDR,
				},
			},
			options,
		);
	}
}
