[**@hanseltime/pulumi-linux-base**](../README.md)

***

[@hanseltime/pulumi-linux-base](../README.md) / StrictACL

# Class: StrictACL

Represents an ACL on a directory path that is ONLY the permissions provided
and then default perms to all others

## Constructors

### Constructor

> **new StrictACL**(`path`, `permissions`, `others`): `StrictACL`

#### Parameters

##### path

`string`

##### permissions

[`PermissionObject`](../interfaces/PermissionObject.md)[]

##### others

`"read"` | `"none"`

#### Returns

`StrictACL`

## Properties

### others

> **others**: `"read"` \| `"none"`

***

### path

> **path**: `string`

***

### permissions

> **permissions**: [`PermissionObject`](../interfaces/PermissionObject.md)[]

## Methods

### insertCommand()

> **insertCommand**(): `string`

This creates a command that will not clean up any different ACLs but insert it.

This is meant for appending changes while two different applications are running
that may require different permissions

#### Returns

`string`

***

### removeCommand()

> **removeCommand**(): `string`

#### Returns

`string`

***

### setCommand()

> **setCommand**(): `string`

This createa a command that will fully replace the ACLs on the path.

This should be done after stopping any previous applications that need it

IMPORTANT - we set the user, and group to rwx, because we expect that chmod has restricted those

#### Returns

`string`
