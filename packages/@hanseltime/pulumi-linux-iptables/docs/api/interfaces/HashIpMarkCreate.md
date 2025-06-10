[**@hanseltime/pulumi-linux-iptables**](../README.md)

***

[@hanseltime/pulumi-linux-iptables](../README.md) / HashIpMarkCreate

# Interface: HashIpMarkCreate

## Extends

- [`CommonCreate`](CommonCreate.md).[`CommonHashCreate`](CommonHashCreate.md)

## Properties

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

### markmask?

> `optional` **markmask**: `number`

Allows you to set bits you are interested in the packet mark. This values is then used to perform bitwise AND operation for every mark added. markmask can be any value between 1 and 4294967295, by default all 32 bits are set.

The mark can be any value between 0 and 4294967295.

***

### maxelem?

> `optional` **maxelem**: `number`

#### Inherited from

[`CommonHashCreate`](CommonHashCreate.md).[`maxelem`](CommonHashCreate.md#maxelem)

***

### setType

> **setType**: [`HashIpMark`](../enumerations/SetTypes.md#hashipmark)

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
