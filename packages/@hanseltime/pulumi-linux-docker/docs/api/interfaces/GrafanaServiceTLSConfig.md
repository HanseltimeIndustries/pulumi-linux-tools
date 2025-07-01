[**@hanseltime/pulumi-linux-docker**](../README.md)

***

[@hanseltime/pulumi-linux-docker](../README.md) / GrafanaServiceTLSConfig

# Interface: GrafanaServiceTLSConfig

## Properties

### certCrt

> **certCrt**: `Input`\<`string`\>

This is the matching certificate chain that you have to match the private key

***

### certKey

> **certKey**: `Input`\<`string`\>

This is the certificate private key that you have.  Make sure it's a secret.

***

### minTlsVersion?

> `optional` **minTlsVersion**: `Input`\<`"TLS1.2"` \| `"TLS1.3"`\>

Defaults to tls1.2

***

### protocol?

> `optional` **protocol**: `Input`\<`"https"` \| `"h2"`\>

Defaults to https

***

### rootUrl

> **rootUrl**: `Input`\<`string`\>

The host url that corresponds to where your grafana will be accessible and the TLS that
you are using for the domain.
