# @hanseltime/pulumi-file-utils

[Raw docs](./docs/)

[TODO - put your Github Pages url here](TODO)

This is a typescript library that provides a few helper utilities that helps with using file assets on 
a machine.

This is of particular use when using the `@pulumi/command` `CopyToRemote` resource when you want to 
compose a set of assets dynamically since the CopyToRemote command can only handle file paths at the
moment.

# Installation

As noted above, this is only guaranteed to work for typescript pulumi projects at the moment.  If you would like to test the pulumi provider
compilation and provide improvements toward that, please feel free.

Install the package and its dependencies:

```shell
# yarn
yarn add @hanseltime/pulumi-file-utils @pulumi/pulumi

# npm
npm install @hanseltime/pulumi-file-utils @pulumi/pulumi

# pnpm
pnpm add @hanseltime/pulumi-file-utils @pulumi/pulumi
```

# Resources

## CopyableAsset

This is a helper class that will:

1. Combine `pulumi.asset.StringAsset`, `pulumi.asset.FileAsset`, `pulumi.asset.FileArchive`, and `pulumi.asset.AssetArchive`
   into a temporary folder location
2. Provide a `.copyableSource` output that can will point to that temporary location
   1. It will also enforce a relative path resolution so that pulumi can work across machines
3. It will then add an exit handler (not guaranteed to work in all scenarios) that will clean up the temporary folder

### Example

To use the `CopyableAsset`, we need to have a temporary directory that we have set in the pulumi project.

In general, we recommend that you use `tmp` and add `tmp/` to your `.gitignore`.

With that in mind, we can now create an asset using things like dynamic strings:

```typescript
const asset = new CopyableAsset(this, `my-config-files`, {
			asset: pulumi.output(sshKeys).apply((sshKeys) => {
				return new pulumi.asset.AssetArchive(
                    {
                        file1: new pulumi.asset.StringAsset("This is some config I've made"),
                        file2: new pulumi.asset.StringAsset("This is another config")
                    }
				);
			}),
			tmpCopyDir: 'tmp',
			synthName: "my-config",
		})
```

The above asset will create a folder within the tmp folder under the id you provided (`my-config-files`) and will
located it within a folder called `my-config` with the two files as specified.

Ths synthName importantly helps you control the folder name that will be uploaded via commands like `CopyToRemote`, so
that you can make sure the folder name you want is uploaded.

### fromParent

Just like with pulumi names, you need to make sure that you don't run into name collisions for your copyable asset.

When just creating a single `CopyableAsset`, you can name it `asset` and then we will write it to the temporary location
that you have provided.  However, if you were to use a `CopyableAsset` inside of a `pulumi.ComponentResource`, you would 
find it hard to know how many layers of parents deep you are.

We provide a `CopyableAsset.fromParent` method that will compute a folder location that uses all parents of the provided
parent, so that it's unique.

### createChangeDetect

Since this is creating temporary directories for upload, you will probably find yourself needing to
compare to see if the directory has changed.  We don't want false positives because the timestamps
on the new temporary directory are different or because whatever resource you're using does a comparison
wrong (e.g. `remote.Command() triggers`).

Because of this, every `CopyableAsset` has a `createChangeDetect` method that will create a temporary
tar of the resource and return its buffer as a a value to compare.  The use of `tar/compression` is 
because that does not have any collisions.  In the event of a very large file asset though, you may be
more okay with hashing the binary.

#### About secrets

Since your copyable asset could involve secret values in files that you don't want to show, we always
make the returned changeDetect value a secret.  Since this is just binary data anyway, there's no
real need for it to be human readable and additionally, were we to print those via pulumi cli calls,
you could technically untar everything and get all the files.  Thus, we make sure pulumi won't print them
and just internally compare them.

#### Hashing

You may have a very large asset that you are creating.  As you can imagine, if you compress the that
archive, you could still end up with a very large commpressed set of bytes anyway.  In this scenario, you
can supply a hash function via `CopyableAsset.setChangeDetectHashFunction()`.  This way you can perform something 
like a `SHA1` or `SHA256` of the bytes of the compressed asset and get a smaller comparison vector.
Keep in mind that computing SHAs like this does not guarantee there won't be collisions which would
lead to something looking like it hasn't changed. Since you tune the function though, you can continue
to update your hash function as necessary in the event that occurs.

We do provide a simple `sha256AndLength` hash function that will create a string of sha256 and the lenght of the buffer.  Again, this is meant to minimize collisions but cannot guarantee them.

```typescript
CopyableAsset.setChangeDetectHashFunction(CopyableAsset.sha256AndLength)
```