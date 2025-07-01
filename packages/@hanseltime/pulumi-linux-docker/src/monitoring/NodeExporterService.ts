import * as pulumi from "@pulumi/pulumi";
import { isIP } from "net";
import type { DockerComposeServiceArgs } from "../DockerComposeService";
import { DockerComposeService } from "../DockerComposeService";
import { DockerDeployType } from "../types";
import { overrideLabelsOrEnv } from "../utils";

interface NodeExporterServiceArgs {
	connection: DockerComposeServiceArgs["connection"];
	homeDir: DockerComposeServiceArgs["homeDir"];
	tmpCopyDir: DockerComposeServiceArgs["tmpCopyDir"];
	usernsRemap: DockerComposeServiceArgs["usernsRemap"];
	/**
	 * This specifies what interface ips the metrics server should be on.
	 * Since this is a high-privileged application, try to keep it outside of public internet.
	 * If you need to expose metrics over public internet, make sure to use something like a
	 * local prometheus scraper that can scrape on the localhost interface.
	 */
	expose: pulumi.Input<{
		port: pulumi.Input<number>;
		/**
		 * These could be the ips of the interface's on the machine or an "all interface" ip
		 * like 0.0.0.0 or [::] for ipv6
		 *
		 * IMPORTANT - we do not recommend exposing this privileged container to the public internet.
		 * Instead, if you are using prometheus in a container, you will probably want to do:
		 *
		 * // loopback interface and the docker interface
		 * interfacesIps: ['127.0.0.1', dockerInstall.defaultDockerGatewayIP]
		 *
		 * If your public internet was on eth0 and had a public ip of 111.11.11.2, you would
		 * need to specify that ip address.  For a vlan, you would specify the ip of the machine
		 * on the vlan.
		 */
		interfaceIps: pulumi.Input<pulumi.Input<string>[]>;
	}>;
	/**
	 * Optional cli flags that you can apply.
	 * We already provide the web.listen-address=port
	 *    --path.rootfs=/host  which matches the root mount
	 *    '--collector.filesystem.ignored-mount-points="^/(sys|proc|dev|host|etc)($$|/)"' to reduce temp monitoring
	 *
	 * https://github.com/prometheus/node_exporter?tab=readme-ov-file
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
 * Creates a DockerComposeService with prometheus node-exported configured to monitor the portions
 * of your linux system that you have mounted.
 *
 * Note - this is just an opinionated way to do this.  If you want more flexibility to do this, go ahead
 * and make your own DockerComposeService (using whatever config from this you want.)
 *
 * Important - note that this service is privileged since it mounts the expected systems
 * in order to monitor all things like network interfaces, etc. and it attaches directly to the host network
 * for network monitoring.
 */
export class NodeExporterService extends DockerComposeService {
	constructor(
		name: string,
		args: NodeExporterServiceArgs,
		options?: pulumi.ComponentResourceOptions,
	) {
		super(
			name,
			{
				usernsRemap: args.usernsRemap,
				name: "nodeexporter",
				deployType: DockerDeployType.Replace,
				connection: args.connection,
				homeDir: args.homeDir,
				tmpCopyDir: args.tmpCopyDir,
				service: {
					image: "quay.io/prometheus/node-exporter:latest",
					// We need to run on the host
					network_mode: "host",
					pid: "host",
					restart: "unless-stopped",
					// TODO: adding healthcheck on host
					healthcheck: "NO_SHELL",
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
					command: pulumi
						.output({
							cliFlags: args.cliFlags,
							expose: args.expose,
						})
						.apply(({ cliFlags, expose }) => {
							// Make sure they're ips
							expose.interfaceIps.forEach((i) => {
								if (isIP(i) === 0) {
									throw new Error(`${i} is not an ip address interface`);
								}
							});
							const base = [
								"--path.rootfs=/host",
								...expose.interfaceIps.map(
									(intIp) => `--web.listen-address=${intIp}:${expose.port}`,
								),
								'--collector.filesystem.ignored-mount-points="^/(sys|proc|dev|host|etc)($$|/)"',
							];

							if (cliFlags) {
								// Replace the base if there's overlap
								return [
									...base.filter((flag) => {
										const f = flag.split("=")[0];
										return !cliFlags.some((extF) => extF.trim().startsWith(f));
									}),
									...cliFlags,
								];
							}

							return base;
						}),
					volumes: ["/:/host:ro,rslave"],
					user: "ROOT_USER",
					privileged: true,
					userns_mode: "host",
				},
			},
			options,
		);
	}
}
