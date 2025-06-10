[**@hanseltime/pulumi-linux-iptables**](../README.md)

***

[@hanseltime/pulumi-linux-iptables](../README.md) / CommonEntryOptions

# Interface: CommonEntryOptions

If skbinfo is enable for the ipset

## Extends

- [`SkbEntryOptions`](SkbEntryOptions.md)

## Extended by

- [`BitMapIpEntryAdd`](BitMapIpEntryAdd.md)
- [`BitMapIpMacEntryAdd`](BitMapIpMacEntryAdd.md)
- [`BitMapPortEntryAdd`](BitMapPortEntryAdd.md)
- [`HashIpEntryAdd`](HashIpEntryAdd.md)
- [`HashMacEntryAdd`](HashMacEntryAdd.md)
- [`HashIpMacEntryAdd`](HashIpMacEntryAdd.md)
- [`HashNetEntryAdd`](HashNetEntryAdd.md)
- [`HashNetNetEntryAdd`](HashNetNetEntryAdd.md)
- [`HashIpPortEntryAdd`](HashIpPortEntryAdd.md)
- [`HashNetPortEntryAdd`](HashNetPortEntryAdd.md)
- [`HashIpPortIpEntryAdd`](HashIpPortIpEntryAdd.md)
- [`HashIpPortNetEntryAdd`](HashIpPortNetEntryAdd.md)
- [`HashIpMarkEntryAdd`](HashIpMarkEntryAdd.md)
- [`HashNetPortNetEntryAdd`](HashNetPortNetEntryAdd.md)
- [`HashNetIfaceEntryAdd`](HashNetIfaceEntryAdd.md)
- [`ListSetEntryAdd`](ListSetEntryAdd.md)

## Properties

### bytes?

> `optional` **bytes**: `number`

If counter is enabled for the ipset

***

### comment?

> `optional` **comment**: `string`

If comment is enabled for the ipset

***

### packets?

> `optional` **packets**: `number`

If counter is enabled for the ipset

***

### skbmark?

> `optional` **skbmark**: `string`

#### Inherited from

[`SkbEntryOptions`](SkbEntryOptions.md).[`skbmark`](SkbEntryOptions.md#skbmark)

***

### skbprio?

> `optional` **skbprio**: `string`

#### Inherited from

[`SkbEntryOptions`](SkbEntryOptions.md).[`skbprio`](SkbEntryOptions.md#skbprio)

***

### skbqueue?

> `optional` **skbqueue**: `string`

#### Inherited from

[`SkbEntryOptions`](SkbEntryOptions.md).[`skbqueue`](SkbEntryOptions.md#skbqueue)

***

### timeout?

> `optional` **timeout**: `number`
