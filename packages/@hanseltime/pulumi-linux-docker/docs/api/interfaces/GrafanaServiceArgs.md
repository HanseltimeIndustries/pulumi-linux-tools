[**@hanseltime/pulumi-linux-docker**](../README.md)

***

[@hanseltime/pulumi-linux-docker](../README.md) / GrafanaServiceArgs

# Interface: GrafanaServiceArgs

## Extends

- `Omit`\<[`DockerComposeServiceArgs`](DockerComposeServiceArgs.md), `"service"` \| `"deployType"` \| `"blueGreen"`\>

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

> `optional` **apis**: `Input`\<\{[`api`: `string`]: `0` \| `1`; \}\>

#### env?

> `optional` **env**: `Input`\<\{[`e`: `string`]: `string`; \}\>

Other options are configured by environment variable

https://github.com/Tecnativa/docker-socket-proxy?tab=readme-ov-file#grant-or-revoke-access-to-certain-api-sections

These are overridden by the explidit apis field if there's duplication

#### name?

> `optional` **name**: `string`

Defaults to dockersocketproxy

#### networkCIDR

> **networkCIDR**: `Input`\<`string`\>

This is the network CIDR range for the internal network.  It should be > (2 * replicas * service + 4)

We actually recommend using a CIDR in the `DefaultInternalNetworkRange.WHOLE_RANGE`. Note, the range
has to be unique across the entire machine and other services.

#### readonly

> **readonly**: `boolean`

If set to true, this will only allow GET and HEAD operations

#### Inherited from

`Omit.accessDockerSocket`

***

### admin

> **admin**: `object`

Admin user settings

The initial password is what is used to bring up the admin instance.  If you ever need to change the admin password,
do not change the initial.  Simply add the currentPassword.

#### currentPassword?

> `optional` **currentPassword**: `Input`\<`string`\>

#### initialPassword

> **initialPassword**: `Input`\<`string`\>

The password for a brand new grafana.  To change it, keep this field but add the currentPassword

***

### configOverride?

> `optional` **configOverride**: `Input`\<\{[`sectionOrNonSectionedKey`: `string`]: `Input`\<[`GrafanaConfigValue`](GrafanaConfigValue.md) \| \{[`k`: `string`]: `Input`\<[`GrafanaConfigValue`](GrafanaConfigValue.md)\>; \}\>; \}\>

This will only override .ini just like with environment variables.

Note, the values can be marked as secret, which is critical to not leaking those values when
we set up the compose service.  If they are marked as secret, we will mount them as secrets and
then refer to the via the __FILE environment variable for you.

This is the json representation of a grafana configuration file.  Any top-level key: object is
written out as is.

[key]
object.key1 = object.value1

***

### connection

> **connection**: `Input`\<`ConnectionArgs`\>

A list of environment variables to be added for the docker file build

#### Inherited from

`Omit.connection`

***

### expose

> **expose**: `Input`\<\{ `interfaceIps`: `Input`\<`Input`\<`string`\>[]\>; `port`: `Input`\<`number`\>; \}\>

The port that we will expose the grafana UI on and the interfaces attached.

***

### homeDir

> **homeDir**: `Input`\<`string`\>

The expected home directory path (absolute) of the connection user

#### Inherited from

`Omit.homeDir`

***

### monitoringNetwork?

> `optional` **monitoringNetwork**: `Input`\<`string`\>

This is the monitoring network that should have some sort of metric collector like prometheus or open telemetry on
it.  This is a simplified way of declaring the external network and adding it to the service so that
we can look up containers by DNS name.

#### Inherited from

`Omit.monitoringNetwork`

***

### mounts?

> `optional` **mounts**: `Input`\<`Input`\<\{ `additionalUsers?`: Input\<Input\<\{ userId: Input\<number\>; groupId: Input\<number\>; \}\>\[\]\> \| undefined; `name`: `Input`\<`string`\>; `onContainer`: `Input`\<`string`\>; `readWrite?`: `boolean`; `resource`: `Input`\<`Archive` \| `Asset`\>; \}\>[]\>

You may not want to trigger new builds for some things that are mounted into containers.  This
is declaring assets/folders that will be loaded into a ./mnt directory.

These mounts will automatically be added to your volumes section of the docker service specification

#### Inherited from

`Omit.mounts`

***

### name

> **name**: `Input`\<`string`\>

The name of the service - must be unique on the machine

#### Inherited from

`Omit.name`

***

### networks?

> `optional` **networks**: `Inputify`\<`undefined` \| \{[`k`: `string`]: `Network`\<`never`\>; \}\>

The docker compose networks that should be available to this service.  If not
marked as external, these will be created by docker compose for you.

Note: no networks attaches to the default network, you will need to set the service.network_mode: none

Keep in mind that blue-green applies it's own proxy network so you don't have to manage that.

#### Inherited from

`Omit.networks`

***

### providerConnection?

> `optional` **providerConnection**: `Input`\<\{ `caCert?`: Input\<string\> \| undefined; `host?`: Input\<string\> \| undefined; `httpHeaders?`: Input\<\{ \[key: string\]: Input\<string\>; \}\> \| undefined; `insecureSkipVerify?`: Input\<boolean\> \| undefined; `port?`: Input\<number\> \| undefined; `protocol?`: Input\<"http" \| "https"\> \| undefined; `retries?`: Input\<number\> \| undefined; `retryStatusCodes?`: Input\<Input\<string\>\[\]\> \| undefined; `retryWait?`: Input\<number\> \| undefined; `storeDashboardSha256?`: Input\<boolean\> \| undefined; \}\>

The service will do its best to set up a connection for a grafana.Provider by using the
tls.rootUrl or (in the event of no tls, the machine connection).  If the machine connection is
a public IP and you don't have TLS, you will want to not have this provider configured.  Instead
you can override this with something like a VPN address (expecting that you'll be on the vpn while
running this, etc.)

***

### reloadConfig?

> `optional` **reloadConfig**: `number`

If you are making configuration changes that require a reload or processing of the configuration
file (like a TLS certificate update, which we already do, but this is just an example).  You can
always change the number for the reload config to trigger us sending an HUP signal to the server
which will cause a configuration reload.

***

### reuploadId?

> `optional` **reuploadId**: `number`

If you need to force a reupload due to an interruption, you can do so by incrementing this number

#### Inherited from

`Omit.reuploadId`

***

### secrets?

> `optional` **secrets**: `Input`\<`Input`\<\{ `name`: `Input`\<`string`\>; `value`: `Input`\<`string`\>; \}\>[]\>

Secrets that will be mounted via a file into the containers and given read-only access
to for the USER (unless overridden by secretUsers)

#### Inherited from

`Omit.secrets`

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

#### Inherited from

`Omit.secretUserIds`

***

### service?

> `optional` **service**: `Omit`\<`Input`\<[`ServiceInputified`](../type-aliases/ServiceInputified.md)\>, `"healthcheck"` \| `"user"` \| `"ports"`\>

The normal docker compose service with a few arguments removed since we know what they are automatically

***

### tls

> **tls**: `Input`\<[`GrafanaServiceTLSConfig`](GrafanaServiceTLSConfig.md)\> \| `"NO_PUBLIC_CONNECTION"`

If you are using a @pulumiverse/grafana, you almost always NEED tls.  That's because
the grafana provider will be send authentication requests to the server with sensitive
credentials.  If you do this over HTTP, any man in the middle will be able to get those
credentials and then access your grafana.

If you don't want TLS and are fine with it, you can set as 'NO_PUBLIC_CONNECTION' to
not have to use it.  This would make sense if you were connecting via a local VPN
and accessing grafana over that VPN (which is doing encryption via the vpn tunnel).

Additionally, by default we let the TLS certificate transition by grafana watching the keey in 5 minute
intervals.  This avoids a restart of the service.  However, if yo

***

### tmpCopyDir

> **tmpCopyDir**: `Input`\<`string`\>

#### Inherited from

`Omit.tmpCopyDir`

***

### upArgs?

> `optional` **upArgs**: `Input`\<`Input`\<`string`\>[]\>

This is an escape hatch if you are running into problems with docker compose up

Specifially force

#### Inherited from

`Omit.upArgs`

***

### usernsRemap

> **usernsRemap**: `Input`\<\{ `length`: `Input`\<`number`\>; `start`: `Input`\<`number`\>; \}\>

This is required and should match exactly how docker was installed on the machine.

This is used to calculate volume permissions in conjunction with the userIds.

If your docker install has disabled the default usernsRemap, then you can provide a 0,0 setting (not recommended)

#### Inherited from

`Omit.usernsRemap`
