[**@hanseltime/pulumi-linode**](../README.md)

***

[@hanseltime/pulumi-linode](../README.md) / VLAN

# Class: VLAN

Helper Class to declare and track a VLAN programmatically.

You can use the getInterfaceEntry() method to create a Linode interface entry
with the appropriate VLAN propeerties.  It will also keep track of any overlapped IP addresses
on the network

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
