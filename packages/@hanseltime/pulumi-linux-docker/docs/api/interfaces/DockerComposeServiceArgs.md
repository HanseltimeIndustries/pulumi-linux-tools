[**@hanseltime/pulumi-linux-docker**](../README.md)

***

[@hanseltime/pulumi-linux-docker](../README.md) / DockerComposeServiceArgs

# Interface: DockerComposeServiceArgs

If a resource is doing copy operations, some of them require the asset to be in
a root-relative path

## Extends

- [`TempCopyDirArgs`](TempCopyDirArgs.md)

## Properties

### accessDockerSocket?

> `optional` **accessDockerSocket**: `object`

We do not allow your service to bind directly to the docker socket since that can lead to vectors
for attacking the host system or other containers.

If you would like to use the docker socket, you can enable this and a docker-socket-proxy will
be set up on an internal network for your service that is reachable at tcp://<name>:2375.

See https://github.com/Tecnativa/docker-socket-proxy for options like API configuration.

You will need to determine how to change your docker socket use in the image to use this service
instead of the mounted socket, but all maintained images should support this.

#### apis?

> `optional` **apis**: `object`

##### Index Signature

\[`api`: `string`\]: `0` \| `1`

api keys matching the https://github.com/Tecnativa/docker-socket-proxy?tab=readme-ov-file#grant-or-revoke-access-to-certain-api-sections
keys including caps.

0 disables and 1 explicitly enables

#### env?

> `optional` **env**: `object`

Other options are configured by environment variable

https://github.com/Tecnativa/docker-socket-proxy?tab=readme-ov-file#grant-or-revoke-access-to-certain-api-sections

These are overridden by the explidit apis field if there's duplication

##### Index Signature

\[`e`: `string`\]: `string`

#### name?

> `optional` **name**: `string`

Defaults to dockersocketproxy

#### networkCIDR

> **networkCIDR**: `string`

This is the network CIDR range for the internal network.  It should be > (2 * replicas * service + 4)

We actually recommend using a CIDR in the `DefaultInternalNetworkRange.WHOLE_RANGE`. Note, the range
has to be unique across the entire machine and other services.

#### readonly

> **readonly**: `boolean`

If set to true, this will only allow GET and HEAD operations

***

### blueGreen?

> `optional` **blueGreen**: `Input`\<`BlueGreenInformation`\>

Required if using blue-green.  This should supply information about the traefik proxy that was configured
and then should provide responsible mappings from the service ports to traefik.

***

### connection

> **connection**: `Input`\<`ConnectionArgs`\>

A list of environment variables to be added for the docker file build

***

### deployType

> **deployType**: [`DockerDeployType`](../enumerations/DockerDeployType.md)

blue-green - we use docker compose to deploy both and then scale one down
   If you use blue-green, then your ports are not actually exposed through docker and instead are mapped
replace - this is a downtime operation.  We stop the current service and then bring it back up with the new build
manual - this means that the docker run will never be called until you specifically take it down.

***

### homeDir

> **homeDir**: `Input`\<`string`\>

The expected home directory path (absolute) of the connection user

***

### mounts?

> `optional` **mounts**: `Input`\<`Input`\<\{ `additionalUsers?`: Input\<Input\<\{ userId: Input\<number\>; groupId: Input\<number\>; \}\>\[\]\> \| undefined; `name`: `Input`\<`string`\>; `onContainer`: `Input`\<`string`\>; `readWrite?`: `boolean`; `resource`: `Input`\<`Archive` \| `Asset`\>; \}\>[]\>

You may not want to trigger new builds for some things that are mounted into containers.  This
is declaring assets/folders that will be loaded into a ./mnt directory.

You can reference them via a docker mount `./mnt/<name>:<in_container>` in your service specification

***

### name

> **name**: `Input`\<`string`\>

The name of the service - must be unique on the machine

***

### networks?

> `optional` **networks**: `Inputify`\<`undefined` \| \{[`k`: `string`]: `Network`\<`never`\>; \}\>

The docker compose networks that should be available to this service.  If not
marked as external, these will be created by docker compose for you.

Note: no networks attaches to the default network, you will need to set the service.network_mode: none

Keep in mind that blue-green applies it's own proxy network so you don't have to manage that.

***

### reuploadId?

> `optional` **reuploadId**: `number`

If you need to force a reupload due to an interruption, you can do so by incrementing this number

***

### secrets?

> `optional` **secrets**: `Input`\<`Input`\<\{ `name`: `Input`\<`string`\>; `value`: `Input`\<`string`\>; \}\>[]\>

Secrets that will be mounted via a file into the containers and given read-only access
to for the USER (unless overridden by secretUsers)

***

### secretUserIds?

> `optional` **secretUserIds**: `Input`\<`Input`\<`number`[]\>\>

If this is set, this will manage the users (via ACL) that can access the docker secrets
that are mounted into the container.  You provide the userIds for the user in the docker
container and we will add appropriate permissions.

This is useful if you are trying to blue-green a compose service and change the user id.
In that scenario, you would first deploy with this argument set and then clean up the IAC
by removing this array so that the only user allowed would be the current user.

Another scenario for this would be if you wanted to have the secret be root accessible and wrote
an entrypoint that read the secret in before running your app under a less-privileged user.
In that case, you would maintain that the secret is only allowed by the '0' user.

***

### service

> **service**: `ServiceInputified`

The service description like you would declare in docker-compose
with a few things removed due to this resource setting up things like context, etc.

***

### tmpCopyDir

> **tmpCopyDir**: `Input`\<`string`\>

#### Inherited from

[`TempCopyDirArgs`](TempCopyDirArgs.md).[`tmpCopyDir`](TempCopyDirArgs.md#tmpcopydir)

***

### usernsRemap

> **usernsRemap**: `Input`\<\{ `length`: `Input`\<`number`\>; `start`: `Input`\<`number`\>; \}\>

This is required and should match exactly how docker was installed on the machine.

This is used to calculate volume permissions in conjunction with the userIds.

If your docker install has disabled the default usernsRemap, then you can provide a 0,0 setting (not recommended)
