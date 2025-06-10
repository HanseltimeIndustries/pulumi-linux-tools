[**@hanseltime/pulumi-linux-docker**](../README.md)

***

[@hanseltime/pulumi-linux-docker](../README.md) / DockerDeployType

# Enumeration: DockerDeployType

## Enumeration Members

### BlueGreen

> **BlueGreen**: `"blue-green"`

This assumes that you have a traefik service set up (via DockerInstall resource) and promises to deploy
the newly built images along side the old images and then tear them down once they report healthy via Docker
status check

***

### Manual

> **Manual**: `"manual"`

This will copy and build the new image but will not deploy it - should we even use this

***

### Replace

> **Replace**: `"replace"`

This will stop one pod and bring up the new pod - this has downtime and has no fallback if the up fails
