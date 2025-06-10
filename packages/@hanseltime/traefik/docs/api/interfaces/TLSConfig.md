[**@hanseltime/traefik**](../README.md)

***

[@hanseltime/traefik](../README.md) / TLSConfig

# Interface: TLSConfig

## Properties

### certResolver?

> `optional` **certResolver**: `string`

If certResolver is defined, Traefik will try to generate certificates based on routers Host & HostSNI rules.

***

### domains?

> `optional` **domains**: `object`[]

You can set SANs (alternative domains) for each main domain. Every domain must have A/AAAA records pointing
to Traefik. Each domain & SAN will lead to a certificate request.

#### main

> **main**: `string`

#### sans?

> `optional` **sans**: `string`[]

***

### options?

> `optional` **options**: `TLSOptions`
