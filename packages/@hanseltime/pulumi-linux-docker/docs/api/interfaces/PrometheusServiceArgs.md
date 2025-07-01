[**@hanseltime/pulumi-linux-docker**](../README.md)

***

[@hanseltime/pulumi-linux-docker](../README.md) / PrometheusServiceArgs

# Interface: PrometheusServiceArgs

## Properties

### accessDockerSocket?

> `optional` **accessDockerSocket**: `object`

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

***

### cliFlags?

> `optional` **cliFlags**: `Input`\<`Input`\<`string`\>[]\>

Optional cli flags that you can apply.  We already provide a base set that points to the mounted prometheus.yml
and points to a local volume by default.

All other flags can be added here: https://prometheus.io/docs/prometheus/latest/command-line/prometheus/#flags

***

### configKeysForReplace()?

> `optional` **configKeysForReplace**: (`prometheusConfig`) => `any`[]

Some prometheus config changes are not reingested on upload, this allows you to add some config changes
that will create a replacement of the docker service since we actually need a full restart.

You provide a lambda function that takes in the prometheus config and returns whatever objects you deem
worthy of watching for changes.  This translates to a label with a hash that we add to the service
and that will trigger reloads on change.

Note: there are some basic keys that we already know trigger update (docker_sd_config jobs) and remote_write
configs if an agent

#### Parameters

##### prometheusConfig

`any`

#### Returns

`any`[]

***

### connection

> **connection**: `Input`\<`ConnectionArgs`\>

***

### expose

> **expose**: `Input`\<\{ `interfaceIps`: `Input`\<`Input`\<`string`\>[]\>; `port`: `Input`\<`number`\>; \}\>

The port that we will expose the prometheus UI on and the interfaces attached.

IMPORTANT - we do not recommend exposing this to the public internet
since prometheus does not do authentication on its own and this could lead to outsiders
triggering APIs that write.  Adding a proxy that performs authentication is outside the
scope of this resource since it is normally meant to run on an internal network
and be exposed via something like grafana.

// loopback interface and the docker interface
interfaceIps: ['127.0.0.1', 'dockerInstall.defaultDockerGatewayIP')],

***

### homeDir

> **homeDir**: `Input`\<`string`\>

***

### mode

> **mode**: `Input`\<`"agent"` \| `"server"`\>

This will preconfigure if this is an agent (lightweight pass through) or a server

***

### monitoringNetwork?

> `optional` **monitoringNetwork**: `Input`\<`string`\>

This is here specifically if you have something like a central prometheus server and a
prometheus agent on the same Docker machine.  This is kinda crazy since if you're on the
same machine, you don't really need a light-weight agent andserver, but for demo/testing purposes we provide it.

***

### mounts?

> `optional` **mounts**: `Input`\<`Input`\<\{ `additionalUsers?`: Input\<Input\<\{ userId: Input\<number\>; groupId: Input\<number\>; \}\>\[\]\> \| undefined; `name`: `Input`\<`string`\>; `onContainer`: `Input`\<`string`\>; `readWrite?`: `boolean`; `resource`: `Input`\<`Archive` \| `Asset`\>; \}\>[]\>

IMPORTANT - these mounts will have the prometheus config added to it.  These are only additional mounts.

***

### prometheusConfig

> **prometheusConfig**: `any`

This is the prometheus config in object form.  It will be serialized to yaml and mounted for you.

We alraedy set up a self-scraping configuration based on 'scrapeSelf'

***

### reuploadId?

> `optional` **reuploadId**: `number`

***

### scrapeSelf

> **scrapeSelf**: `boolean`

This will automatically add a scrape job called prometheus-self that scrapes this container.

You may turn this off if say, you were doing docker service discovery and that would also
scrape this container

***

### secrets?

> `optional` **secrets**: `Input`\<`Input`\<\{ `name`: `Input`\<`string`\>; `value`: `Input`\<`string`\>; \}\>[]\>

***

### service?

> `optional` **service**: `Omit`\<`Input`\<[`ServiceInputified`](../type-aliases/ServiceInputified.md)\>, `"healthcheck"` \| `"user"` \| `"command"` \| `"networks"` \| `"ports"`\>

All docker compose arguments that are not explicitly set up by the specific arguments of this args
interface can still be set.

***

### serviceName?

> `optional` **serviceName**: `Input`\<`string`\>

Defaults to prometheus

***

### tmpCopyDir

> **tmpCopyDir**: `Input`\<`string`\>

***

### upArgs?

> `optional` **upArgs**: `Input`\<`Input`\<`string`\>[]\>

***

### usernsRemap

> **usernsRemap**: `Input`\<\{ `length`: `Input`\<`number`\>; `start`: `Input`\<`number`\>; \}\>
