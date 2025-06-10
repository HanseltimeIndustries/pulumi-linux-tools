export enum SetTypes {
	/**
	 * The bitmap:ip set type uses a memory range to store either IPv4 host (default) or IPv4 network addresses. A bitmap:ip type of set can store up to 65536 entries.
	 */
	BitmapIp = "bitmap:ip",
	/**
	 * The bitmap:ip,mac set type uses a memory range to store IPv4 and a MAC address pairs. A bitmap:ip,mac type of set can store up to 65536 entries.
	 */
	BitmapIpMac = "bitmap:ip,mac",
	/**
	 * The bitmap:port set type uses a memory range to store port numbers and such a set can store up to 65536 ports.
	 */
	BitmapPort = "bitmap:port",
	/**
	 * The hash:ip set type uses a hash to store IP host addresses (default) or network addresses. Zero valued IP address cannot be stored in a hash:ip type of set.
	 */
	HashIp = "hash:ip",
	/**
	 * The hash:mac set type uses a hash to store MAC addresses. Zero valued MAC addresses cannot be stored in a hash:mac type of set. For matches on destination MAC addresses, see COMMENTS below.
	 */
	HashMac = "hash:mac",
	/**
	 * The hash:ip,mac set type uses a hash to store IP and a MAC address pairs. Zero valued MAC addresses cannot be stored in a hash:ip,mac type of set. For matches on destination MAC addresses, see COMMENTS below.
	 */
	HashIpMac = "hash:ip,mac",
	/**
	 * The hash:net set type uses a hash to store different sized IP network addresses. Network address with zero prefix size cannot be stored in this type of sets.
	 */
	HashNet = "hash:net",
	/**
	 * The hash:net,net set type uses a hash to store pairs of different sized IP network addresses. Bear in mind that the first parameter has precedence over the second, so a nomatch entry could be potentially be ineffective if a more specific first parameter existed with a suitable second parameter. Network address with zero prefix size cannot be stored in this type of set.
	 */
	HashNetNet = "hash:net,net",
	/**
	 *  The hash:ip,port set type uses a hash to store IP address and port number pairs. The port number is interpreted together with a protocol (default TCP) and zero protocol number cannot be used.
	 */
	HashIpPort = "hash:ip,port",
	/**
	 * The hash:ip,port set type uses a hash to store IP address and port number pairs. The port number is interpreted together with a protocol (default TCP) and zero protocol number cannot be used.
	 */
	HashNetPort = "hash:net,port",
	/**
	 * The hash:ip,port,ip set type uses a hash to store IP address, port number and a second IP address triples. The port number is interpreted together with a protocol (default TCP) and zero protocol number cannot be used.
	 */
	HashIpPortIp = "hash:ip,port,ip",
	/**
	 * The hash:ip,port,net set type uses a hash to store IP address, port number and IP network address triples. The port number is interpreted together with a protocol (default TCP) and zero protocol number cannot be used. Network address with zero prefix size cannot be stored either.
	 */
	HashIpPortNet = "hash:ip,port,net",
	/**
	 * The hash:ip,mark set type uses a hash to store IP address and packet mark pairs.
	 */
	HashIpMark = "hash:ip,mark",
	/**
	 * The hash:net,port,net set type behaves similarly to hash:ip,port,net but accepts a cidr value for both the first and last parameter. Either subnet is permitted to be a /0 should you wish to match port between all destinations.
	 */
	HashNetPortNet = "hash:net,port,net",
	/**
	 * The hash:net,iface set type uses a hash to store different sized IP network address and interface name pairs.
	 */
	HashNetIface = "hash:net,iface",
	/**
	 * The list:set type uses a simple list in which you can store set names.
	 */
	ListSet = "list:set",
}

export type CIDR = string;
/**
 * format ip-ip
 */
export type FromIPToIp = string;
/**
 * format port-port
 */
export type FromPortToPort = string;
export type IP = string;
export type IPFamily = "inet" | "inet6";

export interface CommonCreate {
	timeout?: number;
	counters?: boolean;
	comment?: boolean;
	skbinfo?: boolean;
}

export interface CommonHashCreate {
	hashsize?: number;
	maxelem?: number;
	bucketsize?: number;
}

export interface BitMapIpCreate extends CommonCreate {
	setType: SetTypes.BitmapIp;
	range: CIDR | FromIPToIp;
	/**
	 * When the optional netmask parameter specified, network addresses will be stored in the set instead of IP host addresses. The cidr prefix value must be between 1-32. An IP address will be in the set if the network address, which is resulted by masking the address with the specified netmask, can be found in the set.
	 */
	netmask?: CIDR;
}

export interface BitMapIpMacCreate extends CommonCreate {
	setType: SetTypes.BitmapIpMac;
	range: CIDR | FromIPToIp;
}

export interface BitMapPortCreate extends CommonCreate {
	setType: SetTypes.BitmapPort;
	range: FromPortToPort;
}

export interface HashIpCreate extends CommonCreate, CommonHashCreate {
	setType: SetTypes.HashIp;
	family: IPFamily;
	/**
	 * When the optional netmask parameter specified, network addresses will be stored in the set instead of IP host addresses. The cidr prefix value must be between 1-32 for IPv4 and between 1-128 for IPv6. An IP address will be in the set if the network address, which is resulted by masking the address with the netmask, can be found in the set. Examples:
	 * ipset create foo hash:ip netmask 30
	 * ipset add foo 192.168.1.0/24
	 * ipset test foo 192.168.1.2
	 */
	netmask?: CIDR;
	/**
	 * This works similar to netmask but it will accept any valid IPv4/v6 address. It does not have to be a valid netmask.
	 */
	bitmask?: IP;
}

export interface HashMacCreate extends CommonCreate, CommonHashCreate {
	setType: SetTypes.HashMac;
}

export interface HashIpMacCreate extends CommonCreate, CommonHashCreate {
	setType: SetTypes.HashIpMac;
	family: IPFamily;
}

export interface HashNetCreate extends CommonCreate, CommonHashCreate {
	setType: SetTypes.HashNet;
	family: IPFamily;
}

export interface HashNetNetCreate extends CommonCreate, CommonHashCreate {
	setType: SetTypes.HashNetNet;
	family: IPFamily;
	/**
	 * When the optional netmask parameter specified, network addresses will be stored in the set instead of IP host addresses. The cidr prefix value must be between 1-32 for IPv4 and between 1-128 for IPv6. An IP address will be in the set if the network address, which is resulted by masking the address with the netmask, can be found in the set.
	 */
	netmask?: CIDR;
	/**
	 * This works similar to netmask but it will accept any valid IPv4/v6 address. It does not have to be a valid netmask.
	 */
	bitmask?: IP;
}

export interface HashIpPortCreate extends CommonCreate, CommonHashCreate {
	setType: SetTypes.HashIpPort;
	family: IPFamily;
	/**
	 * When the optional netmask parameter specified, network addresses will be stored in the set instead of IP host addresses. The cidr prefix value must be between 1-32 for IPv4 and between 1-128 for IPv6. An IP address will be in the set if the network address, which is resulted by masking the address with the netmask, can be found in the set.
	 */
	netmask?: CIDR;
	/**
	 * This works similar to netmask but it will accept any valid IPv4/v6 address. It does not have to be a valid netmask.
	 */
	bitmask?: IP;
}

export interface HashNetPortCreate extends CommonCreate, CommonHashCreate {
	setType: SetTypes.HashNetPort;
	family: IPFamily;
}

export interface HashIpPortIpCreate extends CommonCreate, CommonHashCreate {
	setType: SetTypes.HashIpPortIp;
	family: IPFamily;
}

export interface HashIpPortNetCreate extends CommonCreate, CommonHashCreate {
	setType: SetTypes.HashIpPortNet;
	family: IPFamily;
}

export interface HashIpMarkCreate extends CommonCreate, CommonHashCreate {
	setType: SetTypes.HashIpMark;
	family: IPFamily;
	/**
	 * Allows you to set bits you are interested in the packet mark. This values is then used to perform bitwise AND operation for every mark added. markmask can be any value between 1 and 4294967295, by default all 32 bits are set.
	 *
	 * The mark can be any value between 0 and 4294967295.
	 */
	markmask?: number;
}

export interface HashNetPortNetCreate extends CommonCreate, CommonHashCreate {
	setType: SetTypes.HashNetPortNet;
	family: IPFamily;
}

export interface HashNetIfaceCreate extends CommonCreate, CommonHashCreate {
	setType: SetTypes.HashNetIface;
	family: IPFamily;
}

export interface ListSetCreate extends CommonCreate {
	setType: SetTypes.ListSet;
	size?: number;
}

export type CreateInterfaces =
	| ListSetCreate
	| HashNetIfaceCreate
	| HashNetPortNetCreate
	| HashIpMarkCreate
	| HashIpPortNetCreate
	| HashIpPortIpCreate
	| HashNetPortCreate
	| HashIpPortCreate
	| HashNetCreate
	| HashNetNetCreate
	| BitMapIpCreate
	| BitMapIpMacCreate
	| BitMapPortCreate
	| HashIpCreate
	| HashMacCreate
	| HashIpMacCreate;

// Add Options
/**
 * If skbinfo is enable for the ipset
 */
export interface SkbEntryOptions {
	skbmark?: string;
	skbprio?: string;
	skbqueue?: string;
}

export interface CommonEntryOptions extends SkbEntryOptions {
	timeout?: number;
	/**
	 * If counter is enabled for the ipset
	 */
	packets?: number;
	/**
	 * If counter is enabled for the ipset
	 */
	bytes?: number;
	/**
	 * If comment is enabled for the ipset
	 */
	comment?: string;
}

export interface BitMapIpEntry {
	ip: IP | FromIPToIp | CIDR;
}

export interface BitMapIpEntryAdd extends CommonEntryOptions, BitMapIpEntry {}

export interface BitMapIpMacEntry {
	ip: IP;
	/**
	 * The mac address
	 */
	mac?: string;
}

export interface BitMapIpMacEntryAdd
	extends CommonEntryOptions,
		BitMapIpMacEntry {}

export interface PortEntry {
	/**
	 * proto only needs to be specified if a service name is used and that name does not exist as a TCP service. The protocol is never stored in the set, just the port number of the service.
	 */
	protocol?: string;
	port: string | FromPortToPort;
}

export interface BitMapPortEntryAdd extends PortEntry, CommonEntryOptions {}

export interface HashIpEntry {
	ip: IP | CIDR;
}

export interface HashIpEntryAdd extends HashIpEntry, CommonEntryOptions {
	ip: IP | CIDR;
}

export interface HashMacEntry {
	mac: string;
}

export interface HashMacEntryAdd extends HashMacEntry, CommonEntryOptions {}

export interface HashIpMacEntry {
	ip: IP;
	mac: string;
}

export interface HashIpMacEntryAdd extends HashIpMacEntry, CommonEntryOptions {}

export interface HashNetEntry {
	/**
	 *  When adding/deleting/testing entries, if the cidr prefix parameter is not specified, then the host prefix value is assumed. When adding/deleting entries, the exact element is added/deleted and overlapping elements are not checked by the kernel. When testing entries, if a host address is tested, then the kernel tries to match the host address in the networks added to the set and reports the result accordingly.
	 * From the set netfilter match point of view the searching for a match always starts from the smallest size of netblock (most specific prefix) to the largest one (least specific prefix) added to the set. When adding/deleting IP addresses to the set by the SET netfilter target, it will be added/deleted by the most specific prefix which can be found in the set, or by the host prefix value if the set is empty.
	 * The lookup time grows linearly with the number of the different prefix values added to the set.
	 */
	netaddr: string;
}

export interface HashNetEntryAdd extends HashNetEntry, CommonEntryOptions {
	nomatch?: boolean;
}

export interface HashNetNetEntry {
	/**
	 *  When adding/deleting/testing entries, if the cidr prefix parameter is not specified, then the host prefix value is assumed. When adding/deleting entries, the exact element is added/deleted and overlapping elements are not checked by the kernel. When testing entries, if a host address is tested, then the kernel tries to match the host address in the networks added to the set and reports the result accordingly.
	 *
	 * From the set netfilter match point of view the searching for a match always starts from the smallest size of netblock (most specific prefix) to the largest one (least specific prefix) with the first param having precedence. When adding/deleting IP addresses to the set by the SET netfilter target, it will be added/deleted by the most specific prefix which can be found in the set, or by the host prefix value if the set is empty.
	 *
	 * The lookup time grows linearly with the number of the different prefix values added to the first parameter of the set. The number of secondary prefixes further increases this as the list of secondary prefixes is traversed per primary prefix.
	 */
	netaddr: string;
	netaddr2: string;
}

export interface HashNetNetEntryAdd
	extends HashNetNetEntry,
		CommonEntryOptions {
	nomatch?: boolean;
}

export interface HashIpPortEntry extends HashIpEntry, PortEntry {}

export interface HashIpPortEntryAdd
	extends HashIpPortEntry,
		CommonEntryOptions {}

export interface HashNetPortEntry extends HashNetEntry, PortEntry {}

export interface HashNetPortEntryAdd
	extends HashNetPortEntry,
		CommonEntryOptions {}

export interface HashIpPortIpEntry extends HashIpEntry, PortEntry {
	secondIp: IP;
}

export interface HashIpPortIpEntryAdd
	extends HashIpPortIpEntry,
		CommonEntryOptions {}

export interface HashIpPortNetEntry
	extends HashIpEntry,
		PortEntry,
		HashNetEntry {}

export interface HashIpPortNetEntryAdd
	extends HashIpPortNetEntry,
		CommonEntryOptions {}

export interface HashIpMarkEntry extends HashIpEntry {
	mark: number;
}

export interface HashIpMarkEntryAdd
	extends HashIpMarkEntry,
		CommonEntryOptions {}

export interface HashNetPortNetEntry extends HashNetNetEntry, PortEntry {}

export interface HashNetPortNetEntryAdd
	extends HashNetPortNetEntry,
		CommonEntryOptions {}

/**
 *  When adding/deleting/testing entries, if the cidr prefix parameter is not specified, then the host prefix value is assumed. When adding/deleting entries, the exact element is added/deleted and overlapping elements are not checked by the kernel. When testing entries, if a host address is tested, then the kernel tries to match the host address in the networks added to the set and reports the result accordingly.
 *
 * From the set netfilter match point of view the searching for a match always starts from the smallest size of netblock (most specific prefix) to the largest one (least specific prefix) added to the set. When adding/deleting IP addresses to the set by the SET netfilter target, it will be added/deleted by the most specific prefix which can be found in the set, or by the host prefix value if the set is empty.
 *
 * The second direction parameter of the set match and SET target modules corresponds to the incoming/outgoing interface: src to the incoming one (similar to the -i flag of iptables), while dst to the outgoing one (similar to the -o flag of iptables). When the interface is flagged with physdev:, the interface is interpreted as the incoming/outgoing bridge port.
 *
 * The lookup time grows linearly with the number of the different prefix values added to the set.
 *
 * The internal restriction of the hash:net,iface set type is that the same network prefix cannot be stored with more than 64 different interfaces in a single set.
 */
export interface HashNetIfaceEntry extends HashNetEntry {
	phsydev?: boolean;
	iface: string;
}

export interface HashNetIfaceEntryAdd
	extends HashNetIfaceEntry,
		CommonEntryOptions {}

export interface ListSetEntry {
	setname: string;
	order?: {
		type: "before" | "after";
		setname: string;
	};
}

export interface ListSetEntryAdd extends ListSetEntry, CommonEntryOptions {}

export type EntryAddInterfaces =
	| ListSetEntryAdd
	| HashNetIfaceEntryAdd
	| HashNetPortNetEntryAdd
	| HashIpMarkEntryAdd
	| HashIpPortNetEntryAdd
	| HashIpPortIpEntryAdd
	| HashNetPortEntryAdd
	| HashIpPortEntryAdd
	| HashNetEntryAdd
	| HashNetNetEntryAdd
	| BitMapIpEntryAdd
	| BitMapIpMacEntryAdd
	| BitMapPortEntryAdd
	| HashIpEntryAdd
	| HashMacEntryAdd
	| HashIpMacEntryAdd;
