import * as pulumi from "@pulumi/pulumi";
import * as command from "@pulumi/command";
import { IpSet } from "./Ipset";
import { CreateInterfaces, EntryAddInterfaces } from "./types";
import { LIBRARY_PREFIX } from "./constants";
import { shellStrings } from "@hanseltime/pulumi-linux-base";

export interface IpSetResourceArgs {
	connection: pulumi.Input<command.types.input.remote.ConnectionArgs>;
	/**
	 * This is the ipset that you are maintaining.  The resource will take care of running swaps, etc
	 */
	ipSet: IpSet<CreateInterfaces, EntryAddInterfaces>;
}

/**
 * This represents an IP set in the ipset tool with entries added to it
 *
 * See: https://ipset.netfilter.org/ipset.man.html
 */
export class IpSetResource extends pulumi.ComponentResource {
	static SWAP_SET_POSTFIX = "-NEW";

	changeSignature: pulumi.Output<string>;

	constructor(
		name: string,
		args: IpSetResourceArgs,
		opts?: pulumi.ComponentResourceOptions,
	) {
		super(`${LIBRARY_PREFIX}:IpSetResource`, name, args, opts);

		// Generate the first and swap parts
		const firstCreate = args.ipSet.createCommand();
		const firstAdds = args.ipSet.addCommands();
		const secondCreate = args.ipSet.createCommand(
			IpSetResource.SWAP_SET_POSTFIX,
		);
		const secondAdds = args.ipSet.addCommands(IpSetResource.SWAP_SET_POSTFIX);
		const swapCommand = `ipset swap ${args.ipSet.name}${IpSetResource.SWAP_SET_POSTFIX} ${args.ipSet.name}`;
		const cleanCommand = `ipset destroy ${args.ipSet.name}${IpSetResource.SWAP_SET_POSTFIX}`;

		const createOrUpdate = `if [ "$(ipset -L AllowedIPS 2> /dev/null || echo 'notset')" == "notset" ]; then ${firstCreate} ${firstAdds.length > 0 ? `&& ${firstAdds.join(" && ")}` : ""}; else ${secondCreate} ${secondAdds.length > 0 ? `&& ${secondAdds.join(" && ")}` : ""} && ${swapCommand} && ${cleanCommand}; fi`;

		new command.remote.Command(
			`${name}-install`,
			{
				connection: args.connection,
				create: shellStrings.asSudoOutput(createOrUpdate),
				update: shellStrings.asSudoOutput(createOrUpdate),
				// On real deletes we remove the actual set
				delete: shellStrings.asSudoOutput(`ipset destroy ${args.ipSet.name}`),
				// Do not use triggers since that will delete the set which might be in use
			},
			{
				parent: this,
			},
		);

		this.changeSignature = pulumi.output(args.ipSet.changeSignature());

		this.registerOutputs({
			changeSignature: this.changeSignature,
		});
	}
}
