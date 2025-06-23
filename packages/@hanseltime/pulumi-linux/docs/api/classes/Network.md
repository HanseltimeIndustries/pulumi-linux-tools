[**@hanseltime/pulumi-linux**](../README.md)

***

[@hanseltime/pulumi-linux](../README.md) / Network

# Class: Network

Helper Class to declare and track a Network like a LAN or VLAN programmatically that has defined
range

## Constructors

### Constructor

> **new Network**(`name`, `cidr`): `Network`

#### Parameters

##### name

`string`

##### cidr

`string`

#### Returns

`Network`

## Properties

### cidr

> `readonly` **cidr**: `string`

***

### endIP

> `readonly` **endIP**: `string`

***

### maskNumber

> `readonly` **maskNumber**: `string`

***

### name

> `readonly` **name**: `string`

***

### startIP

> `readonly` **startIP**: `string`

## Methods

### claimIP()

> **claimIP**(`ipAddress`, `name`): `void`

Use this to claim the ipAddress within the network

#### Parameters

##### ipAddress

`string`

the ipaddress string to claim

##### name

`string`

a readable name to identify which machine/interface is claiming this ip (for troubleshooting messages)

#### Returns

`void`
