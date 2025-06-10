[**@hanseltime/pulumi-linux-iptables**](../README.md)

***

[@hanseltime/pulumi-linux-iptables](../README.md) / HashNetNetCreate

# Interface: HashNetNetCreate

## Extends

- [`CommonCreate`](CommonCreate.md).[`CommonHashCreate`](CommonHashCreate.md)

## Properties

### bitmask?

> `optional` **bitmask**: `string`

This works similar to netmask but it will accept any valid IPv4/v6 address. It does not have to be a valid netmask.

***

### bucketsize?

> `optional` **bucketsize**: `number`

#### Inherited from

[`CommonHashCreate`](CommonHashCreate.md).[`bucketsize`](CommonHashCreate.md#bucketsize)

***

### comment?

> `optional` **comment**: `boolean`

#### Inherited from

[`CommonCreate`](CommonCreate.md).[`comment`](CommonCreate.md#comment)

***

### counters?

> `optional` **counters**: `boolean`

#### Inherited from

[`CommonCreate`](CommonCreate.md).[`counters`](CommonCreate.md#counters)

***

### family

> **family**: [`IPFamily`](../type-aliases/IPFamily.md)

***

### hashsize?

> `optional` **hashsize**: `number`

#### Inherited from

[`CommonHashCreate`](CommonHashCreate.md).[`hashsize`](CommonHashCreate.md#hashsize)

***

### maxelem?

> `optional` **maxelem**: `number`

#### Inherited from

[`CommonHashCreate`](CommonHashCreate.md).[`maxelem`](CommonHashCreate.md#maxelem)

***

### netmask?

> `optional` **netmask**: `string`

When the optional netmask parameter specified, network addresses will be stored in the set instead of IP host addresses. The cidr prefix value must be between 1-32 for IPv4 and between 1-128 for IPv6. An IP address will be in the set if the network address, which is resulted by masking the address with the netmask, can be found in the set.

***

### setType

> **setType**: [`HashNetNet`](../enumerations/SetTypes.md#hashnetnet)

***

### skbinfo?

> `optional` **skbinfo**: `boolean`

#### Inherited from

[`CommonCreate`](CommonCreate.md).[`skbinfo`](CommonCreate.md#skbinfo)

***

### timeout?

> `optional` **timeout**: `number`

#### Inherited from

[`CommonCreate`](CommonCreate.md).[`timeout`](CommonCreate.md#timeout)
