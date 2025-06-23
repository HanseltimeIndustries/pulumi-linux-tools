import type { Network } from "@hanseltime/pulumi-linux";
import { shellStrings } from "@hanseltime/pulumi-linux-base";
import type {
	IPFamily,
	IpV4TablesRule,
} from "@hanseltime/pulumi-linux-iptables";
import { createRuleCommand } from "@hanseltime/pulumi-linux-iptables";
import type { types } from "@pulumi/command";
import { remote } from "@pulumi/command";
import * as pulumi from "@pulumi/pulumi";
import { LIBRARY_PREFIX } from "./constants";

// import { IpV4TablesRule } from '@hanseltime/pulumi-linux-iptables'

interface PublicInternetOverrides {
	/**
	 * The network interface that wireguard should route clients through that is connected to the internet
	 * by default we try 'eth0'
	 */
	interface?: string;
}

interface ServerKeysInput {
	/**
	 * A private key that you generated and will be added to the server config.  Make sure it's not committed unencrypted anywhere
	 */
	private: string;
	/**
	 * The corresponding public key for the private key
	 */
	public: string;
}

export interface WireGuardServerArgs {
	/**
	 * If true, this will install wireguard via apt
	 */
	apt:
		| {
				/**
				 * This number will be used to re-apply an apt install after an update (in the event of upgrading)
				 */
				update: number;
		  }
		| false;
	/**
	 * This is the name of the interface on the machine that we're creating when we bring it up
	 */
	interfaceName: pulumi.Input<string>;
	connection: pulumi.Input<types.input.remote.ConnectionArgs>;
	/**
	 * This is the network declaration for clients on the VPN.  Make sure it does not overlap any other networks exposed
	 * to the machine.
	 *
	 * We will also use the `claimIP` method internally to make sure that the ip of each peer does not overlap
	 */
	network: Network;
	/**
	 * This is the ip address within the whole network that this server should have
	 */
	serverIp: pulumi.Input<string>;
	/**
	 * The port that the server is listening on
	 */
	listenPort: pulumi.Input<number>;

	serverKeys: pulumi.Input<ServerKeysInput | "create-on-server">;
	/**
	 * The clients that are allowed to connect to this wireguard server
	 */
	peers: pulumi.Input<
		pulumi.Input<{
			/**
			 * A human-readable name for the peer
			 */
			name: pulumi.Input<string>;
			/**
			 * The public key that you generated for the peer
			 */
			publicKey: pulumi.Input<string>;
			/**
			 * The ip that the peer is expected to have
			 */
			ip: pulumi.Input<string>;
			/**
			 * We enforce the added security of a preshared key by default since its
			 * a general best practice.
			 *
			 * By default, we do 'create-on-server' shared key generation.  You can either
			 * supply a presharedKey that you have already generated or set this to false
			 * in the event that you actually do not want the added encryption.
			 *
			 * This is then exposed via the getPeerPresharedKey() method and provide it as an output.
			 */
			presharedKey: pulumi.Input<string | "create-on-server" | false>;
		}>[]
	>;
	/**
	 * If you want to set up public internet access through this WireGuard server, set this to true or provide
	 * specific overrides
	 */
	publicInternet?: pulumi.Input<PublicInternetOverrides | boolean>;

	vlan?: pulumi.Input<{
		/**
		 * The network interface to forward traffic from our wireguard server to.
		 * This should be used for VLAN network interfaces if you want to provide access to them as well.
		 */
		interface: pulumi.Input<string>;
		/**
		 * The network cidr of the vlan we're connecting to
		 */
		cidr: pulumi.Input<string>;
	}>;

	/**
	 * If you want full control over the wireguard configuration, you can supply any fields here
	 *
	 * This will FULLY override any key of the pre-configured values from the above, so think carefully.
	 *
	 * It will still look like a merge if you are adding a key that is different - we only do this for the [Interface]
	 */
	wgQuickInterface?: {
		[key: string]: string;
	};
}

export class WireGuardServer extends pulumi.ComponentResource {
	/**
	 * The public key of the vpn server - mainly meant to be used so that you can output it from the stack and
	 * use it for construction of wireguard client configurations
	 */
	readonly publicKey: pulumi.Output<string>;
	/**
	 * The port this server is listening on
	 */
	readonly port: pulumi.Output<number>;

	/**
	 * This is the peers configuration option as an output
	 *
	 * Use the peer look up methods over this on the wireguard server resource
	 */
	readonly peersConfig: pulumi.Output<
		{
			/**
			 * A human-readable name for the peer
			 */
			name: string;
			/**
			 * The public key that you generated for the peer
			 */
			publicKey: string;
			/**
			 * The ip that the peer is expected to have
			 */
			ip: string;
			/**
			 * The presharedKey configuration for the peer
			 */
			presharedKey: string | false;
		}[]
	>;

	/**
	 * These are iptable rules that can (and should) be added to any IpTablesChain
	 * resources since those resources will rewrite that chain on update and using PostUp
	 * may not be enough in that regard.
	 */
	readonly ipTablesRules: pulumi.Output<{
		/**
		 * Rules for the nat table and chains that wireguard uses
		 */
		nat: {
			postrouting: IpV4TablesRule[];
		};
		/**
		 * Rules for the filter table and chains that wireguard uses
		 */
		filter: {
			forward: IpV4TablesRule[];
		};
	}>;

	/**
	 * This is a map of peer names to their preshared keys if they had the presharedKey
	 * options set on them. Accessed by getPeerPreSharedKey()
	 */
	private peerPresharedKeyMap: pulumi.Output<Map<string, string>>;

	constructor(
		name: string,
		args: WireGuardServerArgs,
		opts?: pulumi.ComponentResourceOptions,
	) {
		super(`${LIBRARY_PREFIX}::Wireguard`, name, args, opts);

		const linePrefix = `Public Key: `;

		const { network } = args;

		const { createConfig, wireguardDown, port, peersOutput, ipTablesRules } =
			pulumi
				.output(args)
				.apply(
					({
						peers,
						serverIp,
						vlan,
						publicInternet,
						serverKeys,
						interfaceName,
						listenPort,
						wgQuickInterface,
					}) => {
						// make sure peers are unique
						peers.reduce((s, p, idx) => {
							if (s.has(p.name)) {
								throw new pulumi.InputPropertyError({
									propertyPath: `peers[${idx}].name`,
									reason: `A peer with name ${p.name} already exists.  Must be unique!`,
								});
							}
							s.add(p.name);
							if (p.presharedKey) {
								if (p.presharedKey !== "create-on-server") {
									if (
										Buffer.from(p.presharedKey, "base64").toString("base64") ===
										p.presharedKey
									) {
										throw new pulumi.InputPropertyError({
											propertyPath: `peers[${idx}].name`,
											reason: `The provided presharedKey must be 'create-on-server' or a valid base64 encoded key`,
										});
									}
								}
							}
							return s;
						}, new Set<string>());

						const wireguardConfPath = "/etc/wireguard";
						function pskeyEnv(pname: string) {
							return `PSKEY_${pname.toUpperCase()}`;
						}
						const peerPresharedKeyCreate = peers
							.map((p) => {
								if (!p.presharedKey) {
									return;
								}
								const pskeyPath = `${wireguardConfPath}/pskey_${p.name}`;
								let writeKey =
									p.presharedKey === "create-on-server"
										? `if [ ! -f "${pskeyPath}" ]; then wg genpsk > ${pskeyPath} && chmod 700 ${pskeyPath}; fi`
										: `echo "${p.presharedKey}" > ${pskeyPath} && chmod 700 ${pskeyPath}`;
								const envKey = pskeyEnv(p.name);
								const prefix = this.userPresharedPrefix(p.name);
								// Finally echo the key so we can parse it for client generation, etc.
								return `${writeKey} && ${envKey}=$(cat ${pskeyPath}) && echo "${prefix}\${${envKey}}"`;
							})
							.filter((s) => !!s)
							.join(" && ");
						const peerConfigStrings = peers.reduce((str, p) => {
							network.claimIP(p.ip, p.name);
							let presharedLine = "";
							if (p.presharedKey) {
								presharedLine = `PresharedKey = \${${pskeyEnv(p.name)}}\n`;
							}

							return `${str}\n[Peer]\nPublicKey = ${p.publicKey}\nAllowedIPs = ${p.ip}/32\n${presharedLine}`;
						}, "");

						// TODO: not sure if its worth constructing a post up that always
						// references the key file instead of just having the config
						// https://documentation.ubuntu.com/server/how-to/wireguard-vpn/security-tips/index.html
						let postUp = "sysctl -w net.ipv4.ip_forward=1;";
						let postDown = "sysctl -w net.ipv4.ip_forward=0;";
						const iptablesRulesRet = {
							nat: {
								postrouting: [] as IpV4TablesRule[],
							},
							filter: {
								forward: [] as IpV4TablesRule[],
							},
						};

						if (publicInternet) {
							const { up, down, natRules, forwardRules } =
								this.createPublicInternetForwardRoutingRule(
									(publicInternet as PublicInternetOverrides).interface ??
										"eth0",
									interfaceName,
								);
							postUp += up + ";";
							postDown += down + ";";
							iptablesRulesRet.nat.postrouting.push(...natRules);
							iptablesRulesRet.filter.forward.push(...forwardRules);
						}

						if (vlan) {
							const { up, down, natRules, forwardRules } =
								this.createVlanForwardRoutingRule(
									vlan.interface,
									network.cidr,
									vlan.cidr,
									interfaceName,
								);
							postUp += up + ";";
							postDown += down + ";";
							iptablesRulesRet.nat.postrouting.push(...natRules);
							iptablesRulesRet.filter.forward.push(...forwardRules);
						}

						// Make sure we claim the ip for this server
						network.claimIP(serverIp, "wireguard-server");

						const privateKeyPath = `${wireguardConfPath}/privatekey`;
						const publicKeyPath = `${wireguardConfPath}/publickey`;
						const createKeys = `wg genkey | tee ${privateKeyPath} | wg pubkey > ${publicKeyPath} && chmod -R 700 /etc/wireguard`;
						const privateKey =
							serverKeys === "create-on-server"
								? "${P_KEY}"
								: serverKeys.private;

						// Since we're going to do shell writing we use environment variables
						const interfaceConfig = {
							PrivateKey: privateKey,
							Address: `${serverIp}/${network.maskNumber}`,
							PostUp: postUp.replaceAll("$", "\\$"), // Escape any dollar actions
							PostDown: postDown.replaceAll("$", "\\$"),
							ListenPort: `${listenPort}`,
							...wgQuickInterface,
						};

						const interfaceConfigString = Object.keys(interfaceConfig).reduce(
							(str, cKey) => {
								return `${str}${cKey} = ${interfaceConfig[cKey as keyof typeof interfaceConfig]}\n`;
							},
							"[Interface]\n",
						);

						const autogen =
							serverKeys === "create-on-server"
								? `if [ ! -f ${privateKeyPath} ]; then ${createKeys}; fi && P_KEY=$(cat ${privateKeyPath})`
								: "";
						const publicKeyReturn =
							serverKeys === "create-on-server"
								? `echo "${linePrefix}$(cat ${publicKeyPath})"`
								: `echo "${linePrefix}${serverKeys.public}"`;
						const configFileForEcho = `${interfaceConfigString}\n${peerConfigStrings}`;
						const createConfigRet = `${autogen}${peerPresharedKeyCreate ? ` && ${peerPresharedKeyCreate}` : ""} && cat <<EOF > /etc/wireguard/${interfaceName}.conf\n${configFileForEcho}\nEOF\n ${publicKeyReturn}`;
						const wireguardUpRet = `wg-quick up ${interfaceName} && sudo systemctl enable wg-quick@${interfaceName}`;
						const wireguardDownRet = `wg-quick down ${interfaceName} && sudo systemctl disable wg-quick@${interfaceName}`;

						return {
							createConfig: `${createConfigRet} && ${wireguardUpRet}`,
							wireguardDown: wireguardDownRet,
							port: listenPort,
							peersOutput: peers,
							ipTablesRules: iptablesRulesRet,
						};
					},
				);

		let install: remote.Command | undefined;
		if (args.apt) {
			install = new remote.Command(
				`${name}-wireguard-install`,
				{
					connection: args.connection,
					create: shellStrings.asSudoOutput(
						"apt update && apt install -y wireguard",
					),
					triggers: [args.apt.update],
				},
				{
					parent: this,
					dependsOn: opts?.dependsOn,
				},
			);
		}

		const configure = new remote.Command(
			`${name}-wireguard-up`,
			{
				connection: args.connection,
				create: shellStrings.asSudoOutput(pulumi.secret(createConfig)),
				delete: shellStrings.asSudoOutput(wireguardDown),
				triggers: [createConfig, args.apt],
			},
			{
				parent: this,
				dependsOn: install
					? pulumi.output(opts?.dependsOn).apply((depsOn) => {
							if (Array.isArray(depsOn)) {
								return [...depsOn, install];
							}
							if (depsOn) {
								return [depsOn, install];
							}
							return [install];
						})
					: opts?.dependsOn,
				deleteBeforeReplace: true,
			},
		);

		const { peerKeyMap, publicKey } = pulumi
			.output({
				sout: configure.stdout,
				peersIn: peersOutput,
			})
			.apply(({ sout, peersIn }) => {
				const publicKeyIdx = sout.indexOf(linePrefix);

				if (publicKeyIdx < 0) {
					throw new Error(`Could not detect server public key!`);
				}
				const publicKeyEnd = sout.indexOf("\n", publicKeyIdx);
				const publicKeyRet = sout.substring(
					publicKeyIdx + linePrefix.length,
					publicKeyEnd < 0 ? sout.length : publicKeyEnd,
				);

				const peerKeyMapRet = peersIn.reduce((map, p) => {
					if (p.presharedKey) {
						const prefix = this.userPresharedPrefix(p.name);
						const userKeyIdx = sout.indexOf(prefix);
						if (userKeyIdx < 0) {
							throw new Error(
								`Could not detect user ${name} preshared key in output!`,
							);
						}
						const userKeyEnd = sout.indexOf("\n", userKeyIdx);
						map.set(
							p.name,
							sout.substring(
								userKeyIdx + prefix.length,
								userKeyEnd < 0 ? sout.length : userKeyEnd,
							),
						);
					}
					return map;
				}, new Map<string, string>());
				return {
					peerKeyMap: peerKeyMapRet,
					publicKey: publicKeyRet,
				};
			});
		this.publicKey = publicKey;
		this.port = pulumi.unsecret(port);
		this.peersConfig = pulumi.secret(peersOutput);
		this.peerPresharedKeyMap = peerKeyMap;
		(this.ipTablesRules = ipTablesRules),
			this.registerOutputs({
				publicKey: this.publicKey,
				port: this.port,
				peers: this.peersConfig,
				ipTablesRules: this.ipTablesRules,
			});
	}

	createPublicInternetForwardRoutingRule(
		publicInterface: string,
		wgInterface: string,
	) {
		const forwardFromVpnRule: IpV4TablesRule = {
			inInterface: wgInterface,
			jump: "ACCEPT",
		};
		const natToPublicInterfaceRule: IpV4TablesRule = {
			outInterface: publicInterface,
			jump: "MASQUERADE",
		};
		// -i ${publicInterface} -o %i -m state --state RELATED,ESTABLISHED -j ACCEPT
		const forwardConnectionsRule: IpV4TablesRule = {
			inInterface: publicInterface,
			outInterface: wgInterface,
			matchingModule: {
				state: "--state RELATED,ESTABLISHED",
			},
			jump: "ACCEPT",
		};

		const forwardFromVpnOpts = {
			family: "inet" as IPFamily,
			table: "filter",
			chain: "FORWARD",
			rule: forwardFromVpnRule,
			onlyIfMissing: true,
		};
		const forwardFromVpn = createRuleCommand({
			...forwardFromVpnOpts,
			operator: "insert",
		});
		const forwardFromVpnDelete = createRuleCommand({
			...forwardFromVpnOpts,
			operator: "delete",
		});

		const natToPublicOpts = {
			family: "inet" as IPFamily,
			table: "nat",
			chain: "POSTROUTING",
			rule: natToPublicInterfaceRule,
			onlyIfMissing: true,
		};
		const natToPublic = createRuleCommand({
			...natToPublicOpts,
			operator: "insert",
		});
		const natToPublicDelete = createRuleCommand({
			...natToPublicOpts,
			operator: "delete",
		});
		const forwardConnectionsOpts = {
			family: "inet" as IPFamily,
			table: "filter",
			chain: "FORWARD",
			rule: forwardConnectionsRule,
			onlyIfMissing: true,
		};
		const forwardConnections = createRuleCommand({
			...forwardConnectionsOpts,
			operator: "append",
		});
		const forwardConnectionsDelete = createRuleCommand({
			...forwardConnectionsOpts,
			operator: "delete",
		});

		return {
			up: `${forwardFromVpn}; ${natToPublic}; ${forwardConnections}`,
			down: `${forwardFromVpnDelete}; ${natToPublicDelete}; ${forwardConnectionsDelete}`,
			natRules: [natToPublicInterfaceRule],
			forwardRules: [forwardFromVpnRule, forwardConnectionsRule],
		};
	}

	createVlanForwardRoutingRule(
		vlanInterface: string,
		vpnCIDR: string,
		vlanCIDR: string,
		wgInterface: string,
	) {
		// iptables -I FORWARD -i %i -o ${vlanInterface} -s ${vpnCIDR} -d ${vlanCIDR} -j ACCEPT
		const forwardFromVpnRule: IpV4TablesRule = {
			inInterface: wgInterface,
			outInterface: vlanInterface,
			source: vpnCIDR,
			destination: vlanCIDR,
			jump: "ACCEPT",
		};
		// iptables -I FORWARD -i eth1 -o %i -s ${vlanCIDR} -d ${vpnCIDR} -m state --state RELATED,ESTABLISHED -j ACCEPT
		const forwardConnectionsRule: IpV4TablesRule = {
			inInterface: vlanInterface,
			destination: vpnCIDR,
			matchingModule: {
				state: "--state RELATED,ESTABLISHED",
			},
			jump: "ACCEPT",
		};
		const natToVlanRule: IpV4TablesRule = {
			source: vpnCIDR,
			destination: vlanCIDR,
			jump: "MASQUERADE",
		};
		const forwardFromVpnOpts = {
			family: "inet" as IPFamily,
			table: "filter",
			chain: "FORWARD",
			rule: forwardFromVpnRule,
			onlyIfMissing: true,
		};
		const forwardFromVpn = createRuleCommand({
			...forwardFromVpnOpts,
			operator: "insert",
		});
		const forwardFromVpnDelete = createRuleCommand({
			...forwardFromVpnOpts,
			operator: "delete",
		});

		const natToVlanOpts = {
			family: "inet" as IPFamily,
			table: "nat",
			chain: "POSTROUTING",
			rule: natToVlanRule,
			onlyIfMissing: true,
		};
		const natToVlan = createRuleCommand({
			...natToVlanOpts,
			operator: "insert",
		});
		const natToVlanDelete = createRuleCommand({
			...natToVlanOpts,
			operator: "delete",
		});
		const forwardConnectionsOpts = {
			family: "inet" as IPFamily,
			table: "filter",
			chain: "FORWARD",
			rule: forwardConnectionsRule,
			onlyIfMissing: true,
		};
		const forwardConnections = createRuleCommand({
			...forwardConnectionsOpts,
			operator: "append",
		});
		const forwardConnectionsDelete = createRuleCommand({
			...forwardConnectionsOpts,
			operator: "delete",
		});

		return {
			up: `${forwardFromVpn}; ${forwardConnections}; ${natToVlan}`,
			down: `${forwardFromVpnDelete}; ${forwardConnectionsDelete}; ${natToVlanDelete}`,
			natRules: [natToVlanRule],
			forwardRules: [forwardFromVpnRule, forwardConnectionsRule],
		};
	}
	/**
	 * Simple helper method for getting the allowed IP CIDR from a peer name
	 * that would go in the config as:
	 * [Interface]
	 * Address = <here>
	 * @param name
	 */
	getPeerAddress(name: string) {
		return pulumi.unsecret(
			this.peersConfig.apply((peersIn) => {
				const peer = peersIn.find((p) => p.name === name);
				if (!peer) {
					throw new Error(`Could not find a peer by name: ${name}`);
				}
				return `${peer.ip}/32`;
			}),
		);
	}
	/**
	 * Simple helper method for getting the allowed IP CIDR from a peer name
	 * that would go in the config as:
	 * [Peer]
	 * PresharedKey = <here>
	 * @param name
	 */
	getPeerPreSharedKey(name: string) {
		return this.peerPresharedKeyMap.apply((pMap) => {
			const presharedKey = pMap.get(name);
			if (!presharedKey) {
				throw new Error(
					`Could not find a preshared key for peer by name: ${name}`,
				);
			}
			return presharedKey;
		});
	}

	private userPresharedPrefix(name: string) {
		return `${name} PresharedKey: `;
	}
}
