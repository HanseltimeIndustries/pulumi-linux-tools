[**@hanseltime/pulumi-linux-docker**](../README.md)

***

[@hanseltime/pulumi-linux-docker](../README.md) / WaitOnChildren

# Interface: WaitOnChildren

Since pulumi does not seem to honor component resource dependencies and their children, we have a
simple interface that declares a last: Resource

## Properties

### last

> **last**: `Input`\<`Resource`\>

The last child that should be dependedOn
