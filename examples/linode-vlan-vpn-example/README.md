# Linode Public VLAN Vpn Example

This is a simple Pulumi project that will bring up two Linodes on a vlan in your account with a wireguard server
running on one that is configured to forward requests to your VLAN interface (eth1).

The wireguard server expects that you have set up and started a wireguard client on your own machine
that you can derive with the helper `generate-client-config.sh` after bringing up the server.  The client
configuration that we create in this instance is a split-tunnel client since the wireguard server is currently
configured to only nat to the vlan interface and not the public internet.  This is ideal for getting access to
servers that are only available internally on the network while minimizing data through the machines.

The wireguard server is setup so that:

1. It creates a public and private key on the server and then outputs the public key for client config
2. It adds a public key for your current machine private key and generates a preshared key for the client
   and adds it as an output for use in that client config
3. It proxies a network space of `10.127.0.0/24` ips and assigns `10.127.0.2` for the peer and 
   `10.127.0.1` for the server
4. It sets up masquerading rules on the nat so that anything from the server looks like it's from
   the `10.0.0.1` machine ip on the VLAN network `10.0.0.0/24`

The general workflow that you would use when doing something like this in your own infrastructure
would be to:

1. Have a script that uses wireguard to generate user keys:
   1. Store the private keys in a temporary location for each user
   2. Store the public keys 
      1. in a committable folder for the repo
      2. OR if you don't like that, pipe the public key as a pulumi secret value that will be committed
      but encrypted.
2. You would add peer connections to `WireguardServer` that reference the correct public keys
3. Bring up the wireguard server so that its public key is available as a pulumi output
4. You would then take each private key and the server public key output and generate an appropriate wireguard client configuration file
5. You would then securely provide that client configuration to your team members
6. Your team members would apply the wireguard config and start their wireguard client

## Note about iptables

If you were to set up your linodes so that they were mainly accesible internally (with egress to the public internet
for things like updates), you would need to add more iptables rules. Since this is just meant to add iptables rules for
the wireguard linode instance, you would need to add iptables rules to the other linode as well before making this production
ready.

## Testing it out

You can follow the prompts by running `initialize.sh`.

This script will ask you to enter sensitive credentials and will generate ssh keys for you and will run
the standared wireguard commands to generate a personal private and public key for your machine. 
Feel free to check the script to make sure it isn't doing anything you don't want,
and even feel free to manually run the commands.  This is mainly
a convenience that will create some files that aren't appropriate for commiting in an example template.

You will need:

1. Pulumi CLI installed and configured for a backend
2. [Wireguard CLI](https://www.wireguard.com/install/) installed
3. A linode account and an API Token ready
4. ssh-keygen and a bash shell for the initialize.sh script

## running pulumi

We store your LINODE_TOKEN in the .env file (ignored in .gitignore).  Because of this, you will want to run:

```shell
set -a; source .env; set +a;
```

and then you can run your pulumi commands:

```shell
pulumi up
```

## Generating your client config

Once you have brought your linode and wireguard server up, you will need to set up your client side
wireguard connection.

We provide a script `./generate-client-config.sh` that just needs to have a name for the config file
and will, by default, use the expected stack outputs of client configurations.

```shell
./generate-client-config.sh wg0.conf
```

This will write your configuration to `wg_configs/wg0.conf`.  Once it has been written, you will need to
place this config in the appropriate configuration location and then bring up your interface.

For Linux, this would involve:

```shell
# move the config to the correct location
sudo mv wg_configs/wg0.conf /etc/wireguard/
# protect the secrets by making them root only
sudo chmod 700 /etc/wireguard/wg0.conf
```

Then to bring up your vpn, you would call: 

```shell
wg-quick up wg0
```

## Testing out your server

Once everything is deployed and your VPN is up, you can check a few things:

```shell
# ensure you can ping the linode that your wireguard server is on (on its network)
ping 10.127.0.1

# test that you can access the machines on vlan
# The network address of the linode with the wireguard server
ping 10.0.0.1
# the other linode on the network
ping 10.0.0.2
```

Feel free to play around with the configuration until you feel comfortable knowing what configurations are controlling what.
You can also add things like DockerComposeServices on just the vlan interface to verify that you can reach them when the vpn
is connected!