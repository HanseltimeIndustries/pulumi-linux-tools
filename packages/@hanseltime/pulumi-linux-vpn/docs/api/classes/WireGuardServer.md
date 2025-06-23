[**@hanseltime/pulumi-linux-vpn**](../README.md)

***

[@hanseltime/pulumi-linux-vpn](../README.md) / WireGuardServer

# Class: WireGuardServer

## Extends

- `ComponentResource`

## Constructors

### Constructor

> **new WireGuardServer**(`name`, `args`, `opts?`): `WireGuardServer`

#### Parameters

##### name

`string`

##### args

[`WireGuardServerArgs`](../interfaces/WireGuardServerArgs.md)

##### opts?

`ComponentResourceOptions`

#### Returns

`WireGuardServer`

#### Overrides

`pulumi.ComponentResource.constructor`

## Properties

### ipTablesRules

> `readonly` **ipTablesRules**: `Output`\<\{ `filter`: \{ `forward`: `IpV4TablesRule`[]; \}; `nat`: \{ `postrouting`: `IpV4TablesRule`[]; \}; \}\>

These are iptable rules that can (and should) be added to any IpTablesChain
resources since those resources will rewrite that chain on update and using PostUp
may not be enough in that regard.

***

### peersConfig

> `readonly` **peersConfig**: `Output`\<`object`[]\>

This is the peers configuration option as an output

Use the peer look up methods over this on the wireguard server resource

***

### port

> `readonly` **port**: `OutputInstance`\<`number`\>

The port this server is listening on

***

### publicKey

> `readonly` **publicKey**: `Output`\<`string`\>

The public key of the vpn server - mainly meant to be used so that you can output it from the stack and
use it for construction of wireguard client configurations

***

### urn

> `readonly` **urn**: `Output`\<`string`\>

The stable logical URN used to distinctly address a resource, both before
and after deployments.

#### Inherited from

`pulumi.ComponentResource.urn`

## Methods

### createPublicInternetForwardRoutingRule()

> **createPublicInternetForwardRoutingRule**(`publicInterface`, `wgInterface`): `object`

#### Parameters

##### publicInterface

`string`

##### wgInterface

`string`

#### Returns

`object`

##### down

> **down**: `string`

##### forwardRules

> **forwardRules**: `IpV4TablesRule`[]

##### natRules

> **natRules**: `IpV4TablesRule`[]

##### up

> **up**: `string`

***

### createVlanForwardRoutingRule()

> **createVlanForwardRoutingRule**(`vlanInterface`, `vpnCIDR`, `vlanCIDR`, `wgInterface`): `object`

#### Parameters

##### vlanInterface

`string`

##### vpnCIDR

`string`

##### vlanCIDR

`string`

##### wgInterface

`string`

#### Returns

`object`

##### down

> **down**: `string`

##### forwardRules

> **forwardRules**: `IpV4TablesRule`[]

##### natRules

> **natRules**: `IpV4TablesRule`[]

##### up

> **up**: `string`

***

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

### getPeerAddress()

> **getPeerAddress**(`name`): `Output`\<`string`\>

Simple helper method for getting the allowed IP CIDR from a peer name
that would go in the config as:
[Interface]
Address = <here>

#### Parameters

##### name

`string`

#### Returns

`Output`\<`string`\>

***

### getPeerPreSharedKey()

> **getPeerPreSharedKey**(`name`): `Output`\<`string`\>

Simple helper method for getting the allowed IP CIDR from a peer name
that would go in the config as:
[Peer]
PresharedKey = <here>

#### Parameters

##### name

`string`

#### Returns

`Output`\<`string`\>

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
