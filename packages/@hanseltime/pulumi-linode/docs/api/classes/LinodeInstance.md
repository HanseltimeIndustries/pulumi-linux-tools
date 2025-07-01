[**@hanseltime/pulumi-linode**](../README.md)

***

[@hanseltime/pulumi-linode](../README.md) / LinodeInstance

# Class: LinodeInstance

An improved Linode Instance with better arguments so that we can update things on the machine without triggering
reboots, etc.

## Extends

- `ComponentResource`

## Constructors

### Constructor

> **new LinodeInstance**(`name`, `args`, `opts?`): `LinodeInstance`

#### Parameters

##### name

`string`

##### args

`LinodeInstanceArgs`

##### opts?

`ComponentResourceOptions`

#### Returns

`LinodeInstance`

#### Overrides

`pulumi.ComponentResource.constructor`

## Properties

### automationUserConnection

> **automationUserConnection**: `Output`\<`ConnectionArgs`\>

***

### automationUserHomeDir

> **automationUserHomeDir**: `Output`\<`string`\>

This is information for the automation user to use with other pulumi resources that
should be applied via this user

***

### automationUserSudoCopyTmpDir

> **automationUserSudoCopyTmpDir**: `Output`\<`string`\>

***

### instance

> **instance**: `Instance`

***

### urn

> `readonly` **urn**: `Output`\<`string`\>

The stable logical URN used to distinctly address a resource, both before
and after deployments.

#### Inherited from

`pulumi.ComponentResource.urn`

***

### vlanIp

> **vlanIp**: `undefined` \| `Output`\<`string`\>

## Methods

### getData()

> `protected` **getData**(): `Promise`\<`any`\>

Retrieves the data produces by [initialize](#initialize). The data is
immediately available in a derived class's constructor after the
`super(...)` call to `ComponentResource`.

#### Returns

`Promise`\<`any`\>

#### Inherited from

`pulumi.ComponentResource.getData`

***

### getProvider()

> **getProvider**(`moduleMember`): `undefined` \| `ProviderResource`

Returns the provider for the given module member, if one exists.

#### Parameters

##### moduleMember

`string`

#### Returns

`undefined` \| `ProviderResource`

#### Inherited from

`pulumi.ComponentResource.getProvider`

***

### initialize()

> `protected` **initialize**(`args`): `Promise`\<`any`\>

Can be overridden by a subclass to asynchronously initialize data for this component
automatically when constructed. The data will be available immediately for subclass
constructors to use. To access the data use [getData](#getdata).

#### Parameters

##### args

`Inputs`

#### Returns

`Promise`\<`any`\>

#### Inherited from

`pulumi.ComponentResource.initialize`

***

### registerOutputs()

> `protected` **registerOutputs**(`outputs?`): `void`

Registers synthetic outputs that a component has initialized, usually by
allocating other child sub-resources and propagating their resulting
property values.

Component resources can call this at the end of their constructor to
indicate that they are done creating child resources.  This is not
strictly necessary as this will automatically be called after the [initialize](#initialize) method completes.

#### Parameters

##### outputs?

`Inputs` | `Promise`\<`Inputs`\> | `Output`\<`Inputs`\>

#### Returns

`void`

#### Inherited from

`pulumi.ComponentResource.registerOutputs`

***

### isInstance()

> `static` **isInstance**(`obj`): `obj is ComponentResource<any>`

Returns true if the given object is a CustomResource. This is
designed to work even when multiple copies of the Pulumi SDK have been
loaded into the same process.

#### Parameters

##### obj

`any`

#### Returns

`obj is ComponentResource<any>`

#### Inherited from

`pulumi.ComponentResource.isInstance`
