[**@hanseltime/pulumi-linux-iptables**](../README.md)

***

[@hanseltime/pulumi-linux-iptables](../README.md) / IpTablesChain

# Class: IpTablesChain

This represents an entire iptables chain (in ipv6 and ipv4 to avoid chain name collisions long term), since tracking and replacing that chain requires us to know everything that's there so we can remove other pieces
we have to store things at the chain level.

This does mean that all your iptables rules have to be in the same project and applied via this one resource for a chain.  It is up to you to order chains
in such a way that targets for rules are applied after

If you have multiple chains that are cross-targeting each other, you can use IpTablesChains so that we ensure all chains are created before referencing

## Extends

- `ComponentResource`

## Implements

- `ChangeSignature`

## Constructors

### Constructor

> **new IpTablesChain**(`name`, `args`, `opts?`): `IpTablesChain`

#### Parameters

##### name

`string`

##### args

`PropsInputify`\<[`IpTablesChainArgs`](../interfaces/IpTablesChainArgs.md)\> & `object`

##### opts?

`ComponentResourceOptions`

#### Returns

`IpTablesChain`

#### Overrides

`pulumi.ComponentResource.constructor`

## Properties

### chainName

> **chainName**: `Output`\<`string`\>

***

### changeSignature

> **changeSignature**: `Output`\<`string`\>

#### Implementation of

`ChangeSignature.changeSignature`

***

### replaceRulesCommandIpv4

> **replaceRulesCommandIpv4**: `Output`\<`string`\>

***

### replaceRulesCommandIpv6

> **replaceRulesCommandIpv6**: `Output`\<`string`\>

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
