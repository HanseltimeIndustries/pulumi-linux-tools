import { CIDR, IP } from "./ipset";

/**
 *  This option specifies the packet matching table which the command should operate on. If the kernel is configured with automatic module loading, an attempt will be made to load the appropriate module for that table if it is not already there.
 */
export type IpTablesTable = "filter" | "nat" | "mangle" | "raw";

export type IpProtocol =
	| "tcp"
	| "udp"
	| "udplite"
	| "icmp"
	| "icmpv6"
	| "esp"
	| "ah"
	| "sctp"
	| "mh"
	| "all";

// Not, we are missing fragment, goto

interface CommonInvertableIpTableProps {
	/**
	 * Source specification. Address can be either a network name, a hostname (please note that specifying any name to be resolved with a remote query such as DNS is a really bad idea), a network IP address (with /mask), or a plain IP address. The mask can be either a network mask or a plain number, specifying the number of 1's at the left side of the network mask. Thus, a mask of 24 is equivalent to 255.255.255.0. A "!" argument before the address specification inverts the sense of the address. The flag --src is an alias for this option.
	 */
	source?: IP | CIDR;
	/**
	 * Destination specification. See the description of the -s (source) flag for a detailed description of the syntax. The flag --dst is an alias for this option.
	 */
	destination?: IP | CIDR;
	/**
	 * Name of an interface via which a packet was received (only for packets entering the INPUT, FORWARD and PREROUTING chains). When the "!" argument is used before the interface name, the sense is inverted. If the interface name ends in a "+", then any interface which begins with this name will match. If this option is omitted, any interface name will match.
	 */
	inInterface?: string;
	/**
	 * Name of an interface via which a packet is going to be sent (for packets entering the FORWARD, OUTPUT and POSTROUTING chains). When the "!" argument is used before the interface name, the sense is inverted. If the interface name ends in a "+", then any interface which begins with this name will match. If this option is omitted, any interface name will match.
	 */
	outInterface?: string;
	/**
	 * The protocol of the rule or of the packet to check.  The
	 * specified protocol can be one of tcp, udp, udplite, icmp,
	 * icmpv6, esp, ah, sctp, mh or the special keyword "all", or
	 * it can be a numeric value, representing one of these
	 * protocols or a different one.  A protocol name from
	 * /etc/protocols is also allowed.  A "!" argument before the
	 * protocol inverts the test.  The number zero is equivalent
	 * to all. "all" will match with all protocols and is taken as
	 * default when this option is omitted.  Note that, in
	 * ip6tables, IPv6 extension headers except esp are not
	 * allowed.  esp and ipv6-nonext can be used with Kernel
	 * version 2.6.11 or later.  The number zero is equivalent to
	 * all, which means that you cannot test the protocol field
	 * for the value 0 directly. To match on a HBH header, even if
	 * it were the last, you cannot use -p 0, but always need -m
	 * hbh.
	 */
	protocol?: IpProtocol;
	/**
	 * The ports that are being pointed to or a range of ports that are being pointed to
	 *
	 * Important - note that you will need to have a protocol that supports dports
	 * https://ipset.netfilter.org/iptables-extensions.man.html
	 */
	destinationPorts?: number | [number, number];
	/**
	 * The ports that are being come from or a range of ports that are being pointed to
	 *
	 * Important - note that you will need to have a protocol that supports sports
	 * https://ipset.netfilter.org/iptables-extensions.man.html
	 */
	sourcePorts?: number | [number, number];
}

/**
 * Properties for iptables that can be negated
 */
export interface InvertableIpV4TablesProps
	extends CommonInvertableIpTableProps {
	/**
	 * This means that the rule only refers to second and further fragments of fragmented packets. Since there is no way to tell the source or destination ports of such a packet (or ICMP type), such a packet will not match any rules which specify them. When the "!" argument precedes the "-f" flag, the rule will only match head fragments, or unfragmented packets.
	 *
	 * IPV4 Only
	 */
	fragment?: boolean;
}

/**
 * Properties for iptables that can be negated
 */
export interface InvertableIpV6TablesProps
	extends CommonInvertableIpTableProps {}

type CommonIpTablesRule<
	InvertableProps extends InvertableIpV4TablesProps | InvertableIpV6TablesProps,
> = InvertableProps & {
	not?: InvertableProps;
	/**
	 * This specifies the target of the rule; i.e., what to do if the packet matches it. The target can be a user-defined chain (other than the one this rule is in), one of the special builtin targets which decide the fate of the packet immediately, or an extension (see EXTENSIONS below). If this option is omitted in a rule (and -g is not used), then matching the rule will have no effect on the packet's fate, but the counters on the rule will be incremented.
	 */
	jump?: string;
	/**
	 * -g, --goto chain
	 * This specifies that the processing should continue in a user specified chain. Unlike the --jump option return will not continue processing in this chain but instead in the chain that called us via --jump.
	 *
	 * IPV4 only
	 */
	goto?: string;
	/**
	 * This enables the administrator to initialize the packet and byte counters of a rule (during INSERT, APPEND, REPLACE operations).
	 */
	setCounters?: boolean;
	/**
	 * If you want to use matching extensions, you can supply them here
	 *
	 * example:
	 *
	 * {
	 *   set: '--match-set AllowedIP src'
	 * }
	 */
	matchingModule?: {
		/**
		 * Consult https://www.man7.org/linux/man-pages/man8/ip6tables.8.html for module extensions and their arguments
		 *
		 * You can specify the module and then the entire argument string for that module
		 */
		[module: string]: string;
	};
};

/**
 * Describes an iptables rule that would be written via tha iptables command
 */
export interface IpV4TablesRule
	extends CommonIpTablesRule<InvertableIpV4TablesProps> {
	/**
	 * -g, --goto chain
	 * This specifies that the processing should continue in a user specified chain. Unlike the --jump option return will not continue processing in this chain but instead in the chain that called us via --jump.
	 *
	 * IPV4 only
	 */
	goto?: string;
}

export interface IpV6TablesRule
	extends CommonIpTablesRule<InvertableIpV6TablesProps> {}

/**
 * Describes an entire iptables chain
 *
 * See: https://www.man7.org/linux/man-pages/man8/ip6tables.8.html
 */
export interface IpTablesChainArgs {
	/**
	 * the name fo the iptables chain
	 */
	name: string;
	/**
	 * Which table this chain is located in
	 */
	table: IpTablesTable;
	/**
	 * All rules for the chain in iptables (ipv4)
	 */
	rulesIpV4: IpV4TablesRule[];
	/**
	 * All rules for the chain in iptables (ipv6)
	 */
	rulesIpV6: IpV6TablesRule[];
	/**
	 * If this chain is expected to already be created (i.e. one of the standard chains or something like DOCKER-USER that docker makes for you to filter)
	 * This also means that we will only Flush the chain on deletion instead of deleting it outright
	 */
	alreadyCreated?: boolean;
}
