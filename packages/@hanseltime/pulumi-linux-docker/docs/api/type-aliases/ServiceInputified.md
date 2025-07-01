[**@hanseltime/pulumi-linux-docker**](../README.md)

***

[@hanseltime/pulumi-linux-docker](../README.md) / ServiceInputified

# Type Alias: ServiceInputified

> **ServiceInputified** = `PropsInputify`\<`Omit`\<`v3.Service`, `"secrets"` \| `"container_name"` \| `"volumes"` \| `"build"` \| `"healthcheck"` \| `"user"`\>\> & `MandatoryHealthCheck` & `object`

## Type declaration

### build?

> `optional` **build**: `Inputify`\<`Omit`\<`NoShortForm`\<`v3.Service`\[`"build"`\]\>, `"context"`\>\> & `object`

Normal docker commpose build arguments with the exception of 'context', since that will
be uploaded to a starndard folder that will hold the compose.yaml within it.

#### Type declaration

##### context

> **context**: `pulumi.Input`\<`pulumi.asset.Archive` \| `pulumi.asset.Asset`\>

### user

> **user**: `pulumi.Input`\<\{ `groupId`: `pulumi.Input`\<`number`\>; `userId`: `pulumi.Input`\<`number`\>; \}\> \| `"ROOT_USER"`

This helps ensure that you are explicitly aware of which user is running the application
and what, in the event of a container breach, may be at risk on the machine.

We enforce numeric ids since those can be enforced between the host and container better than
semantic names

### volumes?

> `optional` **volumes**: `pulumi.Input`\<`pulumi.Input`\<`string`\>[]\>

We only accept the string short-form volumes and will then declare the requisite volumes if they
are not mounted volumes.

It is not necessary to supply strings for mounts via the `mounts:` option, since we will auto-create the mapping

Note: if you want to do a mount, either make sure it is an absolute path that is guaranteed
or that it is relative to the context you provided
