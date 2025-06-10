[**@hanseltime/traefik**](../README.md)

***

[@hanseltime/traefik](../README.md) / SPIFFE

# Interface: SPIFFE

## Properties

### workloadAPIAddr

> **workloadAPIAddr**: `string`

The workloadAPIAddr configuration defines the address of the SPIFFE Workload API.

Enabling SPIFFE does not imply that backend connections are going to use it automatically. Each ServersTransport
or TCPServersTransport, that is meant to be secured with SPIFFE, must explicitly enable it (see SPIFFE with
ServersTransport or SPIFFE with TCPServersTransport).
