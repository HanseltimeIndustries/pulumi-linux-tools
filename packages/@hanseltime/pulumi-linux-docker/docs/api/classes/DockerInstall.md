[**@hanseltime/pulumi-linux-docker**](../README.md)

***

[@hanseltime/pulumi-linux-docker](../README.md) / DockerInstall

# Class: DockerInstall

Runs ubuntu docker installation commands from a shell

## Extends

- `ComponentResource`

## Implements

- [`WaitOnChildren`](../interfaces/WaitOnChildren.md)

## Constructors

### Constructor

> **new DockerInstall**(`name`, `args`, `opts?`): `DockerInstall`

#### Parameters

##### name

`string`

##### args

`DockerInstallArgs`

##### opts?

`ComponentResourceOptions`

#### Returns

`DockerInstall`

#### Overrides

`pulumi.ComponentResource.constructor`

## Properties

### blueGreenNetwork

> `readonly` **blueGreenNetwork**: `string`

The full network name for compose services

***

### defaultDockerGatewayIP

> **defaultDockerGatewayIP**: `Output`\<`string`\>

The expected network ip of the default docker gateway (that things like mounting the host-gateway will involve)

Note: if you have a very exotic network setup, this only infers from daemon.json and may be wrong.

***

### defaultInternalNetworkRange

> **defaultInternalNetworkRange**: `Network`

***

### dockerUserIpTablesChain

> **dockerUserIpTablesChain**: `IpTablesChain`

The iptables chain that this install controls

***

### last

> **last**: `Input`\<`Resource`\>

The last child that should be dependedOn

#### Implementation of

[`WaitOnChildren`](../interfaces/WaitOnChildren.md).[`last`](../interfaces/WaitOnChildren.md#last)

***

### urn

> `readonly` **urn**: `Output`\<`string`\>

The stable logical URN used to distinctly address a resource, both before
and after deployments.

#### Inherited from

`pulumi.ComponentResource.urn`

***

### usernsRemap

> **usernsRemap**: `Output`\<\{ `length`: `number`; `start`: `number`; \}\>

This specifies the start id and length of all ids supported in the namespace that docker remaps to.

It is recommended that you export this fromm your stack if using distributed stacks for your other
DockerComposeServices to reference since we need to calculate user permissions for any mounted volumes.

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
