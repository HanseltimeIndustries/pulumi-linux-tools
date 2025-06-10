[**@hanseltime/pulumi-utils**](../README.md)

***

[@hanseltime/pulumi-utils](../README.md) / OutputDependency

# Class: OutputDependency\<Cat\>

This is a resource implementation for outputs that might need to resolve a value from a previous resource before
going onto other resources.

An example of this would be performing a validation check on some resource before creating another resource.
This is ideal if you're trying to verify something that an API call only creates after starting but before having more
resources set up that would need to be removed if that thing wasn't there.

You can do so via:

const check = new OutputDependency('uniqueName', {
   output: someResource.name.apply((n) => {
     if (n.startsWith('badPrefix')) {
         // Return an error that we will throw when this resource runs
         return throw new Error(`Cannot work with badPrefix name: ${n}`)
     }
   })
})

new MyResource('name', args, {
  dependsOn: [
     check,
  ]
})

Or you can add a category that you can require in the dependsOn wrapper!  Note, there are some caveats
here where you will have to ensure that you do not add new resources to the category after creating a dependency
since the use of constructors (and pulumi's underlying grpc server backend means that we can't lazily add dependencies).

const MyResourceWrapped = OutputDependency.dependsOn(MyResource, ['categoryA'])

const new MyResourceWrapped('name', args, {
  dependsOn: [
     check,
  ]
})

## Extends

- `ComponentResource`

## Type Parameters

### Cat

`Cat` *extends* `string` = `string`

## Constructors

### Constructor

> **new OutputDependency**\<`Cat`\>(`name`, `props`, `opts?`): `OutputDependency`\<`Cat`\>

#### Parameters

##### name

`string`

##### props

`OutputDependencyArgs`\<`Cat`\>

##### opts?

`ComponentResourceOptions`

#### Returns

`OutputDependency`\<`Cat`\>

#### Overrides

`pulumi.ComponentResource.constructor`

## Properties

### urn

> `readonly` **urn**: `Output`\<`string`\>

The stable logical URN used to distinctly address a resource, both before
and after deployments.

#### Inherited from

`pulumi.ComponentResource.urn`

***

### categoryClaims

> `readonly` `static` **categoryClaims**: `Map`\<`string`, `string`[]\>

A record of the tokens of ('Class:name') instances that have claim dependency on the categories

This is used to makes sure that we are ONLY claiming categories after that category has been fully created.

***

### dependencyCategories

> `readonly` `static` **dependencyCategories**: `Map`\<`string`, `OutputDependency`\<`string`\>[]\>

***

### wrapMap

> `readonly` `static` **wrapMap**: `Map`\<`PulumiResource`\<`any`\>, `object`[]\>

Map of type signature classes to the wrapped classes.  This ensures we don't just create
a bunch of non-comparable instance types

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

### dependsOn()

> `static` **dependsOn**\<`T`, `I`, `O`\>(`cls`, `categories`): `PulumiResource`\<`any`\> \| \{(`name`, `inputs`, `opts`): `void`; `prototype`: `any`; \}

#### Type Parameters

##### T

`T`

##### I

`I` *extends* `Inputs`

##### O

`O` *extends* `CustomResourceOptions`

#### Parameters

##### cls

(`name`, `inputs`, `opts`) => `T`

##### categories

`string`[]

#### Returns

`PulumiResource`\<`any`\> \| \{(`name`, `inputs`, `opts`): `void`; `prototype`: `any`; \}

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
