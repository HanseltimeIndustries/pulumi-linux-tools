import type {
	InvertableIpV4TablesProps,
	InvertableIpV6TablesProps,
	IPFamily,
	IpTablesChainArgs,
	IpV4TablesRule,
	IpV6TablesRule,
} from "./types";

export function createBaseCommand(family: IPFamily, table: string) {
	let cmd: string;
	switch (family) {
		case "inet":
			cmd = `iptables`;
			break;
		case "inet6":
			cmd = `ip6tables`;
			break;
		default:
			throw new Error(`Unexpected family: ${family}`);
	}
	return `${cmd} -t ${table} -w`;
}

export function createCreateCommand(base: string, name: string) {
	return `if [ "$(${base} -L ${name} 2> /dev/null || echo 'notset')" == "notset" ]; then ${base} -N ${name}; fi`;
}

export function createFullDeleteCommand(base: string, name: string) {
	return `${base} -X ${name}`;
}

export function createChainCommands(
	options: IpTablesChainArgs & { noSudo?: boolean },
) {
	const { name, table, rulesIpV4, rulesIpV6, alreadyCreated } = options;
	// Do this since this can lead to "all table" behavior
	if (!name) {
		throw new Error("chain name must be non-empty");
	}

	const sudoPortion = options.noSudo ? "" : "sudo ";

	const ipv4Commands = createChainCommandsForFamily(
		sudoPortion + createBaseCommand("inet", table),
		name,
		rulesIpV4,
		alreadyCreated,
	);
	const ipv6Commmands = createChainCommandsForFamily(
		sudoPortion + createBaseCommand("inet6", table),
		name,
		rulesIpV6,
		alreadyCreated,
	);

	return {
		ipv4: ipv4Commands,
		ipv6: ipv6Commmands,
		chainName: name,
	};
}

function createChainCommandsForFamily(
	base: string,
	name: string,
	rules: (IpV4TablesRule | IpV6TablesRule)[],
	alreadyCreated?: boolean,
) {
	const getExistingCount = `${base} -L ${name} --line-numbers | tail -n +3 | wc -l`;
	const iptablesRulesInsert = rules.map((r, idx) => {
		// First thing  is that we insert all the new rules first to last
		// (since that avoids the fall through getting applied first and either causing full block or full allow
		return `${base} -I ${name} ${idx + 1} ${createRuleSpecCli(r as IpV4TablesRule)}`;
	});
	// iterates all "post last insert" rules and removes them each by popping from the stack effectively
	const removeOldRules = `for i in $(seq ${rules.length + 1} $(${getExistingCount})); do ${base} -D ${name} ${rules.length + 1}; done`;

	return {
		createCommand: createCreateCommand(base, name),
		replaceRulesCommand: `${iptablesRulesInsert.join(" && ")} && ${removeOldRules}`,
		deleteCommand: alreadyCreated
			? `${base} -F ${name}`
			: createFullDeleteCommand(base, name),
		chainName: name,
	};
}

/**
 * Creates an iptables command to insert/append a rule and (optionally, will only add the rule if it does not exist)
 *
 * This is a good escape hatch if you need to insert iptables rules into something without controlling the whole chain.
 * As an explicit example, this can be used by a wireguard server to ensure that we add iptables rules but also don't
 * if say, the rule was persisted and already exists.
 */
export function createRuleCommand(options: {
	/**
	 * Where this rule is meant to be ipv6 or ipv4
	 */
	family: IPFamily;
	/**
	 * The iptables table to apply this to
	 */
	table: string;
	/**
	 * The chain within that table that we are inserting into
	 */
	chain: string;
	/**
	 * The specific rule that you would like to add
	 */
	rule: IpV4TablesRule | IpV6TablesRule;
	/**
	 * The method to perform the insert
	 */
	operator: "insert" | "append" | "delete";
	/**
	 * Will only apply the rule if it is not already within the chain
	 */
	onlyIfMissing: boolean;
}) {
	const base = createBaseCommand(options.family, options.table);
	const rulePortion = `${options.chain} ${createRuleSpecCli(options.rule as IpV4TablesRule)}`;
	let operator = "";
	switch (options.operator) {
		case "append":
			operator = "-A";
			break;
		case "insert":
			operator = "-I";
			break;
		case "delete":
			operator = "-D";
			break;
		default:
			throw new Error(`Unknown iptables rule operator: ${options.operator}`);
	}
	const createCmd = `${base} ${operator} ${rulePortion}`;
	if (options.operator === "delete") {
		// always check when we're deleting
		return `if [ "$(${base} -C ${rulePortion} 2> /dev/null || echo 'notset')" != "notset" ]; then ${createCmd}; fi`;
	}
	if (options.onlyIfMissing) {
		return `if [ "$(${base} -C ${rulePortion} 2> /dev/null || echo 'notset')" == "notset" ]; then ${createCmd}; fi`;
	}
	return createCmd;
}

export function createPortArgValue(portArg: number | [number, number]) {
	if (Array.isArray(portArg)) {
		if (portArg.length != 2) {
			throw new Error("Port tuple must only contain 2 ports for a range");
		}
		return portArg.join(":");
	}
	return `${portArg}`;
}

export function createRuleSpecCli(rule: IpV4TablesRule | IpV6TablesRule) {
	if (rule.destinationPorts || rule.not?.destinationPorts) {
		if (!rule.protocol && !rule.not?.protocol) {
			throw new Error(
				"Must supply a protocol that allows port filtering to use destinationPorts!",
			);
		}
	}
	if (rule.sourcePorts || rule.not?.sourcePorts) {
		if (!rule.protocol && !rule.not?.protocol) {
			throw new Error(
				"Must supply a protocol that allows port filtering to use sourcePorts!",
			);
		}
	}
	// We need to order some flags (like protocol and dport)
	const keys = Object.keys(rule);
	const destPortsIdx = keys.findIndex((k) => k === "destinationPorts");
	const srcPortsIdx = keys.findIndex((k) => k === "sourcePorts");
	if (srcPortsIdx >= 0 || destPortsIdx >= 0) {
		let beforePortsIdx: number;
		let portKey: string;
		if (srcPortsIdx >= 0 && destPortsIdx >= 0) {
			if (srcPortsIdx < destPortsIdx) {
				beforePortsIdx = srcPortsIdx;
				portKey = "sourcePorts";
			} else {
				beforePortsIdx = destPortsIdx;
				portKey = "destinationPorts";
			}
		} else if (srcPortsIdx >= 0) {
			beforePortsIdx = srcPortsIdx;
			portKey = "sourcePorts";
		} else {
			beforePortsIdx = destPortsIdx;
			portKey = "destinationPorts";
		}

		const protocolIdx = keys.findIndex((k) => k === "protocol");
		keys[beforePortsIdx] = "protocol";
		keys[protocolIdx] = portKey;
	}
	return (keys as (keyof IpV4TablesRule | keyof IpV6TablesRule)[])
		.reduce((flags, prop) => {
			switch (prop) {
				case "destinationPorts":
				case "sourcePorts":
				case "destination":
				case "fragment":
				case "inInterface":
				case "outInterface":
				case "protocol":
				case "source":
					// I'm too tired to get this right - anycast since we know it is good
					flags.push(
						handleInvertable(
							rule,
							prop as keyof (
								| InvertableIpV4TablesProps
								| InvertableIpV6TablesProps
							),
							false,
						),
					);
					break;
				case "goto":
					flags.push(`--goto ${rule[prop]}`);
					break;
				case "jump":
					flags.push(`--jump ${rule[prop]}`);
					break;
				case "setCounters":
					flags.push(rule[prop] ? "--set-counters" : "");
					break;
				case "matchingModule":
					if (rule[prop]) {
						flags.push(
							Object.keys(rule[prop]).reduce((args, matcher) => {
								return `${args} --match ${matcher} ${rule[prop]![matcher]}`;
							}, ""),
						);
					}
					break;
				case "not":
					if (rule.not) {
						(
							Object.keys(rule.not) as (keyof (
								| InvertableIpV4TablesProps
								| InvertableIpV6TablesProps
							))[]
						).forEach((k) => {
							flags.push(handleInvertable(rule.not!, k, true));
						});
					}
					break;
			}
			return flags;
		}, [] as string[])
		.join(" ");
}

export function handleInvertable(
	obj: InvertableIpV4TablesProps | InvertableIpV6TablesProps,
	key: keyof (InvertableIpV4TablesProps | InvertableIpV6TablesProps),
	not: boolean,
) {
	const negate = `${not ? "! " : ""}`;
	const value = obj[key];
	switch (
		key as keyof InvertableIpV4TablesProps | keyof InvertableIpV6TablesProps
	) {
		case "destination":
			return `${negate}--destination ${value}`;
		case "fragment":
			return value ? `${negate}--fragment` : "";
		case "inInterface":
			return `${negate}--in-interface ${value}`;
		case "outInterface":
			return `${negate}--out-interface ${value}`;
		case "protocol":
			return `${negate}--protocol ${value}`;
		case "source":
			return `${negate}--source ${value}`;
		case "destinationPorts": {
			return `${negate}--dport ${createPortArgValue(obj.destinationPorts!)}`;
		}
		case "sourcePorts": {
			return `${negate}--sport ${createPortArgValue(obj.sourcePorts!)}`;
		}
	}
}
