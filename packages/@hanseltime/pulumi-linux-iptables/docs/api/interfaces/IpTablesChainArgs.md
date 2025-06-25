[**@hanseltime/pulumi-linux-iptables**](../README.md)

***

[@hanseltime/pulumi-linux-iptables](../README.md) / IpTablesChainArgs

# Interface: IpTablesChainArgs

Describes an entire iptables chain

See: https://www.man7.org/linux/man-pages/man8/ip6tables.8.html

## Properties

### alreadyCreated?

> `optional` **alreadyCreated**: `boolean`

If this chain is expected to already be created (i.e. one of the standard chains or something like DOCKER-USER that docker makes for you to filter)
This also means that we will only Flush the chain on deletion instead of deleting it outright

***

### name

> **name**: `string`

the name fo the iptables chain

***

### rulesIpV4

> **rulesIpV4**: [`IpV4TablesRule`](IpV4TablesRule.md)[]

All rules for the chain in iptables (ipv4)

The order of the rules is the order of evaluation (i.e. 1 -> 2 -> 3)

***

### rulesIpV6

> **rulesIpV6**: [`IpV6TablesRule`](IpV6TablesRule.md)[]

All rules for the chain in iptables (ipv6)

The order of the rules is the order of evaluation (i.e. 1 -> 2 -> 3)

***

### table

> **table**: [`IpTablesTable`](../type-aliases/IpTablesTable.md)

Which table this chain is located in
