[**@hanseltime/pulumi-linux**](../README.md)

***

[@hanseltime/pulumi-linux](../README.md) / SudoCopyToRemoteArgs

# Interface: SudoCopyToRemoteArgs

## Extends

- `CopyToRemoteArgs`

## Properties

### connection

> **connection**: `Input`\<`ConnectionArgs`\>

The parameters with which to connect to the remote host.

#### Inherited from

`remote.CopyToRemoteArgs.connection`

***

### remotePath

> **remotePath**: `Input`\<`string`\>

The destination path on the remote host. The last element of the path will be created if it doesn't exist but it's an error when additional elements don't exist. When the remote path is an existing directory, the source file or directory will be copied into that directory. When the source is a file and the remote path is an existing file, that file will be overwritten. When the source is a directory and the remote path an existing file, the copy will fail.

#### Inherited from

`remote.CopyToRemoteArgs.remotePath`

***

### source

> **source**: `Input`\<`Asset` \| `Archive`\>

An [asset or an archive](https://www.pulumi.com/docs/concepts/assets-archives/) to upload as the source of the copy. It must be path-based, i.e., be a `FileAsset` or a `FileArchive`. The item will be copied as-is; archives like .tgz will not be unpacked. Directories are copied recursively, overwriting existing files.

#### Inherited from

`remote.CopyToRemoteArgs.source`

***

### triggers?

> `optional` **triggers**: `Input`\<`any`[]\>

Trigger replacements on changes to this input.

#### Inherited from

`remote.CopyToRemoteArgs.triggers`

***

### userTmpPath

> **userTmpPath**: `Input`\<`string`\>

This is the absolute path to a tmp directory where we upload the intermediate files before moving them
