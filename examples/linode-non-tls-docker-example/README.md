# Linode Non-tls Example

This is a simple Pulumi project that will bring up a Linode in your account with 2 docker compose applications.

The applications will be:

1. Available on the exposed :8089 port and deployed via replacement
   1. The server on 8089 is an instance of the built Dockerfile [test-server](../test-server/)
2. Available through the blue-green port :80 **that has no tls**
   1. The server on available just uses the `traefik/whoami` server image

The only iptables rules applied are for a global blocklist with no IPs added at the moment.

## Testing it out

You can follow the prompts by running `initialize.sh`.

This script will ask you to enter sensitive credentials and will generate ssh keys for you!  Feel free to check the script
to make sure it isn't doing anything you don't want, and even feel free to manually run the commands.  This is mainly
a convenience that will create some files that aren't appropriate for an example template.

You will need:

1. Pulumi CLI installed and configured for a backend
2. A linode account and an API Token ready
3. ssh-keygen and a bash shell for the initialize.sh script

## running pulumi

We store your LINODE_TOKEN in the .env file (ignored in .gitignore).  Because of this, you will want to run:

```shell
set -a; source .env; set +a;
```

and then you can run your pulumi commands:

```shell
pulumi up
```

## Testing out your server

Once everything is deployed, you should be able curl your lindoe's ip address on the ports that were opened up:

```shell
# Look up your linode ip address
IP_ADDRESS=$(pulumi stack output instanceIp)

# curl the traefik/whoami server via the blue-green traefik server
curl $IP_ADDRESS/

# curl the exposed port 8089 that is not through the blue-green traefik server
curl $IP_ADDRESS:8089

# Read the secret we added
curl $IP_ADDRESS:8089/fromSecret/huh

# Read a mounted file we added
curl $IP_ADDRESS:8089/fromDir/file1.txt
```

Feel free to play around with the configuration until you feel comfortable knowing what configurations are controlling what.