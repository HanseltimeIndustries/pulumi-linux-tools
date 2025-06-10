import * as pulumi from "@pulumi/pulumi";
import * as command from "@pulumi/command";
import { IpSetResource } from "./IpSetResource";
import { IpTablesChain } from "./IpTablesChain";
import { IpTablesChainCreate } from "./IpTablesChainCreate";
import { LIBRARY_PREFIX } from "./constants";
import { shellStrings } from "@hanseltime/pulumi-linux-base";

export interface IpTablesSaveArgs {
	connection: pulumi.Input<command.types.input.remote.ConnectionArgs>;

	ipTablesResources: pulumi.Input<
		pulumi.Input<IpSetResource | IpTablesChain | IpTablesChainCreate>[]
	>;
}

/**
 * Important! If you want your IpTables and Ipset configurations to persist on reboot of a machine
 * (which you probably do once you've verified them), you need to make sure that you IpTablesSave
 * to make sure that we call
 *
 * `netfilter-persistent save`, which will make backups of all your ipsets and iptables (assuming
 * that you have previously installed all the packages as part of Iptables Install)
 */
export class IpTablesSave extends pulumi.ComponentResource {
	constructor(
		name: string,
		args: IpTablesSaveArgs,
		opts?: pulumi.ComponentResourceOptions,
	) {
		const dependsOn = pulumi.output({
			ipTablesResources: args.ipTablesResources,
			deps: opts?.dependsOn,
		}).apply(({
			ipTablesResources,
			deps,
		}) => {
			const ret: pulumi.Resource[] = [];
			if (Array.isArray(deps)) {
				ret.push(...deps)
			} else if (deps) {
				ret.push(deps as pulumi.Resource)
			}
			ret.push(...ipTablesResources)
			return ret;
		})
		super(`${LIBRARY_PREFIX}:IpTablesSave`, name, args, {
			...opts,
			dependsOn,
		});

		new command.remote.Command(
			`${name}-saveipconfig`,
			{
				connection: args.connection,
				create: shellStrings.asSudoOutput(
					`netfilter-persistent save`,
				),
				triggers: [
					pulumi
						.output(args.ipTablesResources)
						.apply((ipTablesResources) =>
							ipTablesResources.map((res) => res.changeSignature),
						),
				],
			},
			{
				parent: this,
				dependsOn,
			},
		);
	}
}
