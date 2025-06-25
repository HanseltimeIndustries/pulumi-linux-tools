[**@hanseltime/pulumi-linux-iptables**](../README.md)

***

[@hanseltime/pulumi-linux-iptables](../README.md) / PredefinedRules

# Class: PredefinedRules

Simple Helper class with static methods to generate rules that are common

## Constructors

### Constructor

> **new PredefinedRules**(): `PredefinedRules`

#### Returns

`PredefinedRules`

## Methods

### onlyEgress()

> `static` **onlyEgress**(`options`): ([`IpV4TablesRule`](../interfaces/IpV4TablesRule.md) \| [`IpV6TablesRule`](../interfaces/IpV6TablesRule.md))[]

This creates a ruleset that would match IpTablesChain ordering (i.e. first rule is evaluated first)
that will only allow egress connectionns on the network interface specified and will allow certain
ports to connect externally (important for SSH)

#### Parameters

##### options

###### exceptionPorts

`object`[]

A list of ports that are still allowed to connect from the outside

For instance, the :22 for SSH

###### interface

`string`

The interface to apply these rejections to

#### Returns

([`IpV4TablesRule`](../interfaces/IpV4TablesRule.md) \| [`IpV6TablesRule`](../interfaces/IpV6TablesRule.md))[]
