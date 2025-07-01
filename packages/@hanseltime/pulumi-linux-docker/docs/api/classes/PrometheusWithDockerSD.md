[**@hanseltime/pulumi-linux-docker**](../README.md)

***

[@hanseltime/pulumi-linux-docker](../README.md) / PrometheusWithDockerSD

# Class: PrometheusWithDockerSD

Creates a DockerComposeService with prometheus setup with an automatic service discovery on the local docker socket.

This is meant to provide a safe (internal only) docker socket proxy for your prometheus instance to scrape from.

IMPORTANT! Prometheus is a data storage application and if you run it on the same machine, you will need to be aware
of storage/cpu/memory constraints and how they may impact your other docker applications.

If you do not want to have that risk, running prometheus on another machine and using an OpenTelemetryCollector may
be more desirable since collectors are just pipelines.

TODO: standardize a way to skip services that are on internal networks or not connected aside from just requiring
a prometheus.io/scrape label

## Extends

- [`PrometheusService`](PrometheusService.md)

## Constructors

### Constructor

> **new PrometheusWithDockerSD**(`name`, `args`, `options?`): `PrometheusWithDockerSD`

#### Parameters

##### name

`string`

##### args

[`PrometheusWithDockerSDArgs`](../interfaces/PrometheusWithDockerSDArgs.md)

##### options?

`ComponentResourceOptions`

#### Returns

`PrometheusWithDockerSD`

#### Overrides

[`PrometheusService`](PrometheusService.md).[`constructor`](PrometheusService.md#constructor)

## Properties

### createdNetworks

> **createdNetworks**: `Output`\<\{[`composeNetworkName`: `string`]: `string`; \}\>

This allows you to look up full network names from what you specified as something like:

myNetwork: <network properties>

If you did not supply a network, there will be a 'default' network that is resolved for you.

#### Inherited from

[`PrometheusService`](PrometheusService.md).[`createdNetworks`](PrometheusService.md#creatednetworks)

***

### fullServiceName

> **fullServiceName**: `Output`\<`string`\>

This is the full service name which is <compose name>-<service>.  This is helpful for any docker
related look ups that require the full compose name.

#### Inherited from

[`PrometheusService`](PrometheusService.md).[`fullServiceName`](PrometheusService.md#fullservicename)

***

### last

> **last**: `Input`\<`Resource`\>

The last child that should be dependedOn

#### Inherited from

[`PrometheusService`](PrometheusService.md).[`last`](PrometheusService.md#last)

***

### monitoringNetwork

> **monitoringNetwork**: `Output`\<`string`\>

The network name that this is on - ease of use for adding the network
to other services

#### Inherited from

[`PrometheusService`](PrometheusService.md).[`monitoringNetwork`](PrometheusService.md#monitoringnetwork)

***

### port

> **port**: `Output`\<`string`\>

The port that this prometheus is exposed on

#### Inherited from

[`PrometheusService`](PrometheusService.md).[`port`](PrometheusService.md#port)

***

### privatePort

> **privatePort**: `Output`\<`string`\>

This is the port that prometheus is locally exposed on.  This is accessible within compose networks

#### Inherited from

[`PrometheusService`](PrometheusService.md).[`privatePort`](PrometheusService.md#privateport)

***

### serviceName

> **serviceName**: `Output`\<`string`\>

Just the serviceName

#### Inherited from

[`PrometheusService`](PrometheusService.md).[`serviceName`](PrometheusService.md#servicename)

***

### urn

> `readonly` **urn**: `Output`\<`string`\>

The stable logical URN used to distinctly address a resource, both before
and after deployments.

#### Inherited from

[`PrometheusService`](PrometheusService.md).[`urn`](PrometheusService.md#urn)

## Methods

### getData()

> `protected` **getData**(): `Promise`\<`any`\>

Retrieves the data produces by [initialize](#initialize). The data is
immediately available in a derived class's constructor after the
`super(...)` call to `ComponentResource`.

#### Returns

`Promise`\<`any`\>

#### Inherited from

[`PrometheusService`](PrometheusService.md).[`getData`](PrometheusService.md#getdata)

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

[`PrometheusService`](PrometheusService.md).[`getExecCommand`](PrometheusService.md#getexeccommand)

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

[`PrometheusService`](PrometheusService.md).[`getMaxWaitTimeSeconds`](PrometheusService.md#getmaxwaittimeseconds)

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

[`PrometheusService`](PrometheusService.md).[`getProvider`](PrometheusService.md#getprovider)

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

[`PrometheusService`](PrometheusService.md).[`initialize`](PrometheusService.md#initialize)

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

[`PrometheusService`](PrometheusService.md).[`registerOutputs`](PrometheusService.md#registeroutputs)

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

[`PrometheusService`](PrometheusService.md).[`isInstance`](PrometheusService.md#isinstance)
