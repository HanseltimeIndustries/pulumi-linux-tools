[**@hanseltime/traefik**](../README.md)

***

[@hanseltime/traefik](../README.md) / TraefikRouteRule

# Class: TraefikRouteRule

Simple container class with static methods to create Traefik routing rules

## Constructors

### Constructor

> **new TraefikRouteRule**(): `TraefikRouteRule`

#### Returns

`TraefikRouteRule`

## Methods

### and()

> `static` **and**(`rules`): `object`

#### Parameters

##### rules

([`BuiltRules`](../type-aliases/BuiltRules.md) \| [`Condition`](../type-aliases/Condition.md))[]

#### Returns

`object`

##### rules

> **rules**: ([`BuiltRules`](../type-aliases/BuiltRules.md) \| [`Condition`](../type-aliases/Condition.md))[]

##### type

> **type**: [`RuleCond`](../enumerations/RuleCond.md) = `RuleCond.Or`

***

### clientIP()

> `static` **clientIP**(`ip`, `not?`): `object`

#### Parameters

##### ip

`string`

##### not?

[`Not`](../enumerations/TraefikRuleOp.md#not)

#### Returns

`object`

##### rule

> **rule**: [`ClientIpRule`](../interfaces/ClientIpRule.md)

##### type

> **type**: [`RuleType`](../enumerations/RuleType.md) = `RuleType.ClientIP`

***

### header()

> `static` **header**(`header`, `value`, `not?`): `object`

#### Parameters

##### header

`string`

##### value

`string`

##### not?

[`Not`](../enumerations/TraefikRuleOp.md#not)

#### Returns

`object`

##### rule

> **rule**: [`HeaderRule`](../interfaces/HeaderRule.md)

##### type

> **type**: [`RuleType`](../enumerations/RuleType.md) = `RuleType.Header`

***

### headerRegexp()

> `static` **headerRegexp**(`header`, `value`, `not?`): `object`

#### Parameters

##### header

`string`

##### value

`RegExp`

##### not?

[`Not`](../enumerations/TraefikRuleOp.md#not)

#### Returns

`object`

##### rule

> **rule**: [`HeaderRegexpRule`](../interfaces/HeaderRegexpRule.md)

##### type

> **type**: [`RuleType`](../enumerations/RuleType.md) = `RuleType.HeaderRegexp`

***

### host()

> `static` **host**(`domain`, `not?`): `object`

#### Parameters

##### domain

`string`

##### not?

[`Not`](../enumerations/TraefikRuleOp.md#not)

#### Returns

`object`

##### rule

> **rule**: [`HostRule`](../interfaces/HostRule.md)

##### type

> **type**: [`RuleType`](../enumerations/RuleType.md) = `RuleType.Host`

***

### hostRegexp()

> `static` **hostRegexp**(`domain`, `not?`): `object`

#### Parameters

##### domain

`RegExp`

##### not?

[`Not`](../enumerations/TraefikRuleOp.md#not)

#### Returns

`object`

##### rule

> **rule**: [`HostRegexpRule`](../interfaces/HostRegexpRule.md)

##### type

> **type**: [`RuleType`](../enumerations/RuleType.md) = `RuleType.HostRegexp`

***

### method()

> `static` **method**(`method`, `not?`): `object`

#### Parameters

##### method

`string`

##### not?

[`Not`](../enumerations/TraefikRuleOp.md#not)

#### Returns

`object`

##### rule

> **rule**: [`MethodRule`](../interfaces/MethodRule.md)

##### type

> **type**: [`RuleType`](../enumerations/RuleType.md) = `RuleType.Method`

***

### or()

> `static` **or**(`rules`): `object`

Conditionals

#### Parameters

##### rules

([`BuiltRules`](../type-aliases/BuiltRules.md) \| [`Condition`](../type-aliases/Condition.md))[]

#### Returns

`object`

##### rules

> **rules**: ([`BuiltRules`](../type-aliases/BuiltRules.md) \| [`Condition`](../type-aliases/Condition.md))[]

##### type

> **type**: [`RuleCond`](../enumerations/RuleCond.md) = `RuleCond.And`

***

### path()

> `static` **path**(`path`, `not?`): `object`

#### Parameters

##### path

`string`

##### not?

[`Not`](../enumerations/TraefikRuleOp.md#not)

#### Returns

`object`

##### rule

> **rule**: [`PathRule`](../interfaces/PathRule.md)

##### type

> **type**: [`RuleType`](../enumerations/RuleType.md) = `RuleType.Path`

***

### pathPrefix()

> `static` **pathPrefix**(`prefix`, `not?`): `object`

#### Parameters

##### prefix

`string`

##### not?

[`Not`](../enumerations/TraefikRuleOp.md#not)

#### Returns

`object`

##### rule

> **rule**: [`PathPrefixRule`](../interfaces/PathPrefixRule.md)

##### type

> **type**: [`PathPrefix`](../enumerations/RuleType.md#pathprefix)

***

### pathRegexp()

> `static` **pathRegexp**(`path`, `not?`): `object`

#### Parameters

##### path

`RegExp`

##### not?

[`Not`](../enumerations/TraefikRuleOp.md#not)

#### Returns

`object`

##### rule

> **rule**: [`PathRegexpRule`](../interfaces/PathRegexpRule.md)

##### type

> **type**: [`RuleType`](../enumerations/RuleType.md) = `RuleType.PathRegexp`

***

### query()

> `static` **query**(`key`, `value`, `not?`): `object`

#### Parameters

##### key

`string`

##### value

`string`

##### not?

[`Not`](../enumerations/TraefikRuleOp.md#not)

#### Returns

`object`

##### rule

> **rule**: [`QueryRule`](../interfaces/QueryRule.md)

##### type

> **type**: [`RuleType`](../enumerations/RuleType.md) = `RuleType.Query`

***

### queryRegexp()

> `static` **queryRegexp**(`key`, `value`, `not?`): `object`

#### Parameters

##### key

`string`

##### value

`RegExp`

##### not?

[`Not`](../enumerations/TraefikRuleOp.md#not)

#### Returns

`object`

##### rule

> **rule**: [`QueryRegexpRule`](../interfaces/QueryRegexpRule.md)

##### type

> **type**: [`RuleType`](../enumerations/RuleType.md) = `RuleType.QueryRegexp`
