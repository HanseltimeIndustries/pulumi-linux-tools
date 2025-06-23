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

the unique id of this asset (has to be unique across all assets created so that we don't
overwrite)

***

### path

> `readonly` **path**: `Output`\<`string`\>

The location where all of the assets are built to or just the path if the base asset was
just a file or directory

***

### tmpChangeDetectDir

> `readonly` **tmpChangeDetectDir**: `Output`\<`undefined` \| `string`\>

If you use the 'changeDetect' function, this will create the tar of this directory
in this location

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

> **createChangeDetect**(`subPath?`, `pathMayNotExist?`): `Output`\<`null` \| `string` \| `Buffer`\<`ArrayBufferLike`\>\>

Creates a deterministic tar of the this asset that can be used as a comparison buffer
for changes.  This is better than using the "source" as a comparison point since things
like permissions changes, etc. can become a problem and we have sane settings to only compare
contents.

#### Parameters

##### subPath?

`string`

If provided this will only detect changes on a certain subpath

##### pathMayNotExist?

`boolean`

if the subPath does not exist and that is not an error, will just return null

#### Returns

`Output`\<`null` \| `string` \| `Buffer`\<`ArrayBufferLike`\>\>

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

***

### setChangeDetectHashFunction()

> `static` **setChangeDetectHashFunction**(`func`): `void`

This sets a hash function that will take the compressed bytes of a buffer for an asset and returns
a Buffer or string that should be used for change detect.

The second parameter of function you pass is the asset so that you can create custom hashes
for only certain problematic assets if need be.

#### Parameters

##### func

(`compressed`, `asset`) => `string` \| `Buffer`\<`ArrayBufferLike`\>

#### Returns

`void`

***

### sha256AndLength()

> `static` **sha256AndLength**(`buffer`): `string`

Simple hash algorithm that calculates the sha256 of a buffer and also appends the length
so that collisions from different lengths can be minimized

#### Parameters

##### buffer

`Buffer`

#### Returns

`string`
