[**@hanseltime/traefik**](../README.md)

***

[@hanseltime/traefik](../README.md) / StaticConfiguration

# Interface: StaticConfiguration

## Properties

### accessLog?

> `optional` **accessLog**: `object`

if provided enables access logs

#### addInternals?

> `optional` **addInternals**: `boolean`

Optional, Default="false"

Enables access logs for internal resources (e.g.: ping@internal).

#### bufferingSize?

> `optional` **bufferingSize**: `number`

To write the logs in an asynchronous fashion, specify a bufferingSize option. This option represents the number of log lines Traefik will keep in memory before writing them to the selected output. In some cases, this option can greatly help performances.

#### fields?

> `optional` **fields**: `object`

You can decide to limit the logged fields/headers to a given list with the fields.names and fields.headers options.

Each field can be set to:

    keep to keep the value
    drop to drop the value

Header fields may also optionally be set to redact to replace the value with "REDACTED".

The defaultMode for fields.names is keep.

The defaultMode for fields.headers is drop.

##### fields.defaultMode?

> `optional` **defaultMode**: `"keep"` \| `"drop"`

##### fields.headers?

> `optional` **headers**: `object`

##### fields.headers.defaultMode?

> `optional` **defaultMode**: `"keep"` \| `"drop"`

##### fields.headers.names?

> `optional` **names**: `object`

###### Index Signature

\[`n`: `string`\]: `"keep"` \| `"drop"`

##### fields.names?

> `optional` **names**: `object`

###### Index Signature

\[`n`: `string`\]: `"keep"` \| `"drop"`

#### filePath?

> `optional` **filePath**: `string`

By default access logs are written to the standard output. To write the logs into a log file, use the filePath option.

#### filters?

> `optional` **filters**: `object`

To filter logs, you can specify a set of filters which are logically "OR-connected". Thus, specifying multiple filters will keep more access logs than specifying only one.

##### filters.minDuration?

> `optional` **minDuration**: `string`

to keep access logs when requests take longer than the specified duration (provided in seconds or as a valid duration format, see time.ParseDuration)

##### filters.retryAttempts?

> `optional` **retryAttempts**: `boolean`

to keep the access logs when at least one retry has happened

##### filters.statusCodes?

> `optional` **statusCodes**: `string`[]

to limit the access logs to requests with a status codes in the specified range

#### format?

> `optional` **format**: `string`

By default, the logs use a text format (common), but you can also ask for the json format in the format option.

#### otlp?

> `optional` **otlp**: `any`

***

### api?

> `optional` **api**: `object`

#### dashboard?

> `optional` **dashboard**: `boolean`

Default: true

Enable the dashboard. More about the dashboard features here.

#### debug?

> `optional` **debug**: `boolean`

Default: false

Enable additional endpoints for debugging and profiling, served under /debug/.

#### insecure?

> `optional` **insecure**: `boolean`

Enable the API in insecure mode, which means that the API will be available directly on the entryPoint named traefik, on path /api.

If the entryPoint named traefik is not configured, it will be automatically created on port 8080.

***

### certificatesResolvers?

> `optional` **certificatesResolvers**: [`CertificatesResolvers`](CertificatesResolvers.md)

***

### entryPoints

> **entryPoints**: `object`

#### Index Signature

\[`name`: `string`\]: [`Entrypoint`](Entrypoint.md)

***

### log?

> `optional` **log**: `object` & [`LogFileOptions`](LogFileOptions.md) & `object`

#### Type declaration

##### filePath?

> `optional` **filePath**: `string`

By default, the logs are written to the standard output. You can configure a file path instead using the filePath option.

##### format?

> `optional` **format**: `string`

By default, the logs use a text format (common), but you can also ask for the json format in the format option.

##### level?

> `optional` **level**: `"TRACE"` \| `"DEBUG"` \| `"INFO"` \| `"WARN"` \| `"ERROR"` \| `"FATAL"` \| `"PANIC"`

By default, the level is set to ERROR

##### noColor?

> `optional` **noColor**: `boolean`

When using the 'common' format, disables the colorized output.

#### Type declaration

##### otlp?

> `optional` **otlp**: `any`

***

### metrics?

> `optional` **metrics**: `object` & `object`

https://doc.traefik.io/traefik/observability/metrics/overview/

#### Type declaration

##### addInternals?

> `optional` **addInternals**: `boolean`

Optional, Default="false"

Enables metrics for internal resources (e.g.: ping@internals).

***

### ping?

> `optional` **ping**: `object`

Checking the Health of Your Traefik Instances

#### entryPoint?

> `optional` **entryPoint**: `string`

Optional, Default="traefik"

Enabling /ping on a dedicated EntryPoint.

#### manualRouting?

> `optional` **manualRouting**: `boolean`

If manualRouting is true, it disables the default internal router in order to allow one to create a custom router for the ping@internal service.

#### terminatingStatusCode?

> `optional` **terminatingStatusCode**: `number`

During the period in which Traefik is gracefully shutting down, the ping handler returns a 503 status code by default.
If Traefik is behind, for example a load-balancer doing health checks (such as the Kubernetes LivenessProbe), another code might be expected as the signal for graceful termination.
In that case, the terminatingStatusCode can be used to set the code returned by the ping handler during termination.

***

### providers?

> `optional` **providers**: `any`

Any provider configuration for supported providers via available via: https://doc.traefik.io/traefik/reference/install-configuration/providers/overview/#supported-providers

***

### serversTransports?

> `optional` **serversTransports**: [`ServersTransport`](ServersTransport.md)

***

### tcpServersTransport?

> `optional` **tcpServersTransport**: [`TcpServersTransport`](TcpServersTransport.md)

***

### tracing?

> `optional` **tracing**: `object`

The tracing system allows developers to visualize call flows in their infrastructure.

Traefik uses OpenTelemetry, an open standard designed for distributed tracing.

Please check our dedicated OTel docs to learn more.

#### addInternals?

> `optional` **addInternals**: `boolean`

Optional, Default="false"

Enables metrics for internal resources (e.g.: ping@internals).

#### capturedRequestHeaders?

> `optional` **capturedRequestHeaders**: `string`[]

Defines the list of request headers to add as attributes. It applies to client and server kind spans.

#### capturedResponseHeaders?

> `optional` **capturedResponseHeaders**: `string`[]

Defines the list of response headers to add as attributes. It applies to client and server kind spans.

#### otlp?

> `optional` **otlp**: `any`

#### resourceAttributes?

> `optional` **resourceAttributes**: `object`

Defines additional resource attributes to be sent to the collector.

##### Index Signature

\[`attr`: `string`\]: `string`

#### safeQueryParams?

> `optional` **safeQueryParams**: `string`[]

By default, all query parameters are redacted. Defines the list of query parameters to not redact.

#### sampleRate?

> `optional` **sampleRate**: `number`

Optional, Default=1.0

The proportion of requests to trace, specified between 0.0 and 1.0.

#### serviceName?

> `optional` **serviceName**: `string`

Required, Default="traefik"

Service name used in selected backend.
