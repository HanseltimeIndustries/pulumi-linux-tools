[**@hanseltime/pulumi-linux-iptables**](../README.md)

***

[@hanseltime/pulumi-linux-iptables](../README.md) / BitMapIpCreate

# Interface: BitMapIpCreate

## Extends

- [`CommonCreate`](CommonCreate.md)

## Properties

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

### netmask?

> `optional` **netmask**: `string`

When the optional netmask parameter specified, network addresses will be stored in the set instead of IP host addresses. The cidr prefix value must be between 1-32. An IP address will be in the set if the network address, which is resulted by masking the address with the specified netmask, can be found in the set.

***

### range

> **range**: `string`

***

### setType

> **setType**: [`BitmapIp`](../enumerations/SetTypes.md#bitmapip)

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
