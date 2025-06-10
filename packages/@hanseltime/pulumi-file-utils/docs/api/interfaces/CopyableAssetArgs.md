[**@hanseltime/pulumi-file-utils**](../README.md)

***

[@hanseltime/pulumi-file-utils](../README.md) / CopyableAssetArgs

# Interface: CopyableAssetArgs

## Properties

### asset

> **asset**: `Input`\<`Asset` \| `Archive`\>

***

### noClean?

> `optional` **noClean**: `boolean`

This class will normally add itself to the process exit handler to remove the temporary directory.
Setting this will skip that for this.

***

### synthName?

> `optional` **synthName**: `Input`\<`string`\>

Only necessary if the asset is not a file or folder already on the system.
This will provide file folder name since the copy commands copy this root name
and structure into a folder

***

### tmpCopyDir?

> `optional` **tmpCopyDir**: `Input`\<`string`\>

Only necessary if the asset is not a file or folder already on the system
