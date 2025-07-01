# @hanseltime/pulumi-linode

## 0.3.0

### Minor Changes

- cf1e368: Adding Docker Monitoring Functionality

  DockerInstall: providing defaultDockerGatewayIP output for interfaceIp attachment
  DockerInstall: defaultInternalNetworkRange field allows claiming CIDRs for things like dockerSocketProxy

  DockerComposeService: adding upArgs input for adjusting compose up calls when necessary
  DockerComposeService: adding monitoringNewtwork property to rapidly mount that network to the service
  DockerComposeService: support network "default" without requiring a top-level network declaration
  DockerComposeService: add outputs for looking up network names by other services
  DockerComposeService: docker compose logs called when docker compose up fails

  Network: allows claiming CIDRs

  LinuxUser: use single quotes for password to avoid interpolation

  LinodeInstance: expose vlanIp as an output if a vlan is added

  CopyableAsset: allow for environment variable to avoid cleaning all tmp folders (COPYABLE_ASSET_NO_CLEAN)

  Monitoring: Adding PrometheusService, PrometheusServiceWithSD, CAdvisor, NodeExport, and Grafana docker service
  for doing internal container monitoring

### Patch Changes

- Updated dependencies [cf1e368]
  - @hanseltime/pulumi-linux@1.2.0

## 0.2.0

### Minor Changes

- 0876b45: Applying more strict lint rules from biomev2 including fixing shadowing

### Patch Changes

- Updated dependencies [0876b45]
  - @hanseltime/pulumi-linux@1.1.0
  - @hanseltime/pulumi-linux-base@1.1.0
  - @hanseltime/pulumi-utils@1.1.0

## 0.1.6

### Patch Changes

- 420e044: More problems with changesets
- Updated dependencies [420e044]
  - @hanseltime/pulumi-linux@1.0.6
  - @hanseltime/pulumi-linux-base@1.0.6
  - @hanseltime/pulumi-utils@1.0.6

## 0.1.5

### Patch Changes

- eeb0a82: Applying fixes to changesets
- Updated dependencies [eeb0a82]
  - @hanseltime/pulumi-linux@1.0.5
  - @hanseltime/pulumi-linux-base@1.0.5
  - @hanseltime/pulumi-utils@1.0.5

## 0.1.4

### Patch Changes

- d301041: Fixing a changeset bug with yarn publishing
- Updated dependencies [d301041]
  - @hanseltime/pulumi-linux@1.0.4
  - @hanseltime/pulumi-linux-base@1.0.4
  - @hanseltime/pulumi-utils@1.0.4

## 0.1.3

### Patch Changes

- c2140cb: Fixing changeset publishing issue for yarn based monorepos
- Updated dependencies [c2140cb]
  - @hanseltime/pulumi-linux@1.0.3
  - @hanseltime/pulumi-linux-base@1.0.3
  - @hanseltime/pulumi-utils@1.0.3

## 0.1.2

### Patch Changes

- 2fe936e: Forcing patch bump for initial change sets
- Updated dependencies [2fe936e]
  - @hanseltime/pulumi-linux@1.0.2
  - @hanseltime/pulumi-linux-base@1.0.2
  - @hanseltime/pulumi-utils@1.0.2

## 0.1.1

### Patch Changes

- dfe2916: Initial pulumi resources after example test projects have proved them.
- Updated dependencies [dfe2916]
  - @hanseltime/pulumi-linux@1.0.1
  - @hanseltime/pulumi-linux-base@1.0.1
  - @hanseltime/pulumi-utils@1.0.1
