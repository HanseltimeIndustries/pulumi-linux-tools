import * as pulumi from "@pulumi/pulumi";
import * as command from "@pulumi/command";
import { ChangeSignature, PropsInputify } from "./pulumitypes";
import { IpTablesChainArgs } from "./types";
import { createChainCommands } from "./iptablesUtils";
import { LIBRARY_PREFIX } from "./constants";
import { shellStrings } from "@hanseltime/pulumi-linux-base";

/**
 * This represents an entire iptables chain (in ipv6 and ipv4 to avoid chain name collisions long term), since tracking and replacing that chain requires us to know everything that's there so we can remove other pieces
 * we have to store things at the chain level.
 *
 * This does mean that all your iptables rules have to be in the same project and applied via this one resource for a chain.  It is up to you to order chains
 * in such a way that targets for rules are applied after
 *
 * If you have multiple chains that are cross-targeting each other, you can use IpTablesChains so that we ensure all chains are created before referencing
 */
export class IpTablesChain
	extends pulumi.ComponentResource
	implements ChangeSignature
{
	chainName: pulumi.Output<string>;
	replaceRulesCommandIpv4: pulumi.Output<string>;
	replaceRulesCommandIpv6: pulumi.Output<string>;
	changeSignature: pulumi.Output<string>;

	/**
	 *
	 * @param name
	 * @param table
	 * @param rules - evaluated from first to last
	 */
	constructor(
		name: string,
		args: PropsInputify<IpTablesChainArgs> & {
			connection: pulumi.Input<command.types.input.remote.ConnectionArgs>;
		},
		opts?: pulumi.ComponentResourceOptions,
	) {
		super(`${LIBRARY_PREFIX}:IpTablesChain`, name, args, opts);

		const { ipv4, ipv6, chainName } = pulumi.output(args).apply((chainArgs) => {
			return createChainCommands(
				chainArgs as IpTablesChainArgs & { noSudo?: boolean },
			);
		});

		// For a single chain, we create and build in the same command - 1 for each ip family
		new command.remote.Command(
			`${name}-ipv4`,
			{
				connection: args.connection,
				create: shellStrings.asSudoOutput(
					pulumi
						.output(ipv4)
						.apply(({ createCommand, replaceRulesCommand }) => {
							return `${createCommand}; ${replaceRulesCommand};`;
						}),
				),
				delete: shellStrings.asSudoOutput(ipv4.deleteCommand),
				triggers: [args.name, args.table],
			},
			{
				parent: this,
			},
		);

		new command.remote.Command(
			`${name}-ipv6`,
			{
				connection: args.connection,
				create: shellStrings.asSudoOutput(
					pulumi
						.output(ipv6)
						.apply(({ createCommand, replaceRulesCommand }) => {
							return `${createCommand} && ${replaceRulesCommand}`;
						}),
				),
				delete: shellStrings.asSudoOutput(ipv6.deleteCommand),
				triggers: [args.name, args.table],
			},
			{
				parent: this,
			},
		);

		this.chainName = chainName;
		this.replaceRulesCommandIpv4 = ipv4.replaceRulesCommand;
		this.replaceRulesCommandIpv6 = ipv6.replaceRulesCommand;
		this.changeSignature = pulumi
			.all([this.replaceRulesCommandIpv4, this.replaceRulesCommandIpv6])
			.apply(([v1, v2]) => v1 + ";" + v2);
		this.registerOutputs({
			chainName,
			replaceRulesCommandIpv4: this.replaceRulesCommandIpv4,
			replaceRulesCommandIpv6: this.replaceRulesCommandIpv6,
			changeSignature: this.changeSignature,
		});
	}
}
