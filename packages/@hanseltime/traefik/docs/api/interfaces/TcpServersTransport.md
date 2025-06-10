[**@hanseltime/traefik**](../README.md)

***

[@hanseltime/traefik](../README.md) / TcpServersTransport

# Interface: TcpServersTransport

## Properties

### dialKeepAlive?

> `optional` **dialKeepAlive**: `string`

Default="15s"

dialKeepAlive defines the interval between keep-alive probes sent on an active network connection. If zero, keep-alive probes are sent with a default value (currently 15 seconds), if supported by the protocol and operating system. Network protocols or operating systems that do not support keep-alives ignore this field. If negative, keep-alive probes are disabled.

***

### dialTimeout?

> `optional` **dialTimeout**: `string`

Default="30s"

dialTimeout is the maximum duration allowed for a connection to a backend server to be established. Zero means no timeout.

***

### spiffe?

> `optional` **spiffe**: `object`

Please note that SPIFFE must be enabled in the static configuration before using it to secure the connection between Traefik and the backends.

#### ids?

> `optional` **ids**: `string`[]

ids defines the allowed SPIFFE IDs. This takes precedence over the SPIFFE TrustDomain.

#### trustDomain?

> `optional` **trustDomain**: `string`

trustDomain defines the allowed SPIFFE trust domain.

***

### tls?

> `optional` **tls**: `object`

tls defines the TLS configuration to connect with TCP backends.

#### insecureSkipVerify?

> `optional` **insecureSkipVerify**: `boolean`

insecureSkipVerify disables the server's certificate chain and host name verification.

#### rootCAs?

> `optional` **rootCAs**: `string`[]

rootCAs defines the set of Root Certificate Authorities (as file paths, or data bytes) to use when verifying self-signed TLS server certificates.
