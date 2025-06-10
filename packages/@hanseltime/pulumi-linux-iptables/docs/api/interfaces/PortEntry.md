[**@hanseltime/pulumi-linux-iptables**](../README.md)

***

[@hanseltime/pulumi-linux-iptables](../README.md) / PortEntry

# Interface: PortEntry

## Extended by

- [`BitMapPortEntryAdd`](BitMapPortEntryAdd.md)
- [`HashIpPortEntry`](HashIpPortEntry.md)
- [`HashNetPortEntry`](HashNetPortEntry.md)
- [`HashIpPortIpEntry`](HashIpPortIpEntry.md)
- [`HashIpPortNetEntry`](HashIpPortNetEntry.md)
- [`HashNetPortNetEntry`](HashNetPortNetEntry.md)

## Properties

### port

> **port**: `string`

***

### protocol?

> `optional` **protocol**: `string`

proto only needs to be specified if a service name is used and that name does not exist as a TCP service. The protocol is never stored in the set, just the port number of the service.
