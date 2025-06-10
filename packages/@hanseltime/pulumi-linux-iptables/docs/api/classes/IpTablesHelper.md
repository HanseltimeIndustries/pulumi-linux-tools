[**@hanseltime/pulumi-linux-iptables**](../README.md)

***

[@hanseltime/pulumi-linux-iptables](../README.md) / IpTablesHelper

# Class: IpTablesHelper

Helper class with static methods for tweaking IpTables Objects

## Constructors

### Constructor

> **new IpTablesHelper**(): `IpTablesHelper`

#### Returns

`IpTablesHelper`

## Methods

### \_convertDestIPsToConnTrack()

> `static` **\_convertDestIPsToConnTrack**(`rule`): [`IpV4TablesRule`](../interfaces/IpV4TablesRule.md) \| [`IpV6TablesRule`](../interfaces/IpV6TablesRule.md)

#### Parameters

##### rule

[`IpV4TablesRule`](../interfaces/IpV4TablesRule.md) | [`IpV6TablesRule`](../interfaces/IpV6TablesRule.md)

#### Returns

[`IpV4TablesRule`](../interfaces/IpV4TablesRule.md) \| [`IpV6TablesRule`](../interfaces/IpV6TablesRule.md)

***

### convertDestIPAndPortToConnTrack()

> `static` **convertDestIPAndPortToConnTrack**\<`T`\>(`rule`): `T`

This is a helper method that converts destination and dport to use conntrack

This exists since DOCKER-USER is post DNAT and therefore has its destination ip and port is changed.
So you need to switch to conntrack per: https://docs.docker.com/engine/network/packet-filtering-firewalls/#match-the-original-ip-and-ports-for-requests

IMPORTANT - there are performance risks and overhead with using conntack so verify that you're okay with that or at
least aware

#### Type Parameters

##### T

`T` *extends* [`IpV4TablesRule`](../interfaces/IpV4TablesRule.md) \| [`IpV6TablesRule`](../interfaces/IpV6TablesRule.md) \| ([`IpV4TablesRule`](../interfaces/IpV4TablesRule.md) \| [`IpV6TablesRule`](../interfaces/IpV6TablesRule.md))[]

#### Parameters

##### rule

`T`

#### Returns

`T`

***

### convertDestIPsToConnTrack()

> `static` **convertDestIPsToConnTrack**\<`T`\>(`rule`): `T`

This is a helper method for you to take a normal --destination rule and convert it
to use conntrack's --ctorigdst

This exists since DOCKER-USER is post DNAT and therefore has its destination ip is changed.
So you need to switch to conntrack per: https://docs.docker.com/engine/network/packet-filtering-firewalls/#match-the-original-ip-and-ports-for-requests

IMPORTANT - there are performance risks and overhead with using conntack so verify that you're okay with that or at
least aware

#### Type Parameters

##### T

`T` *extends* [`IpV4TablesRule`](../interfaces/IpV4TablesRule.md) \| [`IpV6TablesRule`](../interfaces/IpV6TablesRule.md) \| ([`IpV4TablesRule`](../interfaces/IpV4TablesRule.md) \| [`IpV6TablesRule`](../interfaces/IpV6TablesRule.md))[]

#### Parameters

##### rule

`T`

#### Returns

`T`

***

### convertDestPortsToConnTrack()

> `static` **convertDestPortsToConnTrack**\<`T`\>(`rule`): `T`

This is a helper method for you to take a normal --dport --sport rule and convert it
to use conntrack's --ctorigsrcport/--ctorigdstport

This exists since DOCKER-USER is post DNAT and therefore has its dports changed.
So you need to switch to conntrack per: https://docs.docker.com/engine/network/packet-filtering-firewalls/#match-the-original-ip-and-ports-for-requests

IMPORTANT - there are performance risks and overhead with using conntack so verify that you're okay with that or at
least aware

#### Type Parameters

##### T

`T` *extends* [`IpV4TablesRule`](../interfaces/IpV4TablesRule.md) \| [`IpV6TablesRule`](../interfaces/IpV6TablesRule.md) \| ([`IpV4TablesRule`](../interfaces/IpV4TablesRule.md) \| [`IpV6TablesRule`](../interfaces/IpV6TablesRule.md))[]

#### Parameters

##### rule

`T`

#### Returns

`T`
