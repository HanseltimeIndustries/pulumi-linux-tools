[**@hanseltime/traefik**](../README.md)

***

[@hanseltime/traefik](../README.md) / CertificatesResolvers

# Interface: CertificatesResolvers

Keep in mind that certificates should not be auto-renewed in multiple places
or this will lead to invalidatinng other instances' certificates.

Instead, those certificates should be mounted via a shared file system

## Indexable

\[`resolverName`: `string`\]: `object`
