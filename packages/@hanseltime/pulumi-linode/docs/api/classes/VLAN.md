[**@hanseltime/pulumi-linode**](../README.md)

***

[@hanseltime/pulumi-linode](../README.md) / VLAN

# Class: VLAN

Helper Class to declare and track a VLAN programmatically.

You can use the getInterfaceEntry() method to create a Linode interface entry
with the appropriate VLAN properties.  It will also keep track of any overlapped IP addresses
on the network

## Extends

- `Network`

## Constructors

### Constructor

> **new VLAN**(`name`, `cidr`): `VLAN`

#### Parameters

##### name

`string`

##### cidr

`string`

#### Returns

`VLAN`

#### Inherited from

`Network.constructor`

## Properties

### cidr

> `readonly` **cidr**: `string`

#### Inherited from

`Network.cidr`

***

### endIP

> `readonly` **endIP**: `string`

#### Inherited from

`Network.endIP`

***

### maskNumber

> `readonly` **maskNumber**: `string`

#### Inherited from

`Network.maskNumber`

***

### name

> `readonly` **name**: `string`

#### Inherited from

`Network.name`

***

### startIP

> `readonly` **startIP**: `string`

#### Inherited from

`Network.startIP`

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

#### Inherited from

`Network.claimIP`

***

### getInterfaceEntry()

> **getInterfaceEntry**(`ipAddress`): `object`

#### Parameters

##### ipAddress

`string`

#### Returns

`object`

##### ipamAddress

> **ipamAddress**: `string`

##### label

> **label**: `string`

##### purpose

> **purpose**: `string` = `"vlan"`
