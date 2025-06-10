[**@hanseltime/pulumi-linux-iptables**](../README.md)

***

[@hanseltime/pulumi-linux-iptables](../README.md) / HashIpPortEntryAdd

# Interface: HashIpPortEntryAdd

If skbinfo is enable for the ipset

## Extends

- [`HashIpPortEntry`](HashIpPortEntry.md).[`CommonEntryOptions`](CommonEntryOptions.md)

## Properties

### bytes?

> `optional` **bytes**: `number`

If counter is enabled for the ipset

#### Inherited from

[`CommonEntryOptions`](CommonEntryOptions.md).[`bytes`](CommonEntryOptions.md#bytes)

***

### comment?

> `optional` **comment**: `string`

If comment is enabled for the ipset

#### Inherited from

[`CommonEntryOptions`](CommonEntryOptions.md).[`comment`](CommonEntryOptions.md#comment)

***

### ip

> **ip**: `string`

#### Inherited from

[`HashIpPortEntry`](HashIpPortEntry.md).[`ip`](HashIpPortEntry.md#ip)

***

### packets?

> `optional` **packets**: `number`

If counter is enabled for the ipset

#### Inherited from

[`CommonEntryOptions`](CommonEntryOptions.md).[`packets`](CommonEntryOptions.md#packets)

***

### port

> **port**: `string`

#### Inherited from

[`HashIpPortEntry`](HashIpPortEntry.md).[`port`](HashIpPortEntry.md#port)

***

### protocol?

> `optional` **protocol**: `string`

proto only needs to be specified if a service name is used and that name does not exist as a TCP service. The protocol is never stored in the set, just the port number of the service.

#### Inherited from

[`HashIpPortEntry`](HashIpPortEntry.md).[`protocol`](HashIpPortEntry.md#protocol)

***

### skbmark?

> `optional` **skbmark**: `string`

#### Inherited from

[`CommonEntryOptions`](CommonEntryOptions.md).[`skbmark`](CommonEntryOptions.md#skbmark)

***

### skbprio?

> `optional` **skbprio**: `string`

#### Inherited from

[`CommonEntryOptions`](CommonEntryOptions.md).[`skbprio`](CommonEntryOptions.md#skbprio)

***

### skbqueue?

> `optional` **skbqueue**: `string`

#### Inherited from

[`CommonEntryOptions`](CommonEntryOptions.md).[`skbqueue`](CommonEntryOptions.md#skbqueue)

***

### timeout?

> `optional` **timeout**: `number`

#### Inherited from

[`CommonEntryOptions`](CommonEntryOptions.md).[`timeout`](CommonEntryOptions.md#timeout)
