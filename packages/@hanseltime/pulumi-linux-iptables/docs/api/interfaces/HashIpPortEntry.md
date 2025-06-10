[**@hanseltime/pulumi-linux-iptables**](../README.md)

***

[@hanseltime/pulumi-linux-iptables](../README.md) / HashIpPortEntry

# Interface: HashIpPortEntry

## Extends

- [`HashIpEntry`](HashIpEntry.md).[`PortEntry`](PortEntry.md)

## Extended by

- [`HashIpPortEntryAdd`](HashIpPortEntryAdd.md)

## Properties

### ip

> **ip**: `string`

#### Inherited from

[`HashIpEntry`](HashIpEntry.md).[`ip`](HashIpEntry.md#ip)

***

### port

> **port**: `string`

#### Inherited from

[`PortEntry`](PortEntry.md).[`port`](PortEntry.md#port)

***

### protocol?

> `optional` **protocol**: `string`

proto only needs to be specified if a service name is used and that name does not exist as a TCP service. The protocol is never stored in the set, just the port number of the service.

#### Inherited from

[`PortEntry`](PortEntry.md).[`protocol`](PortEntry.md#protocol)
