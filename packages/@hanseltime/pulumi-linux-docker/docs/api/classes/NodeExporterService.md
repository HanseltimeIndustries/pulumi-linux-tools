[**@hanseltime/pulumi-linux-docker**](../README.md)

***

[@hanseltime/pulumi-linux-docker](../README.md) / NodeExporterService

# Class: NodeExporterService

Creates a DockerComposeService with prometheus node-exported configured to monitor the portions
of your linux system that you have mounted.

Note - this is just an opinionated way to do this.  If you want more flexibility to do this, go ahead
and make your own DockerComposeService (using whatever config from this you want.)

Important - note that this service is privileged since it mounts the expected systems
in order to monitor all things like network interfaces, etc. and it attaches directly to the host network
for network monitoring.

## Extends

- [`DockerComposeService`](DockerComposeService.md)

## Constructors

### Constructor

> **new NodeExporterService**(`name`, `args`, `options?`): `NodeExporterService`

#### Parameters

##### name

`string`

##### args

`NodeExporterServiceArgs`

##### options?

`ComponentResourceOptions`

#### Returns

`NodeExporterService`

#### Overrides

[`DockerComposeService`](DockerComposeService.md).[`constructor`](DockerComposeService.md#constructor)

## Properties

### createdNetworks

> **createdNetworks**: `Output`\<\{[`composeNetworkName`: `string`]: `string`; \}\>

This allows you to look up full network names from what you specified as something like:

myNetwork: <network properties>

If you did not supply a network, there will be a 'default' network that is resolved for you.

#### Inherited from

[`DockerComposeService`](DockerComposeService.md).[`createdNetworks`](DockerComposeService.md#creatednetworks)

***

### fullServiceName

> **fullServiceName**: `Output`\<`string`\>

This is the full service name which is <compose name>-<service>.  This is helpful for any docker
related look ups that require the full compose name.

#### Inherited from

[`DockerComposeService`](DockerComposeService.md).[`fullServiceName`](DockerComposeService.md#fullservicename)

***

### last

> **last**: `Input`\<`Resource`\>

The last child that should be dependedOn

#### Inherited from

[`DockerComposeService`](DockerComposeService.md).[`last`](DockerComposeService.md#last)

***

### serviceName

> **serviceName**: `Output`\<`string`\>

Just the serviceName

#### Inherited from

[`DockerComposeService`](DockerComposeService.md).[`serviceName`](DockerComposeService.md#servicename)

***

### urn

> `readonly` **urn**: `Output`\<`string`\>

The stable logical URN used to distinctly address a resource, both before
and after deployments.

#### Inherited from

[`DockerComposeService`](DockerComposeService.md).[`urn`](DockerComposeService.md#urn)

## Methods

### getData()

> `protected` **getData**(): `Promise`\<`any`\>

Retrieves the data produces by [initialize](#initialize). The data is
immediately available in a derived class's constructor after the
`super(...)` call to `ComponentResource`.

#### Returns

`Promise`\<`any`\>

#### Inherited from

[`DockerComposeService`](DockerComposeService.md).[`getData`](DockerComposeService.md#getdata)

***

### getExecCommand()

> **getExecCommand**(`shell`, `command`, `podNumber`): `Output`\<`string`\>

Returns a docker exec command for the command supplied

#### Parameters

##### shell

`string`

The shell that you would normally run docker exec -it <container> <shell> with

##### command

`string`

##### podNumber

`number` = `1`

#### Returns

`Output`\<`string`\>

#### Inherited from

[`DockerComposeService`](DockerComposeService.md).[`getExecCommand`](DockerComposeService.md#getexeccommand)

***

### getMaxWaitTimeSeconds()

> **getMaxWaitTimeSeconds**(`healthcheck`): `Promise`\<`number`\>

#### Parameters

##### healthcheck

\{ `disable?`: `Input`\<`Input`\<`string`\> \| `Input`\<`undefined`\> \| `Input`\<`false`\> \| `Input`\<`true`\>\>; `interval?`: `Input`\<`Input`\<`string`\> \| `Input`\<`undefined`\>\>; `retries?`: `Input`\<`Input`\<`string`\> \| `Input`\<`number`\> \| `Input`\<`undefined`\>\>; `start_interval?`: `Input`\<`Input`\<`string`\> \| `Input`\<`undefined`\>\>; `start_period?`: `Input`\<`Input`\<`string`\> \| `Input`\<`undefined`\>\>; `test`: `Input`\<`Input`\<`string`\> \| `Input`\<`undefined`\> \| `Input`\<`Input`\<`string`\>[]\>\>; `timeout?`: `Input`\<`Input`\<`string`\> \| `Input`\<`undefined`\>\>; \} | `"NO_SHELL"`

#### Returns

`Promise`\<`number`\>

-1 if the healthcheck is no shell

#### Inherited from

[`DockerComposeService`](DockerComposeService.md).[`getMaxWaitTimeSeconds`](DockerComposeService.md#getmaxwaittimeseconds)

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

[`DockerComposeService`](DockerComposeService.md).[`getProvider`](DockerComposeService.md#getprovider)

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

[`DockerComposeService`](DockerComposeService.md).[`initialize`](DockerComposeService.md#initialize)

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

[`DockerComposeService`](DockerComposeService.md).[`registerOutputs`](DockerComposeService.md#registeroutputs)

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

[`DockerComposeService`](DockerComposeService.md).[`isInstance`](DockerComposeService.md#isinstance)
