[**@hanseltime/pulumi-linux-docker**](../README.md)

***

[@hanseltime/pulumi-linux-docker](../README.md) / DefaultInternalNetworkRange

# Class: DefaultInternalNetworkRange

Little helper class to make it easier to get a cidr for your services - cannot do validation

## Constructors

### Constructor

> **new DefaultInternalNetworkRange**(): `DefaultInternalNetworkRange`

#### Returns

`DefaultInternalNetworkRange`

## Properties

### WHOLE\_RANGE

> `static` **WHOLE\_RANGE**: `string`

## Methods

### get\_24CIDR()

> `static` **get\_24CIDR**(`n`): `string`

Returns a /24 CIDR 256 IPs incremented up from the base 172.255.0.0

#### Parameters

##### n

`number`

#### Returns

`string`
