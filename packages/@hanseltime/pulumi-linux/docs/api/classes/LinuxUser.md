[**@hanseltime/pulumi-linux**](../README.md)

***

[@hanseltime/pulumi-linux](../README.md) / LinuxUser

# Class: LinuxUser

A user that is added to the linux machine after the fact

## Extends

- `ComponentResource`

## Constructors

### Constructor

> **new LinuxUser**(`name`, `args`, `opts?`): `LinuxUser`

#### Parameters

##### name

`string`

##### args

###### canEditOwnSSH?

`boolean`

If the user should be allowed to edit their own .ssh folder.  In general, if you are
creating a user on a remote machine for someone to SSH into, you probably want the root
user to perform edits on the folder so that someone cannot get access to their .ssh and then
add additional keys, etc. as a back door.

###### connection

`Input`\<`ConnectionArgs`\>

The connection information to the root/automation user that can assume sudo
without a password

###### groups

`Input`\<`Input`\<`string`\>[]\>

###### name

`Input`\<`string`\>

###### password

`Input`\<`string`\>

A pulumi secret that will be used as the exact password

###### passwordlessSudo?

`boolean`

This should only be added for a trustworthy automation script user since this means
the user does not need to enter their password to run sudo.

###### userHomeFolders?

`string`[]

If there are folders you would like to already have set up from the user root

##### opts?

`ComponentResourceOptions`

#### Returns

`LinuxUser`

#### Overrides

`pulumi.ComponentResource.constructor`

## Properties

### homeDir

> **homeDir**: `Output`\<`string`\>

***

### urn

> `readonly` **urn**: `Output`\<`string`\>

The stable logical URN used to distinctly address a resource, both before
and after deployments.

#### Inherited from

`pulumi.ComponentResource.urn`

***

### userName

> **userName**: `Output`\<`string`\>

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
