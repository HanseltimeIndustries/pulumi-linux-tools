[**@hanseltime/traefik**](../README.md)

***

[@hanseltime/traefik](../README.md) / HttpHealthCheck

# Interface: HttpHealthCheck

Http Health check options for Traefik load balancer

## Properties

### followRedirects?

> `optional` **followRedirects**: `boolean`

(default: true), defines whether redirects should be followed during the health check calls.

***

### headers?

> `optional` **headers**: `object`

defines custom headers to be sent to the health check endpoint.

#### Index Signature

\[`key`: `string`\]: `string`

***

### hostname?

> `optional` **hostname**: `string`

sets the value of hostname in the Host header of the health check request.

***

### interval?

> `optional` **interval**: `string`

(default: 30s), defines the frequency of the health check calls.

***

### method?

> `optional` **method**: `string`

(default: GET), defines the HTTP method that will be used while connecting to the endpoint.

***

### mode?

> `optional` **mode**: `string`

(default: http), if defined to grpc, will use the gRPC health check protocol to probe the server.

***

### path

> **path**: `string`

defines the server URL path for the health check endpoint

***

### port?

> `optional` **port**: `string`

replaces the server URL port for the health check endpoint.

***

### scheme?

> `optional` **scheme**: `string`

replaces the server URL scheme for the health check endpoint

***

### status?

> `optional` **status**: `string`

defines the expected HTTP status code of the response to the health check request.

***

### timeout?

> `optional` **timeout**: `string`

(default: 5s), defines the maximum duration Traefik will wait for a health check request before considering the server unhealthy.
