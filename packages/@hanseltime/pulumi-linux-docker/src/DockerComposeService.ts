import type { v3 } from "@hanseltime/compose-types";
import { CopyableAsset, isPathAsset } from "@hanseltime/pulumi-file-utils";
import type { PermissionObject } from "@hanseltime/pulumi-linux-base";
import {
	ACLPermissions,
	StrictACL,
	shellStrings,
} from "@hanseltime/pulumi-linux-base";
import type {
	BuiltRules,
	Condition,
	HttpHealthCheck,
	TLSConfig,
} from "@hanseltime/traefik";
import { createHttpRouteRuleLabel } from "@hanseltime/traefik";
import type { types } from "@pulumi/command";
import { remote } from "@pulumi/command";
import * as pulumi from "@pulumi/pulumi";
import { AssetArchive } from "@pulumi/pulumi/asset";
import { dot } from "dot-object";
import { readdir } from "fs/promises";
import { dump } from "js-yaml";
import { basename } from "path";
import { LIBRARY_PREFIX } from "./constants";
import type { Inputify, PropsInputify } from "./helperTypes";
import { dockerDownCommand, dockerUpCommand } from "./shell";
import type { TempCopyDirArgs, WaitOnChildren } from "./types";
import { DockerDeployType } from "./types";

type NoShortForm<T> = T extends string
	? never
	: T extends undefined
		? never
		: T;

interface MandatoryHealthCheck {
	/**
	 * Docker compose health check to run and wait for - which we want to enforce as a primary concern.
	 *
	 * In the event that your container does not have a shell, you can specify 'NO_SHELL' and we
	 * will just bring up the service without actually waiting for health.
	 */
	healthcheck:
		| Inputify<
				Omit<v3.Healthcheck, "test"> & {
					test: v3.Healthcheck["test"];
				}
		  >
		| "NO_SHELL";
}

interface BlueGreenInformation {
	/**
	 * The full network name that was set up in docker with a traefik proxy that we expect to route
	 * through
	 */
	networkName: pulumi.Input<string>;
	ports: {
		/**
		 * The local port on the service to connect this entrypoint to
		 */
		local: pulumi.Input<number>;
		/**
		 * An entrypoint that was created previously via static configuration for traefik
		 */
		entrypoint: pulumi.Input<string>;
		/**
		 * The rules for traefik to determine if it should route traffic to this service's port
		 */
		rule: pulumi.Input<BuiltRules | Condition>;
		/**
		 * Traefik health check information - this controls is traefik starts routing traffic to the port,
		 * this DOES NOT replace docker health checks for determining when to take dwon
		 */
		healthCheck: Inputify<HttpHealthCheck>;
		/**
		 * If the entrypoint is https this should at least be enabled via true, otherwise, it can
		 * be fine-grained controlled if there is a Host rule
		 */
		tls: pulumi.Input<TLSConfig | boolean>;
	}[];
}

type ServiceInputified = PropsInputify<
	Omit<
		v3.Service,
		"secrets" | "container_name" | "volumes" | "build" | "healthcheck" | "user"
	>
> &
	MandatoryHealthCheck & {
		/**
		 * We only accept the string short-form volumes and will then declare the requisite volumes if they
		 * are not mounted volumes.
		 *
		 * It is not necessary to supply strings for mounts via the `mounts:` option, since we will auto-create the mapping
		 *
		 * Note: if you want to do a mount, either make sure it is an absolute path that is guaranteed
		 * or that it is relative to the context you provided
		 */
		volumes?: pulumi.Input<pulumi.Input<string[]>>;
		/**
		 * Normal docker commpose build arguments with the exception of 'context', since that will
		 * be uploaded to a starndard folder that will hold the compose.yaml within it.
		 */
		build?: Inputify<Omit<NoShortForm<v3.Service["build"]>, "context">> & {
			context: pulumi.Input<pulumi.asset.Archive | pulumi.asset.Asset>;
		};
		/**
		 * This helps ensure that you are explicitly aware of which user is running the application
		 * and what, in the event of a container breach, may be at risk on the machine.
		 *
		 * We enforce numeric ids since those can be enforced between the host and container better than
		 * semantic names
		 */
		user:
			| pulumi.Input<{
					userId: pulumi.Input<number>;
					groupId: pulumi.Input<number>;
			  }>
			| "ROOT_USER";
	};

export interface DockerComposeServiceArgs extends TempCopyDirArgs {
	/**
	 * The name of the service - must be unique on the machine
	 */
	name: pulumi.Input<string>;
	/**
	 * This is required and should match exactly how docker was installed on the machine.
	 *
	 * This is used to calculate volume permissions in conjunction with the userIds.
	 *
	 * If your docker install has disabled the default usernsRemap, then you can provide a 0,0 setting (not recommended)
	 */
	usernsRemap: pulumi.Input<{
		start: pulumi.Input<number>;
		length: pulumi.Input<number>;
	}>;
	/**
	 * We do not allow your service to bind directly to the docker socket since that can lead to vectors
	 * for attacking the host system or other containers.
	 *
	 * If you would like to use the docker socket, you can enable this and a docker-socket-proxy will
	 * be set up on an internal network for your service that is reachable at tcp://<name>:2375.
	 *
	 * See https://github.com/Tecnativa/docker-socket-proxy for options like API configuration.
	 *
	 * You will need to determine how to change your docker socket use in the image to use this service
	 * instead of the mounted socket, but all maintained images should support this.
	 */
	accessDockerSocket?: {
		/**
		 * Defaults to dockersocketproxy
		 */
		name?: string;
		/**
		 * If set to true, this will only allow GET and HEAD operations
		 */
		readonly: boolean;
		/**
		 * This is the network CIDR range for the internal network.  It should be > (2 * replicas * service + 4)
		 *
		 * We actually recommend using a CIDR in the `DefaultInternalNetworkRange.WHOLE_RANGE`. Note, the range
		 * has to be unique across the entire machine and other services.
		 */
		networkCIDR: string;
		apis?: {
			/**
			 * api keys matching the https://github.com/Tecnativa/docker-socket-proxy?tab=readme-ov-file#grant-or-revoke-access-to-certain-api-sections
			 * keys including caps.
			 *
			 * 0 disables and 1 explicitly enables
			 */
			[api: string]: 0 | 1;
		};
		/**
		 * Other options are configured by environment variable
		 *
		 * https://github.com/Tecnativa/docker-socket-proxy?tab=readme-ov-file#grant-or-revoke-access-to-certain-api-sections
		 *
		 * These are overridden by the explidit apis field if there's duplication
		 */
		env?: {
			[e: string]: string;
		};
	};
	/**
	 * You may not want to trigger new builds for some things that are mounted into containers.  This
	 * is declaring assets/folders that will be loaded into a ./mnt directory.
	 *
	 * You can reference them via a docker mount `./mnt/<name>:<in_container>` in your service specification
	 */
	mounts?: pulumi.Input<
		pulumi.Input<{
			/**
			 * This is an asset that will be loaded to ./mnt/<name> and mounted
			 */
			resource: pulumi.Input<pulumi.asset.Archive | pulumi.asset.Asset>;
			/**
			 * This will be the name of the folder/file where we mnt the volumes on the host machine
			 */
			name: pulumi.Input<string>;
			/**
			 * The path on the container where this will be mapped to
			 *
			 * Basically, this will automatically perform the './mnt/<name>:<onContainer>" volume specification
			 */
			onContainer: pulumi.Input<string>;
			/**
			 * All volumes are read-only by default, you have to specify otherwise
			 */
			readWrite?: boolean;
			/**
			 * By default, we just assign the user of the service to have permissions to access the volume and
			 * the deployment user (which is probably root).  This allows you to specify other users who should
			 * also have access to the volume (read-only) - this is good for something like changing the userId
			 * that you're running under but keeping a blue-green deployment
			 */
			additionalUsers?: pulumi.Input<
				pulumi.Input<{
					userId: pulumi.Input<number>;
					groupId: pulumi.Input<number>;
				}>[]
			>;
		}>[]
	>;

	/**
	 * A list of environment variables to be added for the docker file build
	 */
	connection: pulumi.Input<types.input.remote.ConnectionArgs>;
	/**
	 * The expected home directory path (absolute) of the connection user
	 */
	homeDir: pulumi.Input<string>;
	/**
	 * The service description like you would declare in docker-compose
	 * with a few things removed due to this resource setting up things like context, etc.
	 */
	service: ServiceInputified;
	/**
	 * Secrets that will be mounted via a file into the containers and given read-only access
	 * to for the USER (unless overridden by secretUsers)
	 */
	secrets?: pulumi.Input<
		pulumi.Input<{
			name: pulumi.Input<string>;
			value: pulumi.Input<string>;
		}>[]
	>;
	/**
	 * If this is set, this will manage the users (via ACL) that can access the docker secrets
	 * that are mounted into the container.  You provide the userIds for the user in the docker
	 * container and we will add appropriate permissions.
	 *
	 * This is useful if you are trying to blue-green a compose service and change the user id.
	 * In that scenario, you would first deploy with this argument set and then clean up the IAC
	 * by removing this array so that the only user allowed would be the current user.
	 *
	 * Another scenario for this would be if you wanted to have the secret be root accessible and wrote
	 * an entrypoint that read the secret in before running your app under a less-privileged user.
	 * In that case, you would maintain that the secret is only allowed by the '0' user.
	 */
	secretUserIds?: pulumi.Input<pulumi.Input<number[]>>;
	/**
	 * The docker compose networks that should be available to this service.  If not
	 * marked as external, these will be created by docker compose for you.
	 *
	 * Note: no networks attaches to the default network, you will need to set the service.network_mode: none
	 *
	 * Keep in mind that blue-green applies it's own proxy network so you don't have to manage that.
	 */
	networks?: Inputify<v3.ComposeSpecification["networks"]>;
	/**
	 * blue-green - we use docker compose to deploy both and then scale one down
	 *    If you use blue-green, then your ports are not actually exposed through docker and instead are mapped
	 * replace - this is a downtime operation.  We stop the current service and then bring it back up with the new build
	 * manual - this means that the docker run will never be called until you specifically take it down.
	 */
	deployType: DockerDeployType;
	/**
	 * Required if using blue-green.  This should supply information about the traefik proxy that was configured
	 * and then should provide responsible mappings from the service ports to traefik.
	 */
	blueGreen?: pulumi.Input<BlueGreenInformation>;
	/**
	 * If you need to force a reupload due to an interruption, you can do so by incrementing this number
	 */
	reuploadId?: number;
}

// Wait one more second to make sure we weren't racing
const BUFFER_WAIT_TIME_SECONDS = 1;
const COMPOSE_FILE = "compose.yml";
const BUILD_FOLDER = "build";
const MOUNT_FOLDER = "mnt";
export const BLUE_GREEN_NETWORK = "blueGreenGateway";

/**
 * A resource that is meant for smaller-scale rolling deployments via docker-compose.
 *
 * Note: this type of resource and set up pales in comparison to something like k8s.  This exists
 *       for you to trade off the complexity of understanding K8s for manual triage via SSH and
 *       a familiarity with docker-compose.  If you anticipate scale, you will ultimately move past
 *       this set of resources in the long-term.
 *
 * Each one of these components represents a separate docker compose file with a single
 * service in it.  This creates a standardized set of folders around the compose file
 * so that it can be run with updates on a single local machine.
 *
 * Folder structure:
 * /<user root>/docker/<service name>/
 *    compose.yml - maintained by this resource
 *    mnt/
 *      <name> - any mounted directories or files you name and provide here
 *    build/ - the entire build.context archive that you provide (including Dockerfile)
 *
 * /var/pulumi-docker/.secrets/<service name> - contains secret files that will be mounted into the container
 *
 * Deployment types:
 * 		TODO -
 *
 */
export class DockerComposeService
	extends pulumi.ComponentResource
	implements WaitOnChildren
{
	last: pulumi.Input<pulumi.Resource>;
	constructor(
		name: string,
		args: DockerComposeServiceArgs,
		opts?: pulumi.ComponentResourceOptions,
	) {
		super(`${LIBRARY_PREFIX}:BuildDockerfile`, name, args, opts);
		const {
			secrets,
			secretUserIds,
			name: serviceName,
			deployType,
			service,
			networks,
			blueGreen,
			mounts,
			connection,
			homeDir,
			accessDockerSocket,
			usernsRemap,
		} = args;

		const serviceFolder = pulumi
			.output({
				homeDirIn: homeDir,
				serviceNameIn: serviceName,
			})
			.apply(({ homeDirIn, serviceNameIn }) => {
				return `${homeDirIn}/docker/${serviceNameIn}`;
			});
		const buildContextPath = serviceFolder.apply(
			(serviceFolderIn) => `${serviceFolderIn}/${BUILD_FOLDER}`,
		);
		const composeFilePath = serviceFolder.apply(
			(serviceFolderIn) => `${serviceFolderIn}/${COMPOSE_FILE}`,
		);
		const secretMountDir = pulumi
			.output(serviceName)
			.apply((serviceNameIn) => `/var/pulumi-docker/.secrets/${serviceNameIn}`);
		// Create Compose
		const composeSpec = pulumi
			.output({
				serviceIn: service,
				secretsIn: secrets,
				secretMountDirIn: secretMountDir,
				serviceNameIn: serviceName,
				buildContextPathIn: buildContextPath,
				networksIn: networks,
				deployTypeIn: deployType,
				blueGreenIn: blueGreen,
				mountsIn: mounts,
				accessDockerSocketIn: accessDockerSocket,
			})
			.apply(
				({
					serviceNameIn,
					secretsIn,
					secretMountDirIn,
					serviceIn,
					buildContextPathIn,
					networksIn = {},
					deployTypeIn,
					blueGreenIn,
					mountsIn,
					accessDockerSocketIn,
				}) => {
					if (deployTypeIn !== DockerDeployType.BlueGreen && blueGreenIn) {
						throw new pulumi.InputPropertyError({
							propertyPath: "blueGreen",
							reason: `blueGreen settings should only be supplied for BlueGreen deployment type. (docker compose service: ${serviceNameIn})`,
						});
					}

					const user =
						serviceIn.user === "ROOT_USER"
							? "0:0"
							: `${serviceIn.user.userId}:${serviceIn.user.groupId}`;
					const buildCast = serviceIn.build as NoShortForm<v3.Service["build"]>;
					const volumeCast = (serviceIn.volumes as string[]) ?? [];
					let dependsOnFull: {
						[s: string]: {
							restart?: boolean | string;
							required?: boolean;
							condition:
								| "service_started"
								| "service_healthy"
								| "service_completed_successfully";
						};
					};
					// Convert any dependsOnCast to the explicit format
					if (Array.isArray(serviceIn.depends_on)) {
						dependsOnFull = serviceIn.depends_on.reduce(
							(full, dep) => {
								full[dep] = {
									restart: false,
									condition: "service_started",
									required: true,
								};
								return full;
							},
							{} as {
								[s: string]: {
									restart?: boolean | string;
									required?: boolean;
									condition:
										| "service_started"
										| "service_healthy"
										| "service_completed_successfully";
								};
							},
						);
					} else if (serviceIn.depends_on) {
						dependsOnFull = {
							...(serviceIn.depends_on as {
								[s: string]: {
									restart?: boolean | string;
									required?: boolean;
									condition:
										| "service_started"
										| "service_healthy"
										| "service_completed_successfully";
								};
							}),
						};
					} else {
						dependsOnFull = {};
					}

					const socketServiceOptions = accessDockerSocketIn
						? this.getSocketServiceSidecarOptions(accessDockerSocketIn)
						: {
								socketSideCarService: {},
								socketNetworks: {},
								socketNetworkName: "",
								socketSideCarServiceName: "",
							};
					if (socketServiceOptions.socketSideCarServiceName) {
						dependsOnFull[socketServiceOptions.socketSideCarServiceName] = {
							restart: false,
							condition: "service_started",
							required: true,
						};
					}

					const sNetworks: v3.Service["networks"] = serviceIn.networks
						? (serviceIn.networks as v3.Service["networks"])
						: deployTypeIn === DockerDeployType.BlueGreen
							? []
							: socketServiceOptions.socketNetworkName
								? []
								: undefined;
					const labels = (serviceIn.labels ?? []) as NonNullable<
						v3.Service["labels"]
					>;

					if (sNetworks && socketServiceOptions.socketNetworkName) {
						this.addNetwork(sNetworks, socketServiceOptions.socketNetworkName);
						Object.keys(socketServiceOptions.socketNetworks).forEach((n) => {
							networksIn[n] = (socketServiceOptions.socketNetworks as any)[n];
						});
					}

					if (deployTypeIn === DockerDeployType.BlueGreen) {
						if (!blueGreenIn) {
							throw new Error(
								`Must supply blueGreen property for deployType: blue-green`,
							);
						}
						if (serviceIn.ports && serviceIn.ports.length > 0) {
							throw new Error(
								`You cannot explicitly map ports for blue-green since there will be multiple copies requiring the same port (${JSON.stringify(serviceIn.ports)})`,
							);
						}
						// TODO - rollout doesn't require traefik if something is isolated
						const traefikLabels = blueGreenIn.ports.reduce(
							(_lbls, p) => {
								const routeService = `bluegreen${serviceNameIn}${p.entrypoint}`;
								const routerPrefix = `traefik.http.routers.${routeService}`;
								const lbPrefix = `traefik.http.services.${routeService}.loadbalancer`;
								// If this is tls add configurations as such
								if (p.tls) {
									_lbls.push(`${routerPrefix}.tls=true`);
									if (typeof p.tls === "object") {
										const dotMap = dot(p.tls);
										Object.keys(dotMap).forEach((prop: string) => {
											_lbls.push(`${routerPrefix}.tls.${prop}=${dotMap[prop]}`);
										});
									}
								}
								_lbls.push(
									`${routerPrefix}.entrypoints=${p.entrypoint}`,
									createHttpRouteRuleLabel(routeService, p.rule),
									// Ensure that we traefik networking issues are semi-resiliient
									"traefik.http.middlewares.test-retry.retry.attempts=5",
									"traefik.http.middlewares.test-retry.retry.initialinterval=200ms",
									`${lbPrefix}.server.port=${p.local}`,
									...(
										Object.keys(p.healthCheck) as (keyof HttpHealthCheck)[]
									).map((prop) => {
										return `${lbPrefix}.healthCheck.${prop}=${p.healthCheck[prop]}`;
									}),
								);
								return _lbls;
							},
							["traefik.enable=true"],
						);

						if (Array.isArray(labels)) {
							labels.push(...traefikLabels);
						} else {
							traefikLabels.forEach((l) => {
								const [k, v] = l.split("=");
								labels[k] = v;
							});
						}

						networksIn[BLUE_GREEN_NETWORK] = {
							name: blueGreenIn.networkName,
							external: true,
						};
					}

					if (sNetworks) {
						const networkNames = Array.isArray(sNetworks)
							? sNetworks
							: Object.keys(sNetworks);
						networkNames.forEach((netName) => {
							if (!networksIn[netName]) {
								throw new Error(
									`Attempting to use a network that is not declared in networks! ${netName}`,
								);
							}
						});

						if (deployTypeIn === DockerDeployType.BlueGreen) {
							this.addNetwork(sNetworks, BLUE_GREEN_NETWORK);
						}
					}

					const topLevelVolumes = volumeCast.reduce(
						(vs, v: string) => {
							const [onhost] = v.split(":");
							if (onhost === "/var/run/docker.sock") {
								throw new Error(
									`Do not mount the docker.sock!  Instead use accessDockerSocket`,
								);
							}
							// Lack of a path separator gets interpreted as a docker volume
							if (!onhost.includes("/")) {
								vs[onhost] = {};
							} else {
								// Check relative paths to make sure they match the mounts
								if (!onhost.startsWith("/")) {
									const matchesMount = mountsIn?.some((m) => {
										if (onhost === `./${this.getMountRelPath(m)}`) {
											return true;
										}
										return false;
									});
									if (!matchesMount) {
										throw new Error(
											`relative path volume mounts must have a matching mount in ./mnt/<name>: ${v}`,
										);
									}
								}
							}
							return vs;
						},
						{} as { [v: string]: {} },
					);

					// Add the mapped volumes from our mapping and uniq to support people supplying it in both
					const mappedVolumes = Array.from(
						new Set([
							...volumeCast,
							...(mountsIn?.map((mnt) => {
								return `./${this.getMountRelPath(mnt)}:${mnt.onContainer}:${mnt.readWrite ? "rw" : "ro"}`;
							}) ?? []),
						]),
					);

					// Verify that there are no unused mounts or duplicate named mounts
					if (mountsIn) {
						const uniq = new Set<string>();
						const dup = new Set<string>();
						mountsIn.forEach((m) => {
							if (!uniq.has(m.name)) {
								uniq.add(m.name);
							} else {
								dup.add(m.name);
							}
						});
						if (dup.size > 0) {
							throw new Error(
								`Duplicate mount names found! ${Array.from(dup).join(", ")}`,
							);
						}
					}

					// Build must have context for our set up
					if (buildCast) {
						if (!buildCast.context) {
							throw new Error(
								`Must supply a build context archive with all resources for build if using build: properties!`,
							);
						}
					}
					// Coerce pids limit to avoid any fork bombs
					// 5.28 Ensure PIDs cgroup limit is used
					const topPidsLimit = serviceIn.pids_limit;
					const innerPidsLimit = (
						serviceIn.deploy?.resources as
							| v3.Deployment["resources"]
							| undefined
					)?.limits?.pids;
					let pids_limit: string | number = 200;
					if (topPidsLimit !== undefined || innerPidsLimit !== undefined) {
						if (
							topPidsLimit !== undefined &&
							innerPidsLimit !== undefined &&
							`${topPidsLimit}` !== `${innerPidsLimit}`
						) {
							throw new Error(
								`service.pids_limit and service.resources.limits.pids must match if you are going to use both! pids_limit: ${topPidsLimit} limits.pids: ${innerPidsLimit}`,
							);
						}
						pids_limit = topPidsLimit! ?? innerPidsLimit!;
					} else {
						console.warn(
							`${serviceNameIn} does not have pids_limit set.  Defaulting to ${pids_limit}`,
						);
					}

					const composeFile: v3.ComposeSpecification = {
						name: serviceNameIn,
						services: {
							// Add the sidecare if it exists
							...socketServiceOptions.socketSideCarService,
							[serviceNameIn]: {
								...(serviceIn as v3.Service),
								healthcheck:
									serviceIn.healthcheck === "NO_SHELL"
										? undefined
										: (serviceIn.healthcheck as v3.Healthcheck),
								// TODO - this negates pure image based setup - we'll want to change that
								...(buildCast
									? {
											build: {
												...buildCast,
												context: buildContextPathIn,
											},
										}
									: {}),
								labels,
								secrets: secretsIn?.map((s) => s.name),
								networks: sNetworks,
								volumes: mappedVolumes,
								pids_limit,
								// Since we're enforcing user call outs, we need to add them here
								user,
								depends_on: dependsOnFull,
							},
						},
						volumes: topLevelVolumes,
						secrets: secretsIn?.reduce(
							(map, secret) => {
								map[secret.name] = {
									file: `${secretMountDirIn}/${secret.name}`,
								};
								return map;
							},
							{} as { [k: string]: { file: string } },
						),
						networks: {
							...(networksIn as {
								[n: string]: v3.Network;
							}),
							...socketServiceOptions.socketNetworks,
						},
					};
					return composeFile;
				},
			);
		let mntArchive: pulumi.asset.AssetArchive | undefined;
		let setMountAcls: pulumi.Output<string> | undefined,
			insertMountAcls: pulumi.Output<string> | undefined,
			removeMountAcls: pulumi.Output<string> | undefined;
		if (mounts) {
			({ setMountAcls, insertMountAcls, removeMountAcls } = pulumi
				.output({
					serviceIn: service,
					mountsIn: mounts,
					serviceFolderIn: serviceFolder,
					usernsRemapIn: usernsRemap,
				})
				.apply(({ mountsIn, serviceIn, serviceFolderIn, usernsRemapIn }) => {
					const userId =
						(serviceIn.user === "ROOT_USER" ? 0 : serviceIn.user.userId) +
						usernsRemapIn.start;
					const groupId =
						(serviceIn.user === "ROOT_USER" ? 0 : serviceIn.user.groupId) +
						usernsRemapIn.start;
					if (
						usernsRemapIn.length !== 0 &&
						userId > usernsRemapIn.start + usernsRemapIn.length
					) {
						throw new Error(
							`User id: ${userId} is larger than the allotted user namespace ${usernsRemapIn.start}:${usernsRemapIn.length}`,
						);
					}
					if (
						usernsRemapIn.length !== 0 &&
						groupId > usernsRemapIn.start + usernsRemapIn.length
					) {
						throw new Error(
							`Group id: ${groupId} is larger than the allotted user namespace ${usernsRemapIn.start}:${usernsRemapIn.length}`,
						);
					}

					const acls = mountsIn.map((mnt) => {
						const dedup = new Set<string>();
						const permissions = mnt.readWrite
							? [
									ACLPermissions.Read,
									ACLPermissions.Write,
									ACLPermissions.ExecuteOnlyOnDir,
								]
							: [ACLPermissions.ExecuteOnlyOnDir, ACLPermissions.Read];
						const permObjects: PermissionObject[] = [
							{
								id: userId,
								// TODO - add write volumes
								permissions,
								type: "user",
							} as PermissionObject,
							{
								id: groupId,
								permissions,
								type: "group",
							} as PermissionObject,
							...(mnt.additionalUsers?.reduce((additional, user) => {
								additional.push(
									{
										id: user.userId,
										permissions,
										type: "user",
									},
									{
										id: user.groupId,
										permissions,
										type: "group",
									},
								);
								return additional;
							}, [] as PermissionObject[]) ?? []),
						].filter(({ id, type }) => {
							const key = `${type}:${id}`;
							if (!dedup.has(key)) {
								dedup.add(key);
								return true;
							}
							return false;
						});
						const acl = new StrictACL(
							`${serviceFolderIn}/${this.getMountRelPath(mnt)}`,
							permObjects,
						);

						return {
							insert: acl.insertCommand(),
							create: acl.setCommand(),
							remove: acl.removeCommand(),
						};
					});
					return {
						insertMountAcls: acls.map(({ insert }) => insert).join(" && "),
						setMountAcls: acls.map(({ create }) => create).join(" && "),
						removeMountAcls: acls.map(({ remove }) => remove).join(" && "),
					};
				}));
			mntArchive = new AssetArchive(
				new Promise((res) => {
					pulumi.output(mounts).apply((mountsIn) => {
						res(
							mountsIn.reduce(
								(map, mount) => {
									map[mount.name] = mount.resource;
									return map;
								},
								{} as {
									[key: string]: pulumi.asset.Archive | pulumi.asset.Asset;
								},
							),
						);
					});
				}),
			);
		}
		const { serviceBundle } = pulumi
			.output({
				serviceIn: service,
				composeSpecIn: composeSpec,
			})
			.apply(({ serviceIn, composeSpecIn }) => {
				const buildContext = serviceIn.build?.context;
				const composeStr = new pulumi.asset.StringAsset(dump(composeSpecIn));
				return {
					serviceBundle: new pulumi.asset.AssetArchive({
						[COMPOSE_FILE]: composeStr,
						...(buildContext ? { [BUILD_FOLDER]: buildContext } : {}),
						...(mntArchive ? { [MOUNT_FOLDER]: mntArchive } : {}),
					}),
				};
			});

		const safeAsset = CopyableAsset.fromParent(this, `${name}-assets`, {
			asset: serviceBundle,
			tmpCopyDir: args.tmpCopyDir,
			synthName: serviceName,
			noClean: false,
		});

		// Mounts should not trigger redeploys
		const dockerUpTriggers = [
			composeSpec,
			safeAsset.createChangeDetect("build", true),
			args.reuploadId,
		];

		// clear the build directory for the new files and move it to the .prev folder
		const { onCreateOrUpdateAssetDirectories, onFullDeleteAssetDirectories } =
			pulumi.output(serviceName).apply((nameIn) => {
				const dockerDir = "$HOME/docker";
				const current = `${dockerDir}/${nameIn}`;
				const previous = `${current}.prev`;
				return {
					onCreateOrUpdateAssetDirectories: `mkdir -p ${current} && ${shellStrings.deleteDirElements(previous)} && ${shellStrings.moveDirElements(current, previous, [MOUNT_FOLDER])} && ${shellStrings.deleteDirElements(current)}`,
					onFullDeleteAssetDirectories: `${shellStrings.deleteDirIfExists(current)} && ${shellStrings.deleteDirIfExists(previous)}`,
				};
			});
		const ensureServiceDir = new remote.Command(
			`${name}-ensure-clean-dir`,
			{
				connection,
				create: shellStrings.asSudoOutput(onCreateOrUpdateAssetDirectories),
				triggers: pulumi.output(dockerUpTriggers).apply((triggers) => triggers),
			},
			{
				parent: this,
			},
		);

		let createSecret: remote.Command | undefined;
		let secretCleanUpCommand: pulumi.Output<string> | undefined;
		// Create secrets files - TODO - we should use coptToRemote so we don't use a command
		let setSecretMountAcls: pulumi.Output<string> | undefined,
			insertSecretMountAcls: pulumi.Output<string> | undefined,
			removeSecretMountAcls: pulumi.Output<string> | undefined;
		if (secrets) {
			({ setSecretMountAcls, insertSecretMountAcls, removeSecretMountAcls } =
				pulumi
					.output({
						serviceIn: service,
						secretMountDirIn: secretMountDir,
						secretUserIdsIn: secretUserIds,
						usernsRemapIn: usernsRemap,
					})
					.apply(
						({
							serviceIn,
							secretMountDirIn,
							secretUserIdsIn,
							usernsRemapIn,
						}) => {
							const userIds = (secretUserIdsIn as number[]) ?? [
								(serviceIn.user === "ROOT_USER" ? 0 : serviceIn.user.userId) +
									usernsRemapIn.start,
							];
							const acl = new StrictACL(
								secretMountDirIn,
								userIds.map((uid) => {
									return {
										id: uid,
										// TODO - add write volumes
										permissions: [
											ACLPermissions.ExecuteOnlyOnDir,
											ACLPermissions.Read,
										],
										type: "user",
									} as PermissionObject;
								}),
							);

							return {
								insertSecretMountAcls: acl.insertCommand(),
								setSecretMountAcls: acl.setCommand(),
								removeSecretMountAcls: acl.removeCommand(),
							};
						},
					));

			createSecret = new remote.Command(
				`${name}-create-secrets-mount`,
				{
					connection,
					// Create a secret file folder and then write secret files out
					create: shellStrings.asSudoOutput(
						pulumi
							.secret({
								secretsIn: secrets,
								secretMountDirIn: secretMountDir,
								insertSecretMountAclsIn: insertSecretMountAcls,
							})
							.apply(
								({ secretsIn, secretMountDirIn, insertSecretMountAclsIn }) => {
									// For now, the docker user, i.e. root is only allowed to access this
									// This would need to be updated if we ran this under a different user (or we would want to add another usergroup)
									const cmd =
										`mkdir -p ${secretMountDirIn} && ` +
										secretsIn
											.map((secret) => {
												return `echo "${secret.value}" > ${secretMountDirIn}/${secret.name} && chmod 600 ${secretMountDirIn}/${secret.name} && ${insertSecretMountAclsIn}`;
											})
											.join(" && ");
									return cmd;
								},
							),
					),
					triggers: [args.reuploadId],
				},
				{
					parent: this,
					dependsOn: [ensureServiceDir],
				},
			);

			secretCleanUpCommand = pulumi
				.secret({
					secretsIn: secrets,
					secretMountDirIn: secretMountDir,
				})
				.apply(({ secretsIn, secretMountDirIn }) => {
					return shellStrings.onlyFilesInDirCommand(
						secretMountDirIn,
						secretsIn.map((s) => s.name),
					);
				});
		}

		const { makeCopyToRemote, cleanupCommand: serviceCleanupCommand } =
			createCleanDirUploadResources(
				`${name}-copy-build-assets`,
				{
					connection: connection,
					source: safeAsset.copyableSource,
					remotePath: pulumi
						.output({
							homeDirIn: homeDir,
							serviceNameIn: serviceName,
						})
						.apply(({ homeDirIn }) => `${homeDirIn}/docker/`),
					triggers: pulumi.output(dockerUpTriggers).apply((triggers) => triggers),
				},
				{
					parent: this,
					dependsOn: [ensureServiceDir],
				},
			);

		const copy = makeCopyToRemote();

		// We want to apply the ACLs here if we have mounts
		let mountAcls: remote.Command | undefined;
		if (insertMountAcls) {
			mountAcls = new remote.Command(
				`${name}-apply-mount-acls`,
				{
					connection,
					create: shellStrings.asSudoOutput(insertMountAcls),
				},
				{
					dependsOn: [copy],
				},
			);
		}

		const runCmd = pulumi
			.output({
				serviceNameIn: serviceName,
				deployTypeIn: deployType,
				composeFilePathIn: composeFilePath,
				serviceIn: service,
			})
			.apply(
				async ({
					serviceNameIn,
					deployTypeIn,
					composeFilePathIn,
					serviceIn,
				}) => {
					const maxWaitTimeout = Math.ceil(
						(await this.getMaxWaitTimeSeconds(serviceIn.healthcheck)) +
							BUFFER_WAIT_TIME_SECONDS,
					);
					return dockerUpCommand(serviceNameIn, {
						deployType: deployTypeIn,
						file: composeFilePathIn,
						maxWaitTimeout,
					});
				},
			);

		const dockerUp = new remote.Command(
			`${name}-docker-up-${deployType}`,
			{
				connection,
				create: shellStrings.asSudoOutput(runCmd),
				// Any time there is a change to the service or build information, re-run (not volumes that swap contents)
				triggers: pulumi
					.output({
						secretsIn: secrets,
						dockerUpTriggersIn: dockerUpTriggers,
					})
					.apply(({ secretsIn, dockerUpTriggersIn }) => {
						return [secretsIn, ...dockerUpTriggersIn];
					}),
			},
			{
				parent: this,
				dependsOn: pulumi.output(opts?.dependsOn).apply((parentDeps) => {
					const deps: pulumi.Resource[] = [
						copy,
						...(createSecret ? [createSecret] : []),
						...(mountAcls ? [mountAcls] : []),
					];

					if (parentDeps) {
						Array.isArray(parentDeps)
							? deps.push(...parentDeps)
							: deps.push(parentDeps);
					}
					return deps;
				}),
				// We use different names to make it clear what type of deploy is happening
				aliases: Object.values(DockerDeployType).map((t) => ({
					name: `${name}-docker-up-${t}`,
				})),
			},
		);
		// Remove any additional entries that weren't part of the new setup
		// (this will only be volumes and secrets)
		this.last = new remote.Command(
			`${name}-cleanup-prev-assets`,
			{
				connection: args.connection,
				create: shellStrings.asSudoOutput(
					pulumi
						.output({
							secretCleanUpCommandIn: secretCleanUpCommand,
							volumeCleanupCommand: serviceCleanupCommand,
							setMountAclsIn: setMountAcls,
							setSecretMountAclsIn: setSecretMountAcls,
						})
						.apply(
							({
								secretCleanUpCommandIn,
								volumeCleanupCommand,
								setMountAclsIn,
								setSecretMountAclsIn,
							}) => {
								return `${secretCleanUpCommandIn ? `${secretCleanUpCommandIn};` : ""} ${volumeCleanupCommand} ${setMountAclsIn ? `&& ${setMountAclsIn}` : ""} ${setSecretMountAclsIn ? `&& ${setSecretMountAclsIn}` : ""}`;
							},
						),
				),
				triggers: pulumi
					.output({
						secretsIn: secrets,
						triggersIn: copy.triggers,
						setMountAclsIn: setMountAcls,
						setSecretMountAclsIn: setSecretMountAcls,
					})
					.apply(
						({
							secretsIn,
							triggersIn,
							setMountAclsIn,
							setSecretMountAclsIn,
						}) => [
							secretsIn,
							setMountAclsIn,
							setSecretMountAclsIn,
							// Pulumi seems to be deserializing this wrong, so just use the object
							triggersIn,
						],
					),
			},
			{
				parent: this,
				dependsOn: [dockerUp, ...(createSecret ? [createSecret] : [])],
			},
		);

		// This is our teardown script that only triggers when the upper component is removed completely
		new remote.Command(
			`${name}-on-full-delete`,
			{
				connection: args.connection,
				delete: shellStrings.asSudoOutput(
					pulumi
						.output({
							composeFilePathIn: composeFilePath,
							onFullDeleteAssetDirectoriesIn: onFullDeleteAssetDirectories,
							secretMountDirIn: secretMountDir,
							removeMountAclsIn: removeMountAcls,
							removeSecretMountAclsIn: removeSecretMountAcls,
						})
						.apply(
							({
								composeFilePathIn,
								onFullDeleteAssetDirectoriesIn,
								secretMountDirIn,
								removeMountAclsIn,
								removeSecretMountAclsIn,
							}) =>
								`${dockerDownCommand({
									file: composeFilePathIn,
								})} ${removeMountAclsIn ? `&& ${removeMountAclsIn}` : ""} ${removeSecretMountAclsIn ? `&& ${removeSecretMountAclsIn}` : ""} && ${onFullDeleteAssetDirectoriesIn} && ${shellStrings.deleteDirIfExists(secretMountDirIn)}`,
						),
				),
			},
			{
				parent: this,
			},
		);
	}

	private getSocketServiceSidecarOptions(
		accessDockerSocket: NonNullable<
			DockerComposeServiceArgs["accessDockerSocket"]
		>,
	) {
		const socketNetworkName = "socketProxy";
		const socketServiceName = accessDockerSocket.name ?? "dockersocketproxy";
		return {
			socketSideCarServiceName: socketServiceName,
			socketNetworkName,
			socketNetworks: {
				[socketNetworkName]: {
					internal: true,
					driver: "bridge",
					ipam: {
						config: [
							{
								subnet: accessDockerSocket.networkCIDR,
							},
						],
					},
				},
			} as v3.Network,
			socketSideCarService: {
				[socketServiceName]: {
					environment: {
						...accessDockerSocket.env,
						...accessDockerSocket.apis,
						POST: accessDockerSocket.readonly ? 0 : 1,
					},
					userns_mode: "host", // We actually want 0:0 since normal root shouldn't get access to things like the socket
					image: "tecnativa/docker-socket-proxy",
					networks: [socketNetworkName],
					// This is the only acceptable full mounting of the socket
					volumes: [
						`/var/run/docker.sock:/var/run/docker.sock:${accessDockerSocket.readonly ? "ro" : "rw"}`,
					],
				} as v3.Service,
			},
		};
	}

	/**
	 *
	 * @param healthcheck
	 * @returns -1 if the healthcheck is no shell
	 */
	async getMaxWaitTimeSeconds(
		healthcheck: MandatoryHealthCheck["healthcheck"],
	) {
		if (healthcheck === "NO_SHELL") {
			return -1;
		}
		const parseDuration = (await import("parse-duration")).default;
		// Calculate a basic health check - defaults according to https://docs.docker.com/reference/dockerfile/#healthcheck
		let retries = 3;
		if (healthcheck.retries) {
			if (typeof healthcheck.retries === "string") {
				retries = parseInt(healthcheck.retries);
				if (isNaN(retries)) {
					throw new pulumi.InputPropertyError({
						propertyPath: "service.healthcheck.retries",
						reason: `must be an integer: ${healthcheck.retries}`,
					});
				}
			} else {
				retries = healthcheck.retries as number;
			}
		}
		const startPeriod = (healthcheck.start_period as string) ?? "5s";
		const interval = (healthcheck.interval as string) ?? "30s";

		// converts to milliseconds
		const startPeriodMs = parseDuration(startPeriod);
		const intervalMs = parseDuration(interval);
		if (startPeriodMs === null) {
			throw new pulumi.InputPropertyError({
				propertyPath: "service.healthcheck.start_period",
				reason: `must be a valid duration: ${healthcheck.start_period}`,
			});
		}
		if (intervalMs === null) {
			throw new pulumi.InputPropertyError({
				propertyPath: "service.healthcheck.interval",
				reason: `must be a valid duration: ${healthcheck.interval}`,
			});
		}
		return (startPeriodMs + retries * intervalMs) / 1000;
	}

	private getMountRelPath(
		m: NonNullable<pulumi.Unwrap<DockerComposeServiceArgs["mounts"]>>[0],
	) {
		return `${MOUNT_FOLDER}/${m.name}`;
	}

	private addNetwork(
		networkObj: NonNullable<v3.Service["networks"]>,
		network: string,
	) {
		if (Array.isArray(networkObj)) {
			networkObj.push(network);
		} else {
			networkObj[network] = {};
		}
	}
}

/**
 * This returns the set of commands that would be used to upload new files to a directory and then clear extra files
 * from the directory.
 *
 * This is important for something that might involve a blue green deployment like:
 *
 * 1. Upload new files to the directory (presuming that they work for both services at the same time)
 * 2. deploy both services and tear down old ones
 * 3. Remove the files that are now extraneous (since the old ones don't need them now)
 *
 */
function createCleanDirUploadResources(
	name: string,
	copyArgs: remote.CopyToRemoteArgs,
	baseOpts?: pulumi.ComponentResourceOptions,
) {
	const { cleanupCommand } = pulumi
		.output(copyArgs)
		.apply(async ({ source, remotePath }) => {
			if (!pulumi.asset.Archive.isInstance(source)) {
				throw new Error(`Expected an archive asset source for ${remotePath}`);
			}

			let dir: string = "";
			let curFiles: string[];
			// For now, we can mimic how we know copytoremote works
			if (isPathAsset(source)) {
				const path = await source.path;
				if (!path.endsWith("/")) {
					dir = basename(path);
				}
				curFiles = await readdir(path, { recursive: true });
			} else {
				throw new Error("Unsupported Asset type.  Must be path based");
			}
			const fullPath = `${remotePath.endsWith("/") ? remotePath.substring(0, remotePath.length - 1) : remotePath}${dir ? `/${dir}` : ""}`;
			return {
				cleanupCommand: shellStrings.onlyFilesInDirCommand(fullPath, curFiles),
			};
		});

	let copyToRemote: remote.CopyToRemote | undefined;
	const makeCopyToRemote = (
		opts?: Pick<pulumi.ComponentResourceOptions, "dependsOn" | "ignoreChanges">,
	) => {
		copyToRemote = new remote.CopyToRemote(name, copyArgs, {
			...baseOpts,
			dependsOn: pulumi
				.output({
					baseOptsIn: baseOpts,
					optsIn: opts,
				})
				.apply(({ baseOptsIn, optsIn }) => {
					return [
						...(baseOptsIn?.dependsOn
							? Array.isArray(baseOptsIn.dependsOn)
								? baseOptsIn.dependsOn
								: [baseOptsIn.dependsOn]
							: []),
						...(optsIn?.dependsOn
							? Array.isArray(optsIn.dependsOn)
								? optsIn.dependsOn
								: [optsIn.dependsOn]
							: []),
					];
				}),
			ignoreChanges: [
				...(baseOpts?.ignoreChanges ?? []),
				...(opts?.ignoreChanges ?? []),
			],
		});
		return copyToRemote;
	};

	const makeCleanUpCommand = (
		opts?: Pick<pulumi.ComponentResourceOptions, "dependsOn" | "ignoreChanges">,
	) => {
		if (!copyToRemote) {
			throw new Error(
				`must call makeCopyToRemote() before makeCleanUpCommand() for ${name}`,
			);
		}
		return new remote.Command(
			`${name}-cleanup`,
			{
				connection: copyArgs.connection,
				create: shellStrings.asSudoOutput(cleanupCommand),
				triggers: copyArgs.triggers,
			},
			{
				...baseOpts,
				dependsOn: pulumi
					.output({
						baseOptsIn: baseOpts,
						optsIn: opts,
					})
					.apply(({ baseOptsIn, optsIn }) => {
						return [
							copyToRemote!,
							...(baseOptsIn?.dependsOn
								? Array.isArray(baseOptsIn.dependsOn)
									? baseOptsIn.dependsOn
									: [baseOptsIn.dependsOn]
								: []),
							...(optsIn?.dependsOn
								? Array.isArray(optsIn.dependsOn)
									? optsIn.dependsOn
									: [optsIn.dependsOn]
								: []),
						];
					}),
				ignoreChanges: [
					...(baseOpts?.ignoreChanges ?? []),
					...(opts?.ignoreChanges ?? []),
				],
			},
		);
	};

	const makeAllAtOnce = (
		opts?: Pick<pulumi.ComponentResourceOptions, "dependsOn" | "ignoreChanges">,
	) => {
		return {
			copy: makeCopyToRemote(opts),
			cleanUp: makeCopyToRemote(opts),
		};
	};

	return {
		cleanupCommand,
		// Can optionally be skipped if you want to combine multiple cleanups via the cleanupCommand strings
		makeCleanUpCommand,
		makeCopyToRemote,
		/**
		 * @deprecated - we should remove this in favor of CopyToRemote if it gets a "cleanup" property since that is more atomic
		 */
		makeAllAtOnce,
	};
}
