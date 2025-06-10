[**@hanseltime/pulumi-linux-docker**](../README.md)

***

[@hanseltime/pulumi-linux-docker](../README.md) / DockerComposeService

# Class: DockerComposeService

A resource that is meant for smaller-scale rolling deployments via docker-compose.

Note: this type of resource and set up pales in comparison to something like k8s.  This exists
      for you to trade off the complexity of understanding K8s for manual triage via SSH and
      a familiarity with docker-compose.  If you anticipate scale, you will ultimately move past
      this set of resources in the long-term.

Each one of these components represents a separate docker compose file with a single
service in it.  This creates a standardized set of folders around the compose file
so that it can be run with updates on a single local machine.

Folder structure:
/<user root>/docker/<service name>/
   compose.yml - maintained by this resource
   mnt/
     <name> - any mounted directories or files you name and provide here
   build/ - the entire build.context archive that you provide (including Dockerfile)

/var/pulumi-docker/.secrets/<service name> - contains secret files that will be mounted into the container

Deployment types:
		TODO -

## Extends

- `ComponentResource`

## Implements

- [`WaitOnChildren`](../interfaces/WaitOnChildren.md)

## Constructors

### Constructor

> **new DockerComposeService**(`name`, `args`, `opts?`): `DockerComposeService`

#### Parameters

##### name

`string`

##### args

[`BuildDockerfileV2Args`](../interfaces/BuildDockerfileV2Args.md)

##### opts?

`ComponentResourceOptions`

#### Returns

`DockerComposeService`

#### Overrides

`pulumi.ComponentResource.constructor`

## Properties

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

### getMaxWaitTimeSeconds()

> **getMaxWaitTimeSeconds**(`healthcheck`): `Promise`\<`number`\>

#### Parameters

##### healthcheck

\{ `disable?`: `Input`\<`Input`\<`string`\> \| `Input`\<`undefined`\> \| `Input`\<`false`\> \| `Input`\<`true`\>\>; `interval?`: `Input`\<`Input`\<`string`\> \| `Input`\<`undefined`\>\>; `retries?`: `Input`\<`Input`\<`string`\> \| `Input`\<`number`\> \| `Input`\<`undefined`\>\>; `start_interval?`: `Input`\<`Input`\<`string`\> \| `Input`\<`undefined`\>\>; `start_period?`: `Input`\<`Input`\<`string`\> \| `Input`\<`undefined`\>\>; `test`: `Input`\<`Input`\<`string`\> \| `Input`\<`undefined`\> \| `Input`\<`Input`\<`string`\>[]\>\>; `timeout?`: `Input`\<`Input`\<`string`\> \| `Input`\<`undefined`\>\>; \} | `"NO_SHELL"`

#### Returns

`Promise`\<`number`\>

-1 if the healthcheck is no shell

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
