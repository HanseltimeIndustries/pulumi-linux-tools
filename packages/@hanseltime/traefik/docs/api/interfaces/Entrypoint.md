[**@hanseltime/traefik**](../README.md)

***

[@hanseltime/traefik](../README.md) / Entrypoint

# Interface: Entrypoint

Static configuration entrypoints configuration

## Properties

### address

> **address**: `string`

The address defines the port, and optionally the hostname, on which to listen for incoming connections and packets.
It also defines the protocol to use (TCP or UDP). If no protocol is specified, the default is TCP. The format is:

[host]:port[/tcp|/udp]

If both TCP and UDP are wanted for the same port, two entryPoints definitions are needed, such as in the example below.

***

### allowACMEByPass?

> `optional` **allowACMEByPass**: `boolean`

allowACMEByPass determines whether a user defined router can handle ACME TLS or HTTP challenges instead of the Traefik
dedicated one. This option can be used when a Traefik instance has one or more certificate resolvers configured, but
is also used to route challenges connections/requests to services that could also initiate their own ACME challenges.

***

### asDefault?

> `optional` **asDefault**: `boolean`

The AsDefault option marks the EntryPoint to be in the list of default EntryPoints. EntryPoints in this
list are used (by default) on HTTP and TCP routers that do not define their own EntryPoints option.

***

### forwardedHeaders?

> `optional` **forwardedHeaders**: `object`

You can configure Traefik to trust the forwarded headers information (X-Forwarded-*).

#### connection?

> `optional` **connection**: `string`[]

As per RFC7230, Traefik respects the Connection options from the client request.
By doing so, it removes any header field(s) listed in the request Connection
header and the Connection header field itself when empty. The removal happens
as soon as the request is handled by Traefik, thus the removed headers are not
available when the request passes through the middleware chain. The connection
option lists the Connection headers allowed to passthrough the middleware chain
before their removal.

#### insecure?

> `optional` **insecure**: `boolean`

Insecure Mode (Always Trusting Forwarded Headers).

#### trustedIPs?

> `optional` **trustedIPs**: `string`[]

Trusting Forwarded Headers from specific IPs or ranges.

***

### http?

> `optional` **http**: `object`

This whole section is dedicated to options, keyed by entry point, that will apply only to HTTP routing.

#### encodeQuerySemicolons?

> `optional` **encodeQuerySemicolons**: `boolean`

The encodeQuerySemicolons option allows to enable query
semicolons encoding. One could use this option to avoid non-encoded
semicolons to be interpreted as query parameter separators by Traefik.
When using this option, the non-encoded semicolons characters in query
will be transmitted encoded to the backend.

#### middlewares?

> `optional` **middlewares**: `string`[]

The list of middlewares that are prepended by default to the list of middlewares
of each router associated to the named entry point.

#### redirections?

> `optional` **redirections**: `object`

This section is a convenience to enable (permanent) redirecting of all incoming
requests on an entry point (e.g. port 80) to another entry point (e.g. port 443)
or an explicit port (:443).

##### redirections.entryPoint

> **entryPoint**: `object`

##### redirections.entryPoint.permanent?

> `optional` **permanent**: `boolean`

Default=true

To apply a permanent redirection.

##### redirections.entryPoint.priority?

> `optional` **priority**: `number`

Default=MaxInt-1

Priority of the generated router.

##### redirections.entryPoint.scheme?

> `optional` **scheme**: `"http"` \| `"https"`

Default="https"

The redirection target scheme.

##### redirections.entryPoint.to

> **to**: `string`

The target element, it can be:

an entry point name (ex: websecure)

a port (:443)

#### sanitizePath?

> `optional` **sanitizePath**: `boolean`

Default=true

The sanitizePath option defines whether to enable the request path sanitization.
When disabled, the incoming request path is passed to the backend as is. This
can be useful when dealing with legacy clients that are not url-encoding data
in the request path. For example, as base64 uses the “/” character internally,
if it's not url encoded, it can lead to unsafe routing when the sanitizePath
option is set to false.

#### tls?

> `optional` **tls**: [`TLSConfig`](TLSConfig.md)

This section is about the default TLS configuration applied to all routers associated
with the named entry point.

If a TLS section (i.e. any of its fields) is user-defined, then the default
configuration does not apply at all.

The TLS section is the same as the TLS section on HTTP routers.

***

### http2?

> `optional` **http2**: `object`

http/2 options

#### maxConcurrentStreams?

> `optional` **maxConcurrentStreams**: `number`

maxConcurrentStreams specifies the number of concurrent streams per connection that each client is
allowed to initiate. The maxConcurrentStreams value must be greater than zero.

***

### http3?

> `optional` **http3**: `object`

If provided, this will enable https3

#### advertisedPort?

> `optional` **advertisedPort**: `number`

http3.advertisedPort defines which UDP port to advertise as the HTTP/3 authority. It defaults
to the entryPoint's address port. It can be used to override the authority in the alt-svc header,
for example if the public facing port is different from where Traefik is listening.

***

### observability?

> `optional` **observability**: `object`

This section is dedicated to options to control observability for an EntryPoint.

#### accessLogs?

> `optional` **accessLogs**: `boolean`

Default=true

AccessLogs defines whether a router attached to this EntryPoint produces access-logs by default.
Nonetheless, a router defining its own observability configuration will opt-out from this default.

#### metrics?

> `optional` **metrics**: `boolean`

Default=true

Metrics defines whether a router attached to this EntryPoint produces metrics by default. Nonetheless,
a router defining its own observability configuration will opt-out from this default.

#### tracing?

> `optional` **tracing**: `boolean`

Default=true

Tracing defines whether a router attached to this EntryPoint produces traces by default. Nonetheless,
a router defining its own observability configuration will opt-out from this default.

***

### proxyProtocol?

> `optional` **proxyProtocol**: `object`

Traefik supports PROXY protocol version 1 and 2.

If PROXY protocol header parsing is enabled for the entry point, this entry point can accept
connections with or without PROXY protocol headers.

If the PROXY protocol header is passed, then the version is determined automatically.

#### insecure?

> `optional` **insecure**: `boolean`

Insecure Mode (Testing Environment Only).

In a test environments, you can configure Traefik to trust every incoming connection.
Doing so, every remote client address will be replaced (trustedIPs won't have any effect)

#### trustedIPs?

> `optional` **trustedIPs**: `string`[]

Enabling PROXY protocol with Trusted IPs.

***

### reusePort?

> `optional` **reusePort**: `boolean`

The ReusePort option enables EntryPoints from the same or different processes listening on the same TCP/UDP port by
utilizing the SO_REUSEPORT socket option. It also allows the kernel to act like a load balancer to distribute
incoming connections between entry points.

For example, you can use it with the transport.lifeCycle to do canary deployments against Traefik itself.
Like upgrading Traefik version or reloading the static configuration without any service downtime.

***

### transport?

> `optional` **transport**: `object`

#### keepAliveMaxRequests?

> `optional` **keepAliveMaxRequests**: `string`

The maximum duration Traefik can handle requests before sending a Connection: Close header
to the client (for HTTP2, Traefik sends a GOAWAY). Zero means no limit.

#### lifeCycle?

> `optional` **lifeCycle**: `object`

Controls the behavior of Traefik during the shutdown phase.

##### lifeCycle.graceTimeOut?

> `optional` **graceTimeOut**: `string`

Duration to give active requests a chance to finish before Traefik stops.

Can be provided in a format supported by time.ParseDuration or as raw values (digits).

If no units are provided, the value is parsed assuming seconds.

##### lifeCycle.requestAcceptGraceTimeout?

> `optional` **requestAcceptGraceTimeout**: `string`

Duration to keep accepting requests prior to initiating the graceful termination
period (as defined by the graceTimeOut option). This option is meant to give
downstream load-balancers sufficient time to take Traefik out of rotation.

Can be provided in a format supported by time.ParseDuration or as raw values (digits).
If no units are provided, the value is parsed assuming seconds. The zero duration
disables the request accepting grace period, i.e., Traefik will immediately proceed
to the grace period.

#### respondingTimeouts?

> `optional` **respondingTimeouts**: `object`

respondingTimeouts are timeouts for incoming requests to the Traefik instance.
Setting them has no effect for UDP entryPoints.

##### respondingTimeouts.idleTimeout?

> `optional` **idleTimeout**: `string`

idleTimeout is the maximum duration an idle (keep-alive) connection will remain
idle before closing itself.

If zero, no timeout exists.
Can be provided in a format supported by time.ParseDuration or as raw values
(digits). If no units are provided, the value is parsed assuming seconds.

##### respondingTimeouts.readTimeout?

> `optional` **readTimeout**: `string`

readTimeout is the maximum duration for reading the entire request, including the body.

If zero, no timeout exists.
Can be provided in a format supported by time.ParseDuration or as raw 
values (digits). If no units are provided, the value is parsed assuming seconds.
We strongly suggest adapting this value accordingly to your needs.

##### respondingTimeouts.writeTimeout?

> `optional` **writeTimeout**: `string`

writeTimeout is the maximum duration before timing out writes of the response.

It covers the time from the end of the request header read to the end of the
response write. If zero, no timeout exists.
Can be provided in a format supported by time.ParseDuration or as raw values
(digits). If no units are provided, the value is parsed assuming seconds.

***

### udp?

> `optional` **udp**: `object`

This whole section is dedicated to options, keyed by entry point, that will apply only to UDP routing.

#### timeout?

> `optional` **timeout**: `string`

Default=3s
Timeout defines how long to wait on an idle session before releasing the related resources.
The Timeout value must be greater than zero.
