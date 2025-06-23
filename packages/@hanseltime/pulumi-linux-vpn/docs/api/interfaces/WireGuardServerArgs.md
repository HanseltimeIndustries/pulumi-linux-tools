[**@hanseltime/pulumi-linux-vpn**](../README.md)

***

[@hanseltime/pulumi-linux-vpn](../README.md) / WireGuardServerArgs

# Interface: WireGuardServerArgs

## Properties

### apt

> **apt**: `false` \| \{ `update`: `number`; \}

If true, this will install wireguard via apt

#### Type declaration

`false`

\{ `update`: `number`; \}

#### update

> **update**: `number`

This number will be used to re-apply an apt install after an update (in the event of upgrading)

***

### connection

> **connection**: `Input`\<`ConnectionArgs`\>

***

### interfaceName

> **interfaceName**: `Input`\<`string`\>

This is the name of the interface on the machine that we're creating when we bring it up

***

### listenPort

> **listenPort**: `Input`\<`number`\>

The port that the server is listening on

***

### network

> **network**: `Network`

This is the network declaration for clients on the VPN.  Make sure it does not overlap any other networks exposed
to the machine.

We will also use the `claimIP` method internally to make sure that the ip of each peer does not overlap

***

### peers

> **peers**: `Input`\<`Input`\<\{ `ip`: `Input`\<`string`\>; `name`: `Input`\<`string`\>; `presharedKey`: `Input`\<`string` \| `false`\>; `publicKey`: `Input`\<`string`\>; \}\>[]\>

The clients that are allowed to connect to this wireguard server

***

### publicInternet?

> `optional` **publicInternet**: `Input`\<`boolean` \| `PublicInternetOverrides`\>

If you want to set up public internet access through this WireGuard server, set this to true or provide
specific overrides

***

### serverIp

> **serverIp**: `Input`\<`string`\>

This is the ip address within the whole network that this server should have

***

### serverKeys

> **serverKeys**: `Input`\<`ServerKeysInput` \| `"create-on-server"`\>

***

### vlan?

> `optional` **vlan**: `Input`\<\{ `cidr`: `Input`\<`string`\>; `interface`: `Input`\<`string`\>; \}\>

***

### wgQuickInterface?

> `optional` **wgQuickInterface**: `object`

If you want full control over the wireguard configuration, you can supply any fields here

This will FULLY override any key of the pre-configured values from the above, so think carefully.

It will still look like a merge if you are adding a key that is different - we only do this for the [Interface]

#### Index Signature

\[`key`: `string`\]: `string`
