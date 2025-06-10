[**@hanseltime/pulumi-linux**](../README.md)

***

[@hanseltime/pulumi-linux](../README.md) / SudoCopyToRemote

# Class: SudoCopyToRemote

If you are copying to a root location or another user's directory, this exists to use a non-root user that
can sudo (i.e. an automation user).

This does end up using 3 compound resources... which is unfortunate but in essence it does:

1. Create a tmp directory for the automation user to copy to
2. Copy to the tmp directory
3. (sudo) Move file in the tmp directory to the target location and then remove the tmp directory

## Extends

- `ComponentResource`

## Constructors

### Constructor

> **new SudoCopyToRemote**(`name`, `args`, `opts`): `SudoCopyToRemote`

#### Parameters

##### name

`string`

##### args

[`SudoCopyToRemoteArgs`](../interfaces/SudoCopyToRemoteArgs.md)

##### opts

`ComponentResourceOptions`

#### Returns

`SudoCopyToRemote`

#### Overrides

`pulumi.ComponentResource.constructor`

## Properties

### connection

> `readonly` **connection**: `Output`\<`Connection`\>

***

### remotePath

> `readonly` **remotePath**: `Output`\<`string`\>

The destination path on the remote host. The last element of the path will be created if it doesn't exist but it's an error when additional elements don't exist. When the remote path is an existing directory, the source file or directory will be copied into that directory. When the source is a file and the remote path is an existing file, that file will be overwritten. When the source is a directory and the remote path an existing file, the copy will fail.

***

### source

> `readonly` **source**: `Output`\<`Asset` \| `Archive`\>

An [asset or an archive](https://www.pulumi.com/docs/concepts/assets-archives/) to upload as the source of the copy. It must be path-based, i.e., be a `FileAsset` or a `FileArchive`. The item will be copied as-is; archives like .tgz will not be unpacked. Directories are copied recursively, overwriting existing files.

***

### triggers

> `readonly` **triggers**: `Output`\<`undefined` \| `any`[]\>

Trigger replacements on changes to this input.

***

### urn

> `readonly` **urn**: `Output`\<`string`\>

The stable logical URN used to distinctly address a resource, both before
and after deployments.

#### Inherited from

`pulumi.ComponentResource.urn`

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
