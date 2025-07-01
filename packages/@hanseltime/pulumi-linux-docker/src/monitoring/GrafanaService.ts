import type { v3 } from "@hanseltime/compose-types";
import * as pulumi from "@pulumi/pulumi";
import * as grafana from "@pulumiverse/grafana";
import { isIP } from "net";
import type {
	DockerComposeServiceArgs,
	ServiceInputified,
} from "../DockerComposeService";
import { DockerComposeService } from "../DockerComposeService";
import { DockerDeployType } from "../types";
import { overrideLabelsOrEnv } from "../utils";
import { GrafanaAdminUserPassword } from "./GrafanaAdminUserPassword";

export interface GrafanaConfigValue {
	/**
	 * The actual value
	 */
	value: pulumi.Input<string>;
	/**
	 * If this should be a secret when being loaded into the container.
	 *
	 * Things like passwords, keys, etc. should be true.
	 */
	secret?: true;
}

export interface GrafanaServiceTLSConfig {
	/**
	 * This is the certificate private key that you have.  Make sure it's a secret.
	 */
	certKey: pulumi.Input<string>;
	/**
	 * This is the matching certificate chain that you have to match the private key
	 */
	certCrt: pulumi.Input<string>;
	/**
	 * The host url that corresponds to where your grafana will be accessible and the TLS that
	 * you are using for the domain.
	 */
	rootUrl: pulumi.Input<string>;
	/**
	 * Defaults to https
	 */
	protocol?: pulumi.Input<"https" | "h2">;
	/**
	 * Defaults to tls1.2
	 */
	minTlsVersion?: pulumi.Input<"TLS1.2" | "TLS1.3">;
}

export interface GrafanaServiceArgs
	extends Omit<
		DockerComposeServiceArgs,
		"service" | "deployType" | "blueGreen"
	> {
	/**
	 * If you are making configuration changes that require a reload or processing of the configuration
	 * file (like a TLS certificate update, which we already do, but this is just an example).  You can
	 * always change the number for the reload config to trigger us sending an HUP signal to the server
	 * which will cause a configuration reload.
	 */
	reloadConfig?: number;
	/**
	 * If you are using a @pulumiverse/grafana, you almost always NEED tls.  That's because
	 * the grafana provider will be send authentication requests to the server with sensitive
	 * credentials.  If you do this over HTTP, any man in the middle will be able to get those
	 * credentials and then access your grafana.
	 *
	 * If you don't want TLS and are fine with it, you can set as 'NO_PUBLIC_CONNECTION' to
	 * not have to use it.  This would make sense if you were connecting via a local VPN
	 * and accessing grafana over that VPN (which is doing encryption via the vpn tunnel).
	 *
	 * Additionally, by default we let the TLS certificate transition by grafana watching the keey in 5 minute
	 * intervals.  This avoids a restart of the service.  However, if yo
	 */
	tls: pulumi.Input<GrafanaServiceTLSConfig> | "NO_PUBLIC_CONNECTION";
	/**
	 * The port that we will expose the grafana UI on and the interfaces attached.
	 */
	expose: pulumi.Input<{
		port: pulumi.Input<number>;
		/**
		 * These could be the ips of the interface's on the machine or an "all interface" ip
		 * like 0.0.0.0 or [::] for ipv6
		 *
		 * // loopback interface and the docker interface
		 * interfacesIps: ['127.0.0.1', dockerInstall.defaultDockerGatewayIP]
		 */
		interfaceIps: pulumi.Input<pulumi.Input<string>[]>;
	}>;
	/**
	 * Admin user settings
	 *
	 * The initial password is what is used to bring up the admin instance.  If you ever need to change the admin password,
	 * do not change the initial.  Simply add the currentPassword.
	 */
	admin: {
		/**
		 * The password for a brand new grafana.  To change it, keep this field but add the currentPassword
		 */
		initialPassword: pulumi.Input<string>;
		currentPassword?: pulumi.Input<string>;
	};
	/**
	 * The service will do its best to set up a connection for a grafana.Provider by using the
	 * tls.rootUrl or (in the event of no tls, the machine connection).  If the machine connection is
	 * a public IP and you don't have TLS, you will want to not have this provider configured.  Instead
	 * you can override this with something like a VPN address (expecting that you'll be on the vpn while
	 * running this, etc.)
	 */
	providerConnection?: pulumi.Input<{
		host?: pulumi.Input<string>;
		protocol?: pulumi.Input<"http" | "https">;
		/**
		 * The port to connect on
		 *
		 * defaults to the expose.port
		 */
		port?: pulumi.Input<number>;
		/**
		 * The Certificate CA bundle (file path or literal value) to use to verify the Grafana servers' certificate
		 */
		caCert?: grafana.ProviderArgs["caCert"];
		/**
		 * Optional. HTTP headers mapping keys to values used for accessing the Grafana APIs.
		 */
		httpHeaders?: grafana.ProviderArgs["httpHeaders"];
		insecureSkipVerify?: grafana.ProviderArgs["insecureSkipVerify"];
		/**
		 * The amount of retries to use for Grafana API
		 *
		 * Default: 3
		 */
		retries?: grafana.ProviderArgs["retries"];
		/**
		 * The status codes to retry on for Grafana API and Grafana Cloud API calls. Use `x` as a digit wildcard. Defaults to 429
		 * and 5xx.
		 */
		retryStatusCodes?: grafana.ProviderArgs["retryStatusCodes"];
		/**
		 * The amount of time in seconds to wait between retries for Grafana API
		 *
		 * Defaults to 5 seconds
		 */
		retryWait?: grafana.ProviderArgs["retryWait"];
		storeDashboardSha256?: grafana.ProviderArgs["storeDashboardSha256"];
	}>;
	/**
	 * This will only override .ini just like with environment variables.
	 *
	 * Note, the values can be marked as secret, which is critical to not leaking those values when
	 * we set up the compose service.  If they are marked as secret, we will mount them as secrets and
	 * then refer to the via the __FILE environment variable for you.
	 *
	 * This is the json representation of a grafana configuration file.  Any top-level key: object is
	 * written out as is.
	 *
	 * [key]
	 * object.key1 = object.value1
	 */
	configOverride?: pulumi.Input<{
		[sectionOrNonSectionedKey: string]: pulumi.Input<
			| {
					[k: string]: pulumi.Input<GrafanaConfigValue>;
			  }
			| GrafanaConfigValue
		>;
	}>;
	/**
	 * The normal docker compose service with a few arguments removed since we know what they are automatically
	 */
	service?: Omit<
		DockerComposeServiceArgs["service"],
		"ports" | "healthcheck" | "user"
	>;
}

const TLS_SCAN_INTERVAL = 10;

/**
 * Simplified interface for setting up a Grafana DockerComposeService.
 *
 * This service is a replace type service (since we don't see it as zero-downtime), and
 * it creates some patterns for enforcing thinking about secrets for grafana configuration,
 * as well as exposing Grafana Provider that can be used with other @pulumiverse/grafana
 * resources to do stuff like setting up additional users, teams, and even managing dashboards.
 */
export class GrafanaService extends DockerComposeService {
	private grafanaProvider: grafana.Provider | undefined;
	private adminName: pulumi.Output<string>;
	private adminPassword: pulumi.Output<string>;
	private providerConnection:
		| GrafanaServiceArgs["providerConnection"]
		| undefined;
	private tls: GrafanaServiceArgs["tls"];
	private host: pulumi.Output<string>;
	private name: string;
	public port: pulumi.Output<string>;

	constructor(
		name: string,
		args: GrafanaServiceArgs,
		opts?: pulumi.ComponentResourceOptions,
	) {
		const {
			configOverride,
			expose,
			service,
			secrets,
			admin,
			mounts,
			tls,
			providerConnection,
			...commonArgs
		} = args;

		// construct the service with our modifications
		const { modifiedService, modifiedSecrets, mountsModified, adminName } =
			pulumi
				.output({
					configOverrideIn: configOverride,
					exposeIn: expose,
					serviceIn: service,
					adminInitialPasswordIn: admin.initialPassword,
					secretsIn: secrets,
					tlsIn: tls,
					mountsIn: mounts,
				})
				.apply(
					({
						configOverrideIn,
						exposeIn,
						serviceIn,
						adminInitialPasswordIn,
						secretsIn,
						tlsIn,
						mountsIn,
					}) => {
						const castService = serviceIn as v3.Service | undefined;

						// Make sure they're ips
						exposeIn.interfaceIps.forEach((i) => {
							if (isIP(i) === 0) {
								throw new Error(`${i} is not an ip address interface`);
							}
						});

						// For tls, mount the keys and set minimum tls
						const modifiedMountsRet = [...(mountsIn ?? [])];
						const serverConfig: {
							root_url?: GrafanaConfigValue;
							protocol?: GrafanaConfigValue;
							min_tls_version?: GrafanaConfigValue;
							cert_file?: GrafanaConfigValue;
							cert_key?: GrafanaConfigValue;
							certs_watch_interval?: GrafanaConfigValue;
						} = {};
						if (tlsIn !== "NO_PUBLIC_CONNECTION") {
							const keyLocation = "/etc/grafana/grafana.key";
							const crtLocation = "/etc/grafana/grafana.crt";
							// Construct the mounts for the keys
							modifiedMountsRet.push({
								onContainer: keyLocation,
								name: "grafana.key",
								resource: new pulumi.asset.StringAsset(tlsIn.certKey),
							});
							modifiedMountsRet.push({
								onContainer: crtLocation,
								name: "grafana.crt",
								resource: new pulumi.asset.StringAsset(tlsIn.certCrt),
							});

							// Update the server configuration
							serverConfig.root_url = {
								value: tlsIn.rootUrl.startsWith("https://")
									? tlsIn.rootUrl
									: `https://${tlsIn.rootUrl}`,
							};
							serverConfig.protocol = {
								value: tlsIn.protocol ?? "https",
							};
							serverConfig.cert_file = {
								value: crtLocation,
							};
							serverConfig.cert_key = {
								value: keyLocation,
							};
							// We set a default to refresh every 10 seconds so that we know how to wait
							serverConfig.certs_watch_interval = {
								value: `${TLS_SCAN_INTERVAL}s`,
							};
							if (tlsIn.minTlsVersion) {
								serverConfig.min_tls_version = {
									value: tlsIn.minTlsVersion,
								};
							}
						}

						const { env, secrets: secretsRet } =
							this.createConfigOverrideEnvKeys({
								...configOverrideIn,
								// Add the admin password for override
								security: {
									...configOverrideIn?.security,
									admin_password: {
										value: adminInitialPasswordIn,
										secret: true,
									},
								},
								server: {
									...configOverrideIn?.server,
									...(serverConfig as {}),
								},
							});

						return {
							modifiedService: {
								...castService,
								ports: exposeIn.interfaceIps.map(
									(i) => `${i}:${exposeIn.port}:3000`,
								),
								healthcheck: {
									test: "curl http://localhost:3000/api/health",
								},
								image: castService?.image ?? "grafana/grafana:latest",
								environment: overrideLabelsOrEnv(
									env,
									castService?.environment ?? {},
								),
								// This is the result of running id in the docker container.  A strange user setting
								user: {
									userId: 472,
									groupId: 0,
								},
								volumes: [
									"grafana_data:/var/lib/grafana",
									...(castService?.volumes ?? []),
								],
							} as ServiceInputified,
							modifiedSecrets: [...secretsRet, ...(secretsIn ?? [])],
							adminName:
								(configOverrideIn?.security?.value as string) ?? "admin",
							mountsModified: modifiedMountsRet,
						};
					},
				);

		super(
			name,
			{
				...commonArgs,
				deployType: DockerDeployType.Replace,
				service: modifiedService,
				secrets: modifiedSecrets,
				mounts: mountsModified,
			},
			opts,
		);

		this.providerConnection = providerConnection;
		this.tls = tls;

		this.host = pulumi
			.output({
				tlsIn: tls,
				connectionIn: args.connection,
				providerConnectionIn: providerConnection,
				exposeIn: expose,
			})
			.apply(({ tlsIn, connectionIn, providerConnectionIn, exposeIn }) => {
				if (providerConnectionIn?.protocol && providerConnectionIn?.host) {
					return `${providerConnectionIn.protocol}://${providerConnectionIn.host}:${providerConnectionIn.port ?? exposeIn.port}`;
				}
				if (tlsIn !== "NO_PUBLIC_CONNECTION") {
					return `https://${tlsIn.rootUrl}:${exposeIn.port}`;
				}
				return `http://${connectionIn.host}:${exposeIn.port}`;
			});

		const adminPassword = new GrafanaAdminUserPassword(
			`${name}-password-change`,
			{
				url: this.host,
				tlsDelay: TLS_SCAN_INTERVAL,
				name: adminName,
				initialPassword: pulumi
					.secret(admin)
					.apply(({ initialPassword }) => initialPassword),
				password: pulumi
					.secret(admin)
					.apply(
						({ initialPassword, currentPassword }) =>
							currentPassword ?? initialPassword,
					),
				insecureSkipVerify: providerConnection
					? pulumi
							.output(providerConnection)
							.apply(({ insecureSkipVerify }) => !!insecureSkipVerify)
					: undefined,
				tlsCaCert:
					tls === "NO_PUBLIC_CONNECTION"
						? undefined
						: pulumi
								.output({
									providerConnectionIn: providerConnection,
								})
								.apply(
									({ providerConnectionIn }) => providerConnectionIn?.caCert,
								),
			},
			{
				dependsOn: [this],
			},
		);

		this.name = name;
		this.adminName = adminName;
		this.adminPassword = (adminPassword as any).password;

		this.port = pulumi.output(expose).apply(({ port }) => `${port}`);
	}

	/**
	 * This will retrieve a configured grafana provider if selected
	 */
	public getGrafanaProvider() {
		if (!this.grafanaProvider) {
			const providerTlsConfig: grafana.ProviderArgs = {};
			if (this.tls !== "NO_PUBLIC_CONNECTION") {
				providerTlsConfig.caCert = pulumi
					.output(this.providerConnection)
					.apply(async (providerConnectionIn) => {
						// Apply a sleep for the amount of time that it would take for the tls to rotate
						await new Promise((res) => {
							setTimeout(res, TLS_SCAN_INTERVAL * 1000);
						});
						return providerConnectionIn?.caCert as any;
					});
			}
			if (this.providerConnection) {
				providerTlsConfig.insecureSkipVerify = pulumi
					.output(this.providerConnection)
					.apply(({ insecureSkipVerify }) => !!insecureSkipVerify);
				providerTlsConfig.httpHeaders = pulumi
					.output(this.providerConnection)
					.apply(({ httpHeaders }) => httpHeaders ?? {});
				providerTlsConfig.retries = pulumi
					.output(this.providerConnection)
					.apply(({ retries }) => retries ?? 3);
				providerTlsConfig.retryWait = pulumi
					.output(this.providerConnection)
					.apply(({ retryWait }) => retryWait ?? 5);
				(providerTlsConfig.retryStatusCodes = pulumi
					.output(this.providerConnection)
					.apply(({ retryStatusCodes }) => retryStatusCodes ?? ["429", "5xx"])),
					(providerTlsConfig.storeDashboardSha256 = pulumi
						.output(this.providerConnection)
						.apply(({ storeDashboardSha256 }) => !!storeDashboardSha256));
			}
			this.grafanaProvider = new grafana.Provider(
				`${this.name}-grafana-provider`,
				{
					auth: pulumi
						.secret({
							adminInitialPasswordIn: this.adminPassword,
							adminNameIn: this.adminName,
						})
						.apply(
							({ adminInitialPasswordIn, adminNameIn }) =>
								`${adminNameIn}:${adminInitialPasswordIn}`,
						),
					url: this.host,
					...providerTlsConfig,
				},
				{
					dependsOn: [this],
				},
			);
		}

		return this.grafanaProvider;
	}

	/**
	 * Takes a config override and constructs the set of environment variables that would be needed for grafana to
	 * reference them
	 *
	 * Additionally, it will return a secrets object that is compatible with the DockerComposeService secrets property
	 * that will store any values marked as secrets as docker secret files and then reference those via the environment
	 * value.
	 * @param configOverride
	 * @param envKeyPrefix
	 * @returns
	 */
	private createConfigOverrideEnvKeys(
		configOverride: {
			[sectionOrNonSectionedKey: string]:
				| {
						[k: string]: pulumi.Unwrap<GrafanaConfigValue>;
				  }
				| pulumi.Unwrap<GrafanaConfigValue>;
		},
		envKeyPrefix = "GF_",
	) {
		return Object.keys(configOverride).reduce(
			(envMap, topK) => {
				const value = configOverride[topK];
				const castValue = value as pulumi.Unwrap<GrafanaConfigValue>;
				if (castValue.value) {
					if (castValue.secret) {
						const secret = `${envKeyPrefix}${topK}_auto`;
						const eKey = `${envKeyPrefix}${topK}__FILE`.toUpperCase();
						envMap.env[eKey] = `/run/secrets/${secret}`;
						envMap.secrets.push({
							name: secret,
							value: castValue.value,
						});
					} else {
						const eKey = `${envKeyPrefix}${topK}`.toUpperCase();
						envMap.env[eKey] = castValue.value;
					}
				} else {
					const castSectionValue = value as {
						[k: string]: pulumi.Unwrap<GrafanaConfigValue>;
					};
					// We're nested and need to go deeper
					const sectionEnvMap = this.createConfigOverrideEnvKeys(
						castSectionValue,
						`${envKeyPrefix}${topK}_`,
					);
					envMap = {
						env: {
							...envMap.env,
							...sectionEnvMap.env,
						},
						secrets: [...envMap.secrets, ...sectionEnvMap.secrets],
					};
				}
				return envMap;
			},
			{
				env: {},
				secrets: [],
			} as {
				env: {
					[e: string]: string;
				};
				secrets: {
					name: string;
					value: string;
				}[];
			},
		);
	}
}
