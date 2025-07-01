import { Agent } from "node:https";
import * as pulumi from "@pulumi/pulumi";
import { fetchWithTimeout } from "./fetchWithTimeout";

export interface GrafanaAdminUserInputs {
	/**
	 * The name of the admin user as specified when configuring the
	 * initial grafana.
	 *
	 * defaults to admin
	 */
	name?: string;
	/**
	 * If this is happening right after you set up an instance, you have to provide the initial
	 * password
	 */
	initialPassword: string;
	/**
	 * The current password we want to set
	 */
	password: string;

	url: string;
	/**
	 * Since we don't have a way to automatically reload TLS (we have to watch it),
	 * you will need to add a TLS delay if using Grafana tls since it will take X seconds
	 * to update the TLS certificate that we use
	 *
	 * Unit: seconds
	 */
	tlsDelay: number;
	/**
	 * If doing a tls url, you will can add the certificate provider chain for
	 * self-signed certificates.
	 */
	tlsCaCert?: string;
	/**
	 * This will skip verifying the tls certificate.
	 */
	insecureSkipVerify?: boolean;
}

export interface GrafanaAdminUserOutputs {
	name: string;
	password: string;
}

export class GrafanaAdminUserProvider
	implements
		pulumi.dynamic.ResourceProvider<
			GrafanaAdminUserInputs,
			GrafanaAdminUserOutputs
		>
{
	name: string;
	constructor(name: string) {
		this.name = name;
	}

	async check(
		olds: GrafanaAdminUserInputs,
		news: GrafanaAdminUserInputs,
	): Promise<pulumi.dynamic.CheckResult<GrafanaAdminUserInputs>> {
		// Apparently olds is an empty object on create
		const failures: { property: string; reason: string }[] = [];
		if (
			olds.name !== undefined &&
			olds.name !== news.name &&
			olds.name !== "admin"
		) {
			failures.push({
				property: "name",
				reason: `admin name cannot be changed (${olds.name} -> ${news.name ?? "admin"}) and is only set on initial load of a grafana instance`,
			});
		}

		if (news.tlsDelay < 0) {
			failures.push({
				property: "tlsDelay",
				reason: "tlsDelay must be >=0",
			});
		}

		if (failures.length > 0) {
			return {
				failures,
			};
		}

		return {
			inputs: news,
		};
	}
	async diff(
		id: pulumi.ID,
		olds: any,
		news: GrafanaAdminUserInputs,
	): Promise<pulumi.dynamic.DiffResult> {
		return {
			changes: olds.password !== news.password,
			stables: [olds.name, olds.initialPassword],
		};
	}
	async create(
		inputs: GrafanaAdminUserInputs,
	): Promise<pulumi.dynamic.CreateResult<any>> {
		await new Promise((res) => {
			setTimeout(res, inputs.tlsDelay * 1000);
		});
		const baseUrl = inputs.url;
		const name = inputs.name ?? "admin";
		const password = inputs.password;
		const url = `${baseUrl}/api/user/password`;
		const basicAuth = Buffer.from(`${name}:${inputs.initialPassword}`).toString(
			"base64",
		);

		const tlsOptions: { agent?: Agent } = {};
		if (inputs.tlsCaCert || inputs.insecureSkipVerify) {
			tlsOptions.agent = new Agent({
				ca: inputs.tlsCaCert,
				rejectUnauthorized: !!inputs.insecureSkipVerify,
			});
		}

		const options = {
			...tlsOptions,
			method: "PUT",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Basic ${basicAuth}`,
			},
			body: JSON.stringify({
				oldPassword: inputs.initialPassword,
				newPassword: password,
			}),
			signal: AbortSignal.timeout(3000),
		};

		const response = await fetchWithTimeout(url, options, 3000);
		if (response.ok) {
			// This is first made after initial setup (which is part of a different resource)
			return {
				id: name,
				outs: {
					name,
					password,
				},
			};
		} else {
			throw new Error(
				`Could not connect to Grafana (${baseUrl}): ${JSON.stringify(await response.json())}`,
			);
		}
	}
	async read(
		id: pulumi.ID,
		props?: GrafanaAdminUserOutputs,
	): Promise<pulumi.dynamic.ReadResult<GrafanaAdminUserOutputs>> {
		return {
			id,
			props,
		};
	}
	async update(
		id: pulumi.ID,
		olds: GrafanaAdminUserOutputs,
		news: GrafanaAdminUserInputs,
	): Promise<pulumi.dynamic.UpdateResult<GrafanaAdminUserOutputs>> {
		await new Promise((res) => {
			setTimeout(res, news.tlsDelay * 1000);
		});
		const baseUrl = news.url;
		const url = `${baseUrl}/api/user/password`;
		const basicAuth = Buffer.from(`${olds.name}:${olds.password}`).toString(
			"base64",
		);
		const agent = new Agent({
			ca: news.tlsCaCert,
			rejectUnauthorized: news.insecureSkipVerify,
		});
		const options = {
			agent,
			method: "PUT",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Basic ${basicAuth}`,
			},
			body: JSON.stringify({
				oldPassword: olds.password,
				newPassword: news.password,
			}),
			signal: AbortSignal.timeout(3000),
		};

		const response = await fetchWithTimeout(url, options, 3000);

		if (response.ok) {
			return {
				outs: {
					name: olds.name,
					password: news.password,
				},
			};
		} else {
			throw new Error(
				`Could not connect to Grafana (${baseUrl}): ${JSON.stringify(await response.json())}`,
			);
		}
	}
	async delete(id: pulumi.ID, props: GrafanaAdminUserOutputs): Promise<void> {
		// TODO: for now we don't delete the admin user since we're only using it in a local construct
	}
}

export interface GrafanaAdminUserPasswordArgs {
	/**
	 * The host url of grafana to access
	 */
	url: pulumi.Input<string>;
	/**
	 * Since we don't have a way to automatically reload TLS (we have to watch it),
	 * you will need to add a TLS delay if using Grafana tls since it will take X seconds
	 * to update the TLS certificate that we use
	 *
	 * Unit: seconds
	 */
	tlsDelay: pulumi.Input<number>;
	/**
	 * The user name of the admin user
	 */
	name?: pulumi.Input<string>;
	/**
	 * If doing a tls url, you will can add the certificate provider chain for
	 * self-signed certificates.
	 */
	tlsCaCert?: pulumi.Input<string | undefined>;
	/**
	 * This will skip verifying the tls certificate.
	 */
	insecureSkipVerify?: pulumi.Input<boolean>;
	password: pulumi.Input<string>;
	initialPassword: pulumi.Input<string>;
}

/**
 * Simple class that updates the grafana use password, using the grafana user password
 */
export class GrafanaAdminUserPassword extends pulumi.dynamic.Resource {
	public declare readonly name: pulumi.Output<string>;
	public declare readonly password: pulumi.Output<string>;
	constructor(
		name: string,
		args: GrafanaAdminUserPasswordArgs,
		opts?: pulumi.CustomResourceOptions,
	) {
		super(
			new GrafanaAdminUserProvider(`${name}-admin-provider`),
			name,
			{
				...args,
				initialPassword: pulumi.secret(args.initialPassword),
				password: pulumi.secret(args.password),
			},
			opts,
		);
	}
}
