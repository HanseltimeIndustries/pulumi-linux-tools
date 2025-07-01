import * as pulumi from "@pulumi/pulumi";
import { isIP } from "net";
import type { DockerComposeServiceArgs } from "../DockerComposeService";
import { DockerComposeService } from "../DockerComposeService";
import { DockerDeployType } from "../types";
import { overrideLabelsOrEnv } from "../utils";

interface CAdvisorServiceArgs {
	connection: DockerComposeServiceArgs["connection"];
	homeDir: DockerComposeServiceArgs["homeDir"];
	tmpCopyDir: DockerComposeServiceArgs["tmpCopyDir"];
	usernsRemap: DockerComposeServiceArgs["usernsRemap"];
	/**
	 * The port that we will expose the cadvisor UI on and the interfaces attached.
	 *
	 * IMPORTANT - we do not recommend exposing this privileged container to the public internet.
	 * Instead, if you are using prometheus in a container, you will probably want to do:
	 *
	 * // loopback interface and the docker interface
	 * interfaceIps: ['127.0.0.1', dockerInstall.defaultDockerGatewayIP],
	 */
	expose: pulumi.Input<{
		port: pulumi.Input<number>;
		/**
		 * These could be the ips of the interfaces on the machine or an "all interface" ip
		 * like 0.0.0.0 or [::] for ipv6
		 *
		 * IMPORTANT - we do not recommend exposing this privileged container to the public internet.
		 * Instead, if you are using prometheus in a container, you will probably want to do:
		 *
		 * // loopback interface and the docker interface
		 * interfaceIps: ['127.0.0.1', dockerInstall.defaultDockerGatewayIP]
		 */
		interfaceIps: pulumi.Input<pulumi.Input<string>[]>;
	}>;
	/**
	 * Since CAdvisor binds to the docker socket proxy, we need to set up an internal network
	 * with enough ips for a gateway + cadvisor + socker proxy server
	 *
	 *
	 * We recommend setting a CIDR of /26 or /28 on an unused CIDR.  If you used DockerInstall, you can use the `.defaultInternalNetworkRange`
	 * dockerInstall.defaultInternalNetworkRange.claimIPCIDR('172.255.0.0/26', 'cadvisor').cidr
	 *
	 * Keep in mind that the defaultInternalNetworkRange tracks used cidrs in the same project per docker install (which shoujld be one per machine),
	 * so it will throw an error if some other network has claimed that range (helping avoid deploy time errors on the machine).
	 */
	dockerSocketNetworkCIDR: pulumi.Input<string>;
	/**
	 * This is the monitoring network that should have some sort of metric collector like prometheus or open telemetry on
	 * it.  So that it has access to this.
	 */
	monitoringNetwork: pulumi.Input<string>;
	/**
	 * Optional cli flags that you can apply.  We already provide the --docker socket flag to use a safer docker socket proxy.
	 *
	 * All other flags can be added here: https://github.com/google/cadvisor/blob/master/docs/runtime_options.md
	 */
	cliFlags?: pulumi.Input<pulumi.Input<string>[]>;
	/**
	 * These are additional labels to add to the service.  We add a prometheus.io/port label
	 * to match the port, since this is on a host network and can't be scraped.
	 */
	labels?: {
		/**
		 * This interface was referenced by `undefined`'s JSON-Schema definition
		 * via the `patternProperty` ".+".
		 */
		[k: string]: string | number | boolean | null;
	};
}

/**
 * Creates a DockerComposeService with cadvisor configured.
 *
 * Important - note that this service is privileged since it mounts the expected systems
 * in order to monitor all things like network interfaces, etc.
 */
export class CAdvisorService extends DockerComposeService {
	constructor(
		name: string,
		args: CAdvisorServiceArgs,
		options?: pulumi.ComponentResourceOptions,
	) {
		const dockerSocketProxyService = "dockersocketproxy";
		super(
			name,
			{
				usernsRemap: args.usernsRemap,
				name: "cadvisor",
				deployType: DockerDeployType.Replace,
				connection: args.connection,
				homeDir: args.homeDir,
				tmpCopyDir: args.tmpCopyDir,
				accessDockerSocket: {
					name: dockerSocketProxyService,
					readonly: true,
					apis: {
						CONTAINERS: 1,
						INFO: 1,
						VERSION: 1,
						TASKS: 1,
						IMAGES: 1,
					},
					networkCIDR: args.dockerSocketNetworkCIDR,
				},
				service: {
					image: "gcr.io/cadvisor/cadvisor:latest",
					ports: pulumi.output(args.expose).apply((expose) => {
						// Make sure they're ips
						expose.interfaceIps.forEach((i) => {
							if (isIP(i) === 0) {
								throw new Error(`${i} is not an ip address interface`);
							}
						});
						return expose.interfaceIps.map((i) => `${i}:${expose.port}:8080`);
					}),
					labels: pulumi
						.output({
							exposeIn: args.expose,
							labelsIn: args.labels,
						})
						.apply(({ exposeIn, labelsIn }) => {
							return overrideLabelsOrEnv(
								{
									"prometheus.io/port": exposeIn.port,
								},
								labelsIn,
							);
						}),
					restart: "unless-stopped",
					healthcheck: {
						test: `wget --spider 127.0.0.1:8080`,
						// For now just use the defaults
					},
					command: pulumi
						.output(args.cliFlags)
						.apply((cliFlags) => [
							`--docker=tcp://${dockerSocketProxyService}:2375`,
							...(cliFlags ?? []),
						]),
					volumes: [
						"/:/rootfs:ro",
						"/var/run:/var/run:ro",
						"/sys:/sys:ro",
						"/var/lib/docker/:/var/lib/docker:ro",
					],
					networks: ["default"],
					user: "ROOT_USER",
					privileged: true,
					userns_mode: "host",
				},
				monitoringNetwork: args.monitoringNetwork,
			},
			options,
		);
	}
}
