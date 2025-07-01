---
"@hanseltime/pulumi-file-utils": minor
"@hanseltime/pulumi-linode": minor
"@hanseltime/pulumi-linux": minor
"@hanseltime/pulumi-linux-docker": minor
---

Adding Docker Monitoring Functionality

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