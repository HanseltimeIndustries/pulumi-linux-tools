import { createPortArgValue } from "./iptablesUtils";
import { IpV4TablesRule, IpV6TablesRule } from "./types";

/**
 * Helper class with static methods for tweaking IpTables Objects
 */
export class IpTablesHelper {
	/**
	 * This is a helper method for you to take a normal --dport --sport rule and convert it
	 * to use conntrack's --ctorigsrcport/--ctorigdstport
	 *
	 * This exists since DOCKER-USER is post DNAT and therefore has its dports changed.
	 * So you need to switch to conntrack per: https://docs.docker.com/engine/network/packet-filtering-firewalls/#match-the-original-ip-and-ports-for-requests
	 *
	 * IMPORTANT - there are performance risks and overhead with using conntack so verify that you're okay with that or at
	 * least aware
	 *
	 * @param rule
	 * @returns
	 */
	static convertDestPortsToConnTrack<
		T extends
			| IpV4TablesRule
			| IpV6TablesRule
			| (IpV4TablesRule | IpV6TablesRule)[],
	>(rule: T): T {
		if (Array.isArray(rule)) {
			return rule.map((r) => this._convertDestPortsToConnTrack(r)) as T;
		}
		return this._convertDestPortsToConnTrack(rule) as T;
	}
	private static _convertDestPortsToConnTrack(
		rule: IpV4TablesRule | IpV6TablesRule,
	): IpV4TablesRule | IpV6TablesRule {
		const { not = {}, destinationPorts, ...rest } = rule;
		const { destinationPorts: nDestinationPorts, ...restNot } = not;

		let portFlags = "";
		if (destinationPorts) {
			portFlags += `--ctorigdstport ${createPortArgValue(destinationPorts)}`;
		} else if (nDestinationPorts) {
			portFlags += `! --ctorigdstport ${createPortArgValue(nDestinationPorts)}`;
		}

		if (!portFlags) {
			return rule;
		}

		const appendedConntrack = `${rest.matchingModule?.conntrack ?? ""} ${portFlags}`;

		if (countTimes(appendedConntrack, "--ctorigdstport") > 1) {
			throw new Error(
				`Failed to convert rule to conntrack!  There was already a '--ctorigdstport' arg and a destinationPort that would conflict: ${JSON.stringify(rule)}`,
			);
		}

		return {
			...rest,
			not: {
				...restNot,
			},
			matchingModule: {
				...rest.matchingModule,
				conntrack: `${rest.matchingModule?.conntrack ?? ""} ${portFlags}`,
			},
		};
	}
	/**
	 * This is a helper method for you to take a normal --destination rule and convert it
	 * to use conntrack's --ctorigdst
	 *
	 * This exists since DOCKER-USER is post DNAT and therefore has its destination ip is changed.
	 * So you need to switch to conntrack per: https://docs.docker.com/engine/network/packet-filtering-firewalls/#match-the-original-ip-and-ports-for-requests
	 *
	 * IMPORTANT - there are performance risks and overhead with using conntack so verify that you're okay with that or at
	 * least aware
	 *
	 * @param rule
	 * @returns
	 */
	static convertDestIPsToConnTrack<
		T extends
			| IpV4TablesRule
			| IpV6TablesRule
			| (IpV4TablesRule | IpV6TablesRule)[],
	>(rule: T): T {
		if (Array.isArray(rule)) {
			return rule.map((r) => this._convertDestIPsToConnTrack(r)) as T;
		}
		return this._convertDestIPsToConnTrack(rule) as T;
	}
	static _convertDestIPsToConnTrack(
		rule: IpV4TablesRule | IpV6TablesRule,
	): IpV4TablesRule | IpV6TablesRule {
		const { not = {}, destination, ...rest } = rule;
		const { destination: nDestination, ...restNot } = not;

		let ipFlags = "";
		if (destination) {
			ipFlags += `--ctorigdst ${destination}`;
		} else if (nDestination) {
			ipFlags += `! --ctorigdst ${nDestination}`;
		}

		if (!ipFlags) {
			return rule;
		}

		const appendedConntrack = `${rest.matchingModule?.conntrack ?? ""} ${ipFlags}`;

		if (countTimes(appendedConntrack, "--ctorigdst") > 1) {
			throw new Error(
				`Failed to convert rule to conntrack!  There was already a '--ctorigdst' arg and a destination that would conflict: ${JSON.stringify(rule)}`,
			);
		}

		return {
			...rest,
			not: {
				...restNot,
			},
			matchingModule: {
				...rest.matchingModule,
				conntrack: `${rest.matchingModule?.conntrack ?? ""} ${ipFlags}`,
			},
		};
	}

	/**
	 * This is a helper method that converts destination and dport to use conntrack
	 *
	 * This exists since DOCKER-USER is post DNAT and therefore has its destination ip and port is changed.
	 * So you need to switch to conntrack per: https://docs.docker.com/engine/network/packet-filtering-firewalls/#match-the-original-ip-and-ports-for-requests
	 *
	 * IMPORTANT - there are performance risks and overhead with using conntack so verify that you're okay with that or at
	 * least aware
	 *
	 * @param rule
	 * @returns
	 */
	static convertDestIPAndPortToConnTrack<
		T extends
			| IpV4TablesRule
			| IpV6TablesRule
			| (IpV4TablesRule | IpV6TablesRule)[],
	>(rule: T): T {
		return this.convertDestPortsToConnTrack(
			this.convertDestIPsToConnTrack(rule),
		);
	}
}

/**
 * Gets the number of times something is in the string
 * @param str
 * @param search
 * @returns
 */
function countTimes(str: string, search: string) {
	let idx = -1;
	let count = 0;
	do {
		idx = str.indexOf(search, idx + 1);
		if (idx >= 0) {
			count++;
		}
	} while (idx >= 0);
	return count;
}
