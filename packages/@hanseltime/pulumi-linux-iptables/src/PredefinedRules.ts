import type { IpV4TablesRule, IpV6TablesRule } from "./types";

/**
 * Simple Helper class with static methods to generate rules that are common
 */
export class PredefinedRules {
	/**
	 * This creates a ruleset that would match IpTablesChain ordering (i.e. first rule is evaluated first)
	 * that will only allow egress connectionns on the network interface specified and will allow certain
	 * ports to connect externally (important for SSH)
	 * @param options
	 * @returns
	 */
	static onlyEgress(options: {
		/**
		 * The interface to apply these rejections to
		 */
		interface: string;
		/**
		 * A list of ports that are still allowed to connect from the outside
		 *
		 * For instance, the :22 for SSH
		 */
		exceptionPorts: number[];
	}) {
		const rejectAllOthersOnInterface: IpV4TablesRule | IpV6TablesRule = {
			inInterface: options.interface,
			jump: "DROP",
		};
		const allowEstablishedConnections: IpV4TablesRule | IpV6TablesRule = {
			inInterface: options.interface,
			jump: "ACCEPT",
			matchingModule: {
				conntrack: "--ctstate ESTABLISHED,RELATED",
			},
		};
		const allowIncomingPortExceptions: (IpV4TablesRule | IpV6TablesRule)[] =
			options.exceptionPorts.map((p) => ({
				inInterface: options.interface,
				destinationPorts: p,
				jump: "ACCEPT",
			}));

		return [
			allowIncomingPortExceptions,
			allowEstablishedConnections,
			rejectAllOthersOnInterface,
		];
	}
}
