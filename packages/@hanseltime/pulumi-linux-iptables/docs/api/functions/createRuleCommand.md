[**@hanseltime/pulumi-linux-iptables**](../README.md)

***

[@hanseltime/pulumi-linux-iptables](../README.md) / createRuleCommand

# Function: createRuleCommand()

> **createRuleCommand**(`options`): `string`

Creates an iptables command to insert/append a rule and (optionally, will only add the rule if it does not exist)

This is a good escape hatch if you need to insert iptables rules into something without controlling the whole chain.
As an explicit example, this can be used by a wireguard server to ensure that we add iptables rules but also don't
if say, the rule was persisted and already exists.

## Parameters

### options

#### chain

`string`

The chain within that table that we are inserting into

#### family

[`IPFamily`](../type-aliases/IPFamily.md)

Where this rule is meant to be ipv6 or ipv4

#### onlyIfMissing

`boolean`

Will only apply the rule if it is not already within the chain

#### operator

`"insert"` \| `"append"` \| `"delete"`

The method to perform the insert

#### rule

[`IpV4TablesRule`](../interfaces/IpV4TablesRule.md) \| [`IpV6TablesRule`](../interfaces/IpV6TablesRule.md)

The specific rule that you would like to add

#### table

`string`

The iptables table to apply this to

## Returns

`string`
