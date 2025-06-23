import { shellStrings } from "@hanseltime/pulumi-linux-base";
import * as command from "@pulumi/command";
import * as pulumi from "@pulumi/pulumi";
import { LIBRARY_PREFIX } from "./constants";
import {
	createBaseCommand,
	createCreateCommand,
	createFullDeleteCommand,
} from "./iptablesUtils";
import type { ChangeSignature } from "./pulumitypes";

/**
 * If you need to create table chains early, you can declare the creation as separate from the chain + rules
 *
 * Note - to ensure that we don't have chain name differences between iptables and iptables, we create them in both
 *
 * The IpTablesChain respects if the chain already exists, so you can create this first for multiple chains that
 * cross-target each other if neccessary
 */
export class IpTablesChainCreate
	extends pulumi.ComponentResource
	implements ChangeSignature
{
	chainName: pulumi.Output<string>;
	changeSignature: pulumi.Output<string>;

	/**
	 *
	 * @param name
	 * @param table
	 * @param rules - evaluated from first to last
	 */
	constructor(
		name: string,
		args: {
			table: pulumi.Input<string>;
			/**
			 * The name of the chain to create
			 */
			name: pulumi.Input<string>;
			connection: pulumi.Input<command.types.input.remote.ConnectionArgs>;
		},
		opts?: pulumi.ComponentResourceOptions,
	) {
		super(`${LIBRARY_PREFIX}:IpTablesChainCreate`, name, args, opts);

		const { createCommand, deleteCommand, chainName } = pulumi
			.output(args)
			.apply(({ name: nameIn, table }) => {
				const ipv4Base = `${createBaseCommand("inet", table)}`;
				const ipv6Base = `${createBaseCommand("inet6", table)}`;
				return {
					createCommand: `${createCreateCommand(ipv4Base, nameIn)};${createCreateCommand(ipv6Base, nameIn)}`,
					deleteCommand: `${createFullDeleteCommand(ipv4Base, nameIn)};${createFullDeleteCommand(ipv6Base, nameIn)}`,
					chainName: nameIn,
				};
			});

		// Create all chains first
		new command.remote.Command(
			`${name}-create-chains`,
			{
				connection: args.connection,
				create: shellStrings.asSudoOutput(createCommand),
				delete: shellStrings.asSudoOutput(deleteCommand),
				// Do not add triggers other than the chain name here since a replace would wipe all chains
				triggers: [args.name, args.table],
			},
			{
				parent: this,
			},
		);

		this.chainName = chainName;
		this.changeSignature = this.chainName;
		this.registerOutputs({
			chainName,
			changeSignature: this.chainName,
		});
	}
}
