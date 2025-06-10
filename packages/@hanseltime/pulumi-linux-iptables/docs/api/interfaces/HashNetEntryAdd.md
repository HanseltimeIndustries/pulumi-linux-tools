[**@hanseltime/pulumi-linux-iptables**](../README.md)

***

[@hanseltime/pulumi-linux-iptables](../README.md) / HashNetEntryAdd

# Interface: HashNetEntryAdd

If skbinfo is enable for the ipset

## Extends

- [`HashNetEntry`](HashNetEntry.md).[`CommonEntryOptions`](CommonEntryOptions.md)

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

### netaddr

> **netaddr**: `string`

When adding/deleting/testing entries, if the cidr prefix parameter is not specified, then the host prefix value is assumed. When adding/deleting entries, the exact element is added/deleted and overlapping elements are not checked by the kernel. When testing entries, if a host address is tested, then the kernel tries to match the host address in the networks added to the set and reports the result accordingly.
From the set netfilter match point of view the searching for a match always starts from the smallest size of netblock (most specific prefix) to the largest one (least specific prefix) added to the set. When adding/deleting IP addresses to the set by the SET netfilter target, it will be added/deleted by the most specific prefix which can be found in the set, or by the host prefix value if the set is empty.
The lookup time grows linearly with the number of the different prefix values added to the set.

#### Inherited from

[`HashNetEntry`](HashNetEntry.md).[`netaddr`](HashNetEntry.md#netaddr)

***

### nomatch?

> `optional` **nomatch**: `boolean`

***

### packets?

> `optional` **packets**: `number`

If counter is enabled for the ipset

#### Inherited from

[`CommonEntryOptions`](CommonEntryOptions.md).[`packets`](CommonEntryOptions.md#packets)

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
