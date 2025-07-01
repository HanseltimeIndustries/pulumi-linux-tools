# Linode Non-tls Example

This is a simple Pulumi project that will bring up a Linode in your account with 2 docker compose applications.

The applications will be:

1. Available on the exposed :8089 port and deployed via replacement
   1. The server on 8089 is an instance of the built Dockerfile [test-server](../test-server/)
2. Available through the blue-green port :80 **that has no tls**
   1. The server on available just uses the `traefik/whoami` server image

The only iptables rules applied are for a global blocklist with no IPs added at the moment.

## Monitoring

Since it is a best practice to be able to monitor your containers and applications, we also provide a configuration flag
that will also deploy:

1. A CAdvisor container for monitoring docker containers and cgroups on the machine
2. A NodeExporter container for monitoing the machine (node)'s process metrics
3. A Prometheus server for collecting metrics from these servers
4. A Grafana service with self-signed TLS certificate and CA for `grafana.example.com` that's exposed on port 3000 publicly
   1. We also have a slightly tweaked Docker and System Monitoring Dashboard (id: #893)

The monitoring stack is a more complicated setup that helps show a more fully fleshed out Docker container ecosystem.
Because of this, if you just want to test out container loading, do not enable monitoring.  When you want to start to
understand how you might monitor your docker systems, you can enable it.  You can use the `initialize-monitoring.sh` shell script
to do this later after having already run `intialize.sh`.

Please note, this setup does not do a good job of isolating disparate workloads.  You have a metrics aggregator (prometheus)
and metrics visualizer (grafana) on the same machine as your client-facing applications (`test-server` and `traefik/whoami`).
Since metrics queries can get expensive, you would either need to resource constrain these metrics containers or ideally move
them to a separate internal tools machine that, if it has CPU spikes and contention, cannot affect the applciations on your
customer facing machine.  This is an opinion and/or warning though, more than a hard rule.

## Connecting to Grafana

Since this uses TLS to ensure that you don't expose secrets and passwords, you will need to add an entry to your `/etc/hosts`
or equivalent for your OS that looks like `<machine public ip> grafana.example.com`.  This also means that, if you run
everything at once, you will run into a failure at the grafana service since there is no DNS entry for our fake domain until
you add that (this is not a problem if you are using a real registered DNS).

### Agent-Receiver Mode

There is an additional configuration flag that you can set that will also set up an example of having a lightweight prometheus
agent and then a prometheues server for collecting metrics from the agent.  This setup is overkill for a single machine, but helps
to demonstrate how, with a separated prometheus server on another machine in a network, you could set up an agent on your docker
machines and then pipe that data to another machine.

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

## Logging in to Grafana

Assuming you have updated your `/etc/hosts` file with the `grafana.example.com` entry as detailed above, you can log in to 
grafana at `grafana.example.com:3000` using the admin user.

You could always add a `grafana.oss.User` but if not, you will simply want to retrieve the admin password via 
`pulumi config get grafanaAdminCurrentPassword --show-secrets`.