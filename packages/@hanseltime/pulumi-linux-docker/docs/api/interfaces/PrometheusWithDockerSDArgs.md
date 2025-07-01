[**@hanseltime/pulumi-linux-docker**](../README.md)

***

[@hanseltime/pulumi-linux-docker](../README.md) / PrometheusWithDockerSDArgs

# Interface: PrometheusWithDockerSDArgs

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

***

### connection

> **connection**: `Input`\<`ConnectionArgs`\>

***

### dockerServiceDiscovery?

> `optional` **dockerServiceDiscovery**: `Input`\<`object` & `Partial`\<`PrometheusHttpConfig`\>\>

***

### dockerSocketNetworkCIDR

> **dockerSocketNetworkCIDR**: `Input`\<`string`\>

Since Prometheus service discovery binds to the docker socket proxy, we need to set up an internal network
with enough ips for a gateway + cadvisor + socker proxy server

We recommend setting a CIDR of /26 or /28 on an unused CIDR.  If you used DockerInstall, you can use the `.defaultInternalNetworkRange`
dockerInstall.defaultInternalNetworkRange.claimIPCIDR('172.255.0.0/26', 'prometheus').cidr

Keep in mind that the defaultInternalNetworkRange tracks used cidrs in the same project per docker install (which shoujld be one per machine),
so it will throw an error if some other network has claimed that range (helping avoid deploy time errors on the machine).

***

### expose

> **expose**: `Input`\<\{ `interfaceIps`: `Input`\<`Input`\<`string`\>[]\>; `port`: `Input`\<`number`\>; \}\>

***

### homeDir

> **homeDir**: `Input`\<`string`\>

***

### mode

> **mode**: `Input`\<`"agent"` \| `"server"`\>

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

### prometheusConfig?

> `optional` **prometheusConfig**: `any`

This is the prometheus config in object form.  It will be serialized to yaml and mounted for you.

Because we are already setting up safe docker socket access for docker_sd_config, you should not provide
the host property for docker_sd_config.

***

### reuploadId?

> `optional` **reuploadId**: `number`

***

### secrets?

> `optional` **secrets**: `Input`\<`Input`\<\{ `name`: `Input`\<`string`\>; `value`: `Input`\<`string`\>; \}\>[]\>

***

### service?

> `optional` **service**: `Omit`\<`Input`\<[`ServiceInputified`](../type-aliases/ServiceInputified.md)\>, `"healthcheck"` \| `"user"` \| `"command"` \| `"networks"` \| `"ports"`\>

***

### serviceName?

> `optional` **serviceName**: `string`

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
