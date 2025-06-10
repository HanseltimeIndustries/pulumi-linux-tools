[**@hanseltime/pulumi-linux-iptables**](../README.md)

***

[@hanseltime/pulumi-linux-iptables](../README.md) / IpV4TablesRule

# Interface: IpV4TablesRule

Describes an iptables rule that would be written via tha iptables command

## Extends

- `CommonIpTablesRule`\<[`InvertableIpV4TablesProps`](InvertableIpV4TablesProps.md)\>

## Properties

### destination?

> `optional` **destination**: `string`

Destination specification. See the description of the -s (source) flag for a detailed description of the syntax. The flag --dst is an alias for this option.

#### Inherited from

`CommonIpTablesRule.destination`

***

### destinationPorts?

> `optional` **destinationPorts**: `number` \| \[`number`, `number`\]

The ports that are being pointed to or a range of ports that are being pointed to

Important - note that you will need to have a protocol that supports dports
https://ipset.netfilter.org/iptables-extensions.man.html

#### Inherited from

`CommonIpTablesRule.destinationPorts`

***

### fragment?

> `optional` **fragment**: `boolean`

This means that the rule only refers to second and further fragments of fragmented packets. Since there is no way to tell the source or destination ports of such a packet (or ICMP type), such a packet will not match any rules which specify them. When the "!" argument precedes the "-f" flag, the rule will only match head fragments, or unfragmented packets.

IPV4 Only

#### Inherited from

`CommonIpTablesRule.fragment`

***

### goto?

> `optional` **goto**: `string`

-g, --goto chain
This specifies that the processing should continue in a user specified chain. Unlike the --jump option return will not continue processing in this chain but instead in the chain that called us via --jump.

IPV4 only

#### Overrides

`CommonIpTablesRule.goto`

***

### inInterface?

> `optional` **inInterface**: `string`

Name of an interface via which a packet was received (only for packets entering the INPUT, FORWARD and PREROUTING chains). When the "!" argument is used before the interface name, the sense is inverted. If the interface name ends in a "+", then any interface which begins with this name will match. If this option is omitted, any interface name will match.

#### Inherited from

`CommonIpTablesRule.inInterface`

***

### jump?

> `optional` **jump**: `string`

This specifies the target of the rule; i.e., what to do if the packet matches it. The target can be a user-defined chain (other than the one this rule is in), one of the special builtin targets which decide the fate of the packet immediately, or an extension (see EXTENSIONS below). If this option is omitted in a rule (and -g is not used), then matching the rule will have no effect on the packet's fate, but the counters on the rule will be incremented.

#### Inherited from

`CommonIpTablesRule.jump`

***

### matchingModule?

> `optional` **matchingModule**: `object`

If you want to use matching extensions, you can supply them here

example:

{
  set: '--match-set AllowedIP src'
}

#### Index Signature

\[`module`: `string`\]: `string`

Consult https://www.man7.org/linux/man-pages/man8/ip6tables.8.html for module extensions and their arguments

You can specify the module and then the entire argument string for that module

#### Inherited from

`CommonIpTablesRule.matchingModule`

***

### not?

> `optional` **not**: [`InvertableIpV4TablesProps`](InvertableIpV4TablesProps.md)

#### Inherited from

`CommonIpTablesRule.not`

***

### outInterface?

> `optional` **outInterface**: `string`

Name of an interface via which a packet is going to be sent (for packets entering the FORWARD, OUTPUT and POSTROUTING chains). When the "!" argument is used before the interface name, the sense is inverted. If the interface name ends in a "+", then any interface which begins with this name will match. If this option is omitted, any interface name will match.

#### Inherited from

`CommonIpTablesRule.outInterface`

***

### protocol?

> `optional` **protocol**: [`IpProtocol`](../type-aliases/IpProtocol.md)

The protocol of the rule or of the packet to check.  The
specified protocol can be one of tcp, udp, udplite, icmp,
icmpv6, esp, ah, sctp, mh or the special keyword "all", or
it can be a numeric value, representing one of these
protocols or a different one.  A protocol name from
/etc/protocols is also allowed.  A "!" argument before the
protocol inverts the test.  The number zero is equivalent
to all. "all" will match with all protocols and is taken as
default when this option is omitted.  Note that, in
ip6tables, IPv6 extension headers except esp are not
allowed.  esp and ipv6-nonext can be used with Kernel
version 2.6.11 or later.  The number zero is equivalent to
all, which means that you cannot test the protocol field
for the value 0 directly. To match on a HBH header, even if
it were the last, you cannot use -p 0, but always need -m
hbh.

#### Inherited from

`CommonIpTablesRule.protocol`

***

### setCounters?

> `optional` **setCounters**: `boolean`

This enables the administrator to initialize the packet and byte counters of a rule (during INSERT, APPEND, REPLACE operations).

#### Inherited from

`CommonIpTablesRule.setCounters`

***

### source?

> `optional` **source**: `string`

Source specification. Address can be either a network name, a hostname (please note that specifying any name to be resolved with a remote query such as DNS is a really bad idea), a network IP address (with /mask), or a plain IP address. The mask can be either a network mask or a plain number, specifying the number of 1's at the left side of the network mask. Thus, a mask of 24 is equivalent to 255.255.255.0. A "!" argument before the address specification inverts the sense of the address. The flag --src is an alias for this option.

#### Inherited from

`CommonIpTablesRule.source`

***

### sourcePorts?

> `optional` **sourcePorts**: `number` \| \[`number`, `number`\]

The ports that are being come from or a range of ports that are being pointed to

Important - note that you will need to have a protocol that supports sports
https://ipset.netfilter.org/iptables-extensions.man.html

#### Inherited from

`CommonIpTablesRule.sourcePorts`
