# hanseltime pulumi resource monorepo

This is a monorepo that holds packages for interacting with Linux machines remotely and some Linode Apis.
These packages are only proven as typescript-only packages for now and not proven as a pulumi provider that
works with other languages at the moment.

## Packages

All packages located with the `packages/` folder are set up to be published on npm.  Check out their various README's.

## Examples

The `examples/` folder contains pulumi demonstrations using the resources within the monorepo.  They should be simple
enough to follow and create within your own infrastructure for testing and experimentation.

### VLAN with Docker

The vlan with docker example is perhaps the most full example of a distributed system.  It helps provide a pattern
for a closed network of Linodes that use containerization, a VPN, and monitoring systems to increase your visibility.

## Releasing

This repository uses the `changesets` library to perform releases.  If you were to provide a PR, you would want to add
a changeset if it requires a new release:

```
yarn changeset

## Add in changeset notes according to prompt
```