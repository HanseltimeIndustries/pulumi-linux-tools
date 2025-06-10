/**
 * Config for our machine firewalls - just the config.  We import it in index.ts
 *
 * Since this is public internet example, we set up a block list for ipv4 and ipv6
 * with no ips.
 */

import {
	IpSet,
	IpV4TablesRule,
	IpV6TablesRule,
} from "@hanseltime/pulumi-linux-iptables";

export const globalBlockIpSetIpv4 = IpSet.HashIp("GLOBAL_BLOCK_IPV4", {
	family: "inet",
});
export const globalBlockIpSetIpv6 = IpSet.HashIp("GLOBAL_BLOCK_IPV6", {
	family: "inet6",
});
// Add ips via globalBlockIpSetIpv6.add("ip")

export const blacklistV4: IpV4TablesRule = {
	jump: "DROP",
	matchingModule: {
		set: globalBlockIpSetIpv4.matchArgs(["src"]),
	},
};

export const blacklistV6: IpV6TablesRule = {
	jump: "DROP",
	matchingModule: {
		set: globalBlockIpSetIpv6.matchArgs(["src"]),
	},
};
