# @hanseltime/pulumi-linux-iptables

[API docs](./docs/api)

<!-- [TODO - put your Github Pages url here](TODO) -->

This is a typescript collection of pulumi resources that use SSH and SFTP to establish baseline resources for a linux 
(deb/ubuntu distro) machine in order to create declarative iptables settings.

## Note about resources

Since this is not an outright provider, this is only guaranteed to work via `npm/yarn/pnpm install` and inclusion in a typescript
project at the moment.

Additionally, since this is exposing ComponentResources that wrap multiple patterns, you will want to be mindful of your resource counts.
One resource from this package can mean multiple SSH commands, SFTP commands and linode commands.  Keep in mind that pulumi cloud free only allows
200 resources, so if the constructs are using too many of those resources, you will want to use a self-hosted backend.

## Supplemental resources

Many of the helpers and resources are strongly typing the ipsets and iptables commands for you.  If you have any questions
about an option, you can always cross reference it with the linux manpage for `iptables` or `ipsets`.

# Installation

Right now this is only guaranteed to work for typescript pulumi projects at the moment.  If you would like to test the pulumi provider
compilation and provide improvements toward that, please feel free.

Install the package and its dependencies:

```shell
# yarn
yarn add @hanseltime/pulumi-linux-iptables @pulumi/pulumi @pulumi/command

# npm
npm install @hanseltime/pulumi-linux-iptables @pulumi/pulumi @pulumi/command

# pnpm
pnpm add @hanseltime/pulumi-linux-iptables @pulumi/pulumi @pulumi/command
```

# Resources

There are multiple resources that we recommend you use together to ensure that your linux machine has correct iptables
configuration.

## IpTablesInstall

The IpTablesInstall resource will install the appropriate apt packages for:

1. iptables
2. ipset utilities (this is preferrable to individual ip rules for better look up times)
3. iptables and ipset persistent packages to ensure iptables rules are restorable on reboots

This should be the first dependency in any iptables resource chains for a machine.

```typescript
const ipTablesInstall = new IpTablesInstall(
	"mahcine1-iptables-install",
	{
		connection: machine1automationuser,
	},
);
```

## Helper IpSet

There is an IpSet helper resource that makes it easier to declare ipsets that you can reference inside of an iptables rule.

This is not a pulumi resource, but can be passed to pulumi resources like `IpSetResource` and `IpTablesChain`.

```typescript
// You can save these in a file like iptables.ts
export const globalBlockIpSetIpv4 = IpSet.HashIp("GLOBAL_BLOCK_IPV4", {
	family: "inet",
});
export const globalBlockIpSetIpv6 = IpSet.HashIp("GLOBAL_BLOCK_IPV6", {
	family: "inet6",
});
// Add ips via globalBlockIpSetIpv6.add("ip")

export const blacklistV4: IpV4TablesRule = {
	jump: "DROP",
	matchingModule: {
		set: globalBlockIpSetIpv4.matchArgs(["src"]),
	},
};

export const blacklistV6: IpV6TablesRule = {
	jump: "DROP",
	matchingModule: {
		set: globalBlockIpSetIpv6.matchArgs(["src"]),
	},
};
```

The above is setting up a HashIp ipset for ipv6 and ipv4 that we can add blocked ips to manually.

We also use the resultant IpSets to construct some reusable rules that say to `Drop` any incoming `src` that
matches our block list for the respective ip families.

If I wanted to add a new ip to the blocklist, I could just make a declarative entry and commit it to my pulumi
project:

```typescript
globalBlockIpSetIpv4.add('111.111.111.23')
```

## Helper PredefinedRules

You can use the `PredefinedRules` class's static methods to create common iptables rule configurations rather than having to remember it each time.  Please look at the class itself or its api documentation. 

## IpSetResource

Now that we have an IpSet helper, we need to actually have the linux machine create the ip set.  To do that, we supply
the IpSetResource with the respective IpSet.

The following will:

1. Create the ipv4 and ipv6 blocklists (or update their ips if the ipset changed)
2. make sure to wait on the iptablesInstall resource before doing so

```typescript
const ipv4BlacklistSet = new IpSetResource(
	"ipv4-blacklist",
	{
		connection: instance.automationUserConnection,
		ipSet: globalBlockIpSetIpv4,
	},
	{
		dependsOn: [ipTablesInstall],
	},
);

const ipv6BlacklistSet = new IpSetResource(
	"ipv6-blacklist",
	{
		connection: instance.automationUserConnection,
		ipSet: globalBlockIpSetIpv6,
	},
	{
		dependsOn: [ipTablesInstall],
	},
);
```

## IpTablesChain

This resource controls exclusively an iptables chain that exists.  In the normal Linux iptables flow, this would mean that
you would probably want to declare a chain for the `INPUT` and `FORWARD` standard filter chains since that would be how you
handle firewall rules.

Keep in mind that, by adding a resource for the `INPUT` chain, all iptables rules need to be declared here, since we override
the chains rules in order to make sure that artifacts do not create security holes and that we do updates that do not 
interrupt traffic.

Following the block list examples fromm the IpSets, we could set up our `INPUT` and `FORWARD` chains to apply the correct
blocklist rules that we defined previously.

```typescript
const forwardIpTablesChain = new IpTablesChain(
	"forward-chain",
	{
		name: "FORWARD",
		table: "filter",
		connection: instance.automationUserConnection,
		alreadyCreated: true, // Since its standard, we are just controlling and not creating this chain
        rulesIpV4: [blacklistV4],
        rulesIpV6: [blacklistV6],
	},
	{
		dependsOn: [ipv4BlacklistSet, ipv6BlacklistSet],
	},
);
const inputIpTablesChain = new IpTablesChain(
	"input-v4-chain",
	{
		name: "INPUT",
		table: "filter",
		connection: instance.automationUserConnection,
		alreadyCreated: true, // Since its standard, we are just controlling and not creating this chain
        rulesIpV4: [blacklistV4],
        rulesIpV6: [blacklistV6],
	},
	{
		dependsOn: [ipv4BlacklistSet, ipv6BlacklistSet],
	},
);
```

As you can see, if you wanted to add a port restriction or some other rules, you can easily just add the rules into this
list and they will be evaluated from front to back.

### Very important - IpTablesSave

The final and most important resource is the `IpTablesSave` resource.  This resource is **required** for your iptables
rules and ipsets to still persist on machine reboot.  If you do not use `IpTablesSave`, then once a machine is rebooted
you will find that your rules no longer exist!  That's a design of the iptables system (specifically to avoid being
locked out by bad iptables rules), however, since we are doing declarative IAC, we do not want iptables rules to suddenly be
gone.

The `IpTablesSave` resource must be called last of all iptables resources for a machine so that it can save any iptables
and ipset configs that will be re-applied via the `iptables-persist` and `ipset-persist` packages that we installed with
the `IpTablesInstall`.

Following with our blacklist sets and two ip tables chains, we can create an an `IpTablesSave` like so:

```typescript
new IpTablesSave(
	"save-config",
	{
		connection: instance.automationUserConnection,
		ipTablesResources: [
			ipv4BlacklistSet,
			ipv6BlacklistSet,
			forwardIpTablesChain,
			inputIpTablesChain,
		],
	},
);
```
