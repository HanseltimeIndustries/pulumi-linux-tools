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
