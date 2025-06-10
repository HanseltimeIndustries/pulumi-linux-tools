[**@hanseltime/pulumi-file-utils**](../README.md)

***

[@hanseltime/pulumi-file-utils](../README.md) / CopyableAsset

# Class: CopyableAsset

Class that simplifies copy commands by allowing for Synthetic assets by writing them to a temporary folder

## Constructors

### Constructor

> **new CopyableAsset**(`id`, `args`): `CopyableAsset`

The id must be unique to all othe resources in the run.  It is used to create temporary directories
for any assets that are synthetic.

#### Parameters

##### id

`string`

##### args

[`CopyableAssetArgs`](../interfaces/CopyableAssetArgs.md)

#### Returns

`CopyableAsset`

## Properties

### copyableSource

> `readonly` **copyableSource**: `Output`\<`Asset` \| `Archive`\>

***

### id

> `readonly` **id**: `string`

***

### ids

> `static` **ids**: `Set`\<`string`\>

## Methods

### assetType()

> **assetType**(`asset`): `AssetTypes`

We have to duck-type since pulumi.output strips class indentification

#### Parameters

##### asset

`Asset` | `Archive`

#### Returns

`AssetTypes`

***

### createChangeDetect()

> **createChangeDetect**(`dir`): `Promise`\<`Buffer`\<`ArrayBufferLike`\>\>

#### Parameters

##### dir

`string`

#### Returns

`Promise`\<`Buffer`\<`ArrayBufferLike`\>\>

***

### calculateUrn()

> `static` **calculateUrn**(`resource`, `post`): `string`

#### Parameters

##### resource

`Resource`

##### post

`string` = `""`

#### Returns

`string`

***

### fromParent()

> `static` **fromParent**(`parent`, `postFix`, `args`): `CopyableAsset`

Generates a resource from a parent resource so that you get a unique id
based on the encapsulating parent.

Note - this is reliant on hidden fields from pulumi since we run into a
loop if we use outputs

#### Parameters

##### parent

`Resource`

the parent resource that we will adapt the urn to

##### postFix

`Input`\<`string`\>

a postfix that will be added

##### args

[`CopyableAssetArgs`](../interfaces/CopyableAssetArgs.md)

#### Returns

`CopyableAsset`
