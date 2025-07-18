[**@hanseltime/pulumi-linux-iptables**](../README.md)

***

[@hanseltime/pulumi-linux-iptables](../README.md) / HashNetEntry

# Interface: HashNetEntry

## Extended by

- [`HashNetEntryAdd`](HashNetEntryAdd.md)
- [`HashNetPortEntry`](HashNetPortEntry.md)
- [`HashIpPortNetEntry`](HashIpPortNetEntry.md)
- [`HashNetIfaceEntry`](HashNetIfaceEntry.md)

## Properties

### netaddr

> **netaddr**: `string`

When adding/deleting/testing entries, if the cidr prefix parameter is not specified, then the host prefix value is assumed. When adding/deleting entries, the exact element is added/deleted and overlapping elements are not checked by the kernel. When testing entries, if a host address is tested, then the kernel tries to match the host address in the networks added to the set and reports the result accordingly.
From the set netfilter match point of view the searching for a match always starts from the smallest size of netblock (most specific prefix) to the largest one (least specific prefix) added to the set. When adding/deleting IP addresses to the set by the SET netfilter target, it will be added/deleted by the most specific prefix which can be found in the set, or by the host prefix value if the set is empty.
The lookup time grows linearly with the number of the different prefix values added to the set.
