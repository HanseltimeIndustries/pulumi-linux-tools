[**@hanseltime/pulumi-linux-iptables**](../README.md)

***

[@hanseltime/pulumi-linux-iptables](../README.md) / HashNetIfaceEntry

# Interface: HashNetIfaceEntry

When adding/deleting/testing entries, if the cidr prefix parameter is not specified, then the host prefix value is assumed. When adding/deleting entries, the exact element is added/deleted and overlapping elements are not checked by the kernel. When testing entries, if a host address is tested, then the kernel tries to match the host address in the networks added to the set and reports the result accordingly.

From the set netfilter match point of view the searching for a match always starts from the smallest size of netblock (most specific prefix) to the largest one (least specific prefix) added to the set. When adding/deleting IP addresses to the set by the SET netfilter target, it will be added/deleted by the most specific prefix which can be found in the set, or by the host prefix value if the set is empty.

The second direction parameter of the set match and SET target modules corresponds to the incoming/outgoing interface: src to the incoming one (similar to the -i flag of iptables), while dst to the outgoing one (similar to the -o flag of iptables). When the interface is flagged with physdev:, the interface is interpreted as the incoming/outgoing bridge port.

The lookup time grows linearly with the number of the different prefix values added to the set.

The internal restriction of the hash:net,iface set type is that the same network prefix cannot be stored with more than 64 different interfaces in a single set.

## Extends

- [`HashNetEntry`](HashNetEntry.md)

## Extended by

- [`HashNetIfaceEntryAdd`](HashNetIfaceEntryAdd.md)

## Properties

### iface

> **iface**: `string`

***

### netaddr

> **netaddr**: `string`

When adding/deleting/testing entries, if the cidr prefix parameter is not specified, then the host prefix value is assumed. When adding/deleting entries, the exact element is added/deleted and overlapping elements are not checked by the kernel. When testing entries, if a host address is tested, then the kernel tries to match the host address in the networks added to the set and reports the result accordingly.
From the set netfilter match point of view the searching for a match always starts from the smallest size of netblock (most specific prefix) to the largest one (least specific prefix) added to the set. When adding/deleting IP addresses to the set by the SET netfilter target, it will be added/deleted by the most specific prefix which can be found in the set, or by the host prefix value if the set is empty.
The lookup time grows linearly with the number of the different prefix values added to the set.

#### Inherited from

[`HashNetEntry`](HashNetEntry.md).[`netaddr`](HashNetEntry.md#netaddr)

***

### phsydev?

> `optional` **phsydev**: `boolean`
