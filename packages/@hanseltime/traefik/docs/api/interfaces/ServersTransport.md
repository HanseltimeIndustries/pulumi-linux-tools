[**@hanseltime/traefik**](../README.md)

***

[@hanseltime/traefik](../README.md) / ServersTransport

# Interface: ServersTransport

Static configuration servers transport configuration

## Properties

### insecureSkipVerify?

> `optional` **insecureSkipVerify**: `boolean`

insecureSkipVerify disables SSL certificate verification.

***

### maxIdleConnsPerHost?

> `optional` **maxIdleConnsPerHost**: `number`

Default=2

If non-zero, maxIdleConnsPerHost controls the maximum idle (keep-alive) connections to keep per-host.

***

### rootCAs?

> `optional` **rootCAs**: (`string` \| `Buffer`\<`ArrayBufferLike`\>)[]

rootCAs is the list of certificates (as file paths, or data bytes) that will be set as Root Certificate Authorities when using a self-signed TLS certificate.

***

### spiffe?

> `optional` **spiffe**: `object`

Please note that SPIFFE must be enabled in the static configuration before using it to secure the connection between Traefik and the backends.

#### forwardingTimeouts?

> `optional` **forwardingTimeouts**: `object`

forwardingTimeouts is about a number of timeouts relevant to when forwarding requests to the backend servers.

##### forwardingTimeouts.dialTimeout?

> `optional` **dialTimeout**: `string`

Default=30s

dialTimeout is the maximum duration allowed for a connection to a backend server to be established. Zero means no timeout.

##### forwardingTimeouts.idleConnTimeout?

> `optional` **idleConnTimeout**: `string`

Default=90s

idleConnTimeout, is the maximum amount of time an idle (keep-alive) connection will remain idle before closing itself. Zero means no limit.

##### forwardingTimeouts.responseHeaderTimeout?

> `optional` **responseHeaderTimeout**: `string`

Default=0s

responseHeaderTimeout, if non-zero, specifies the amount of time to wait for a server's response headers after fully writing the request (including its body, if any). This time does not include the time to read the response body. Zero means no timeout.

#### ids?

> `optional` **ids**: `string`[]

ids defines the allowed SPIFFE IDs. This takes precedence over the SPIFFE TrustDomain.

#### trustDomain?

> `optional` **trustDomain**: `string`

trustDomain defines the allowed SPIFFE trust domain.
