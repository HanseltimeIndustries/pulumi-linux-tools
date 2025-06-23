# @hanseltime/pulumi-linux-vpn

[Raw docs](./docs/)

[TODO - put your Github Pages url here](TODO)

This is a typescript collection of pulumi resources that use SSH and SFTP to establish baseline resources for a linux 
(deb/ubuntu distro) machine that you would want to put a VPN on.  Note, right now, this just configures wireguard.  Contributions
to other set ups are welcomed.

## Note about resources

Since this is not an outright provider, this is only guaranteed to work via `npm/yarn/pnpm install` and inclusion in a typescript
project at the moment.

Additionally, since this is exposing ComponentResources that wrap multiple patterns, you will want to be mindful of your resource counts.
One resource from this package can mean multiple SSH commands, SFTP commands and linode commands.  Keep in mind that pulumi cloud free only allows
200 resources, so if the constructs are using too many of those resources, you will want to use a self-hosted backend.

# Installation

As noted above, this is only guaranteed to work for typescript pulumi projects at the moment.  If you would like to test the pulumi provider
compilation and provide improvements toward that, please feel free.

Install the package and its dependencies:

```shell
# yarn
yarn add @hanseltime/pulumi-linux-vpn @pulumi/pulumi @pulumi/command

# npm
npm install @hanseltime/pulumi-linux-vpn @pulumi/pulumi @pulumi/command

# pnpm
pnpm add @hanseltime/pulumi-linux-vpn @pulumi/pulumi @pulumi/command
```

# Resources

## About Connections

For all connections for these resources, you will need to provide SSH connection information for either the `root` user
or a user that is set up to be able to call sudo without a password.  This is because many of the commands require sudo and
cannot be interactive.

## WireGuardServer

This will sets up a wireguard server on the machine that provide for the connection.  The construct is a replication of sane and previously
working wireguard settings for ubuntu linux, but will require some of your own workflows more than likely.

We support three main functions for configuring the VPN:

1. Proxying to the public internet
   1. This is controlled by the `publicInternet` options
2. Connecting to a VLAN on a network interface
   1. This is controlled by the `vlan` options
3. Fully overriding and running your own wireguard settings

### To use the server

In order to use the server, you will need to have wireguard installed on your own machine and you will need to have generated a `public/private` key 
pair for your machine.  Once you have done that, you can supply the public key (even committing it or setting it as a config secret if that feels
better) as part of your peer configuration like so:

```typescript
const vpnServer = new WireGuardServer("machinetls-vpn-server", {
	connection: myMachineConnection,
	interfaceName: "wg0",
	network: new Network("machine1-vpn-network", "10.127.0.0/24"),
	serverIp: "10.127.0.1",
	listenPort: 51820,
	serverKeys: "create-on-server",
	peers: [
		{
			name: "myvpn",
			ip: "10.127.0.2",
			publicKey: readFileSync('public_keys/myvpn.public'), // Pretend you put the public key here and will commit it
			presharedKey: "create-on-server", 
		},
	],
    apt: {
		update: 0,
	},
});

export const vpnPublicKey: pulumi.Output<string> = vpnServer.publicKey;
export const clientPreSharedKey: pulumi.Output<string> =
	vpnServer.getPeerPreSharedKey("myvpn");
```

Let's break this down a little:

1. The VPN on whatever server you are SSH'ing into will have a vpn of `10.127.0.0/24` IPs.
   1. The wireguard server that we are setting up will be on `10.127.0.1` of that ip range
      1. The server will listen on port `51820`
   2. Likewise, the peer for our machine will be on `10.127.0.2` within the VPN network
2. On the machine,
   1. The VPN server will operate within a network interface that we will call `wg0`
   2. We will auto-generate server public and private keys and then can get the `publicKey` as an output
   3. We will also generate a preshared symmetric key for our machine to use for added security and can get it via `getPeerPreSharedKey("myvpn")` for client configuration
   4. The presence of the `apt` field means that we will install wireguard as part of this resource (or update it if we increase the number)
3. Finally, you can see that we've presumably stored out public key in a location and are reading it in for us to configure that client on the server.

### Warning about IpTables

As part of bringing up wireguard, there are certain iptables nat and forwarding rules that need to be set up.  If you just declare the resource as above, these resource will be brought up and down as part of wireguard's `PostUp` and `PostDown` processes.  The resource does a good job of managing
what the shell commands should be in order for this to work, but, if you are using something like `IpTablesChain` from 
`@hanseltime/pulumi-linux-iptables` in order to manage the entire FORWARD chain declaratively, you can run into an issue where, if you update that
chain, it will wipe the rules that were previously added via `PostUp` (since it treats itself as source of truth).

If you are managing a chain via `IpTablesChain`, we also expose the equivalent iptables rules via the `iptablesRules` property.  Because of this,
you can add them to the `IpTablesChain`.

```typescript
const forwardIpTablesChain = new IpTablesChain(
	"forward-chain",
	{
		name: "FORWARD",
		table: "filter",
		connection: instance.automationUserConnection,
		alreadyCreated: true,
		rulesIpV4: vpnServer.ipTablesRules.filter.forward.apply((fwdRules) => [blacklistV4, ...fwdRules]),
		rulesIpV6: [blacklistV6],
	},
	{
		// IMPORTANT! - do not let these run in parallel since that will lead to conflicts over trying to replace
		// iptables rows
		dependsOn: [ipv4BlacklistSet, ipv6BlacklistSet, vpnServer],
	},
);
```

In the above, you can see that we've gone ahead and added the rules for the `filter` table and `forward` chain to our `FORWARD` managed chain.
Additionally, we wouldn't have added any `nat POSTROUTING` rules if we didn't have an `IpTablesChain` for it, since we are not completely 
managing that chain and therefore wireguard is not at risk of having its iptables rules removed during running. 

As mentioned in the comment on `dependsOn`, make sure to wait for the `WireguardServer` so that you don't run into contention when modifying
iptables rules from both resources.

### Enabling public internet proxying

If you were to set up your wireguard server so that it allows public internet proxying, you can simply supply the network interface on the machine
that is the interface to the public internet.  The rest of the resource will construct the correct PostUp and IptablesRules for you.

```typescript
const vpnServer = new WireGuardServer("machinetls-vpn-server", {
    // normal config
    publicInternet: {
		interface: "eth0",
	},
});
```

With this created, you should be able to connect a correctly configured wireguard client and then perform queries to any publicly reachable website.
You can also check something like `whatismyipaddress` and verify that it is now your proxy machine's address.

### Enabling VLAN connection

In addition to setting up a proxy to public internet for your VPN traffic, you can also opt into connecting your VPN to the local area network on the 
machine with the wireguard server.

In this scenario, let's say that we have a vlan network interface on `eth1` that spans the range of `10.0.0.0/24`

### Full Manual

As an escape hatch, you can always specify the full wg-quick config.  This is not recommended since there are complicated shell commands at play
for things like iptables and how they may or may not interact with your other resources like `IpTablesChain`.