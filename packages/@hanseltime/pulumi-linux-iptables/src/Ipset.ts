import type {
	BitMapIpCreate,
	BitMapIpEntryAdd,
	BitMapIpMacCreate,
	BitMapIpMacEntryAdd,
	BitMapPortCreate,
	BitMapPortEntryAdd,
	CreateInterfaces,
	EntryAddInterfaces,
	HashIpCreate,
	HashIpEntryAdd,
	HashIpMacCreate,
	HashIpMacEntryAdd,
	HashIpMarkCreate,
	HashIpMarkEntryAdd,
	HashIpPortCreate,
	HashIpPortEntryAdd,
	HashIpPortIpCreate,
	HashIpPortIpEntryAdd,
	HashIpPortNetCreate,
	HashIpPortNetEntryAdd,
	HashMacCreate,
	HashMacEntryAdd,
	HashNetCreate,
	HashNetEntryAdd,
	HashNetIfaceCreate,
	HashNetIfaceEntryAdd,
	HashNetNetCreate,
	HashNetNetEntryAdd,
	HashNetPortCreate,
	HashNetPortEntryAdd,
	HashNetPortNetCreate,
	HashNetPortNetEntryAdd,
	ListSetCreate,
	ListSetEntryAdd,
} from "./types";
import { SetTypes } from "./types";

/**
 * Helpful utility class for programmatically representing ipsets.
 *
 * This class does not create any resources.  Rather, it tracks the entries add to it via (add)
 * and can then be used to generate the create and add commands.
 *
 * Ideally, you should be using this to generate a new set and then swap them on changes.
 *
 * Example:
 *
 * const bannedSet = IpSet.HashIp('BANNED_IPS', { family: 'inet' }).add({ ip: '44.44.44.44' }).add({ ip: '120.12.0.0/16' })
 *
 * // Do something with this string
 * bannedSet.createCommand()
 * // Do something with the add commands
 * bannedSet.addCommands()
 */
export class IpSet<
	CreateOptions extends CreateInterfaces,
	EntryAddOptions extends EntryAddInterfaces,
> {
	static ListSet(name: string, createOptions: Omit<ListSetCreate, "setType">) {
		return new IpSet<ListSetCreate, ListSetEntryAdd>(name, {
			...createOptions,
			setType: SetTypes.ListSet,
		});
	}
	static HashNetIface(
		name: string,
		createOptions: Omit<HashNetIfaceCreate, "setType">,
	) {
		return new IpSet<HashNetIfaceCreate, HashNetIfaceEntryAdd>(name, {
			...createOptions,
			setType: SetTypes.HashNetIface,
		});
	}
	static HashNetPortNet(
		name: string,
		createOptions: Omit<HashNetPortNetCreate, "setType">,
	) {
		return new IpSet<HashNetPortNetCreate, HashNetPortNetEntryAdd>(name, {
			...createOptions,
			setType: SetTypes.HashNetPortNet,
		});
	}
	static HashIpMark(
		name: string,
		createOptions: Omit<HashIpMarkCreate, "setType">,
	) {
		return new IpSet<HashIpMarkCreate, HashIpMarkEntryAdd>(name, {
			...createOptions,
			setType: SetTypes.HashIpMark,
		});
	}
	static HashIpPortNet(
		name: string,
		createOptions: Omit<HashIpPortNetCreate, "setType">,
	) {
		return new IpSet<HashIpPortNetCreate, HashIpPortNetEntryAdd>(name, {
			...createOptions,
			setType: SetTypes.HashIpPortNet,
		});
	}
	static HashIpPortIp(
		name: string,
		createOptions: Omit<HashIpPortIpCreate, "setType">,
	) {
		return new IpSet<HashIpPortIpCreate, HashIpPortIpEntryAdd>(name, {
			...createOptions,
			setType: SetTypes.HashIpPortIp,
		});
	}
	static HashNetPort(
		name: string,
		createOptions: Omit<HashNetPortCreate, "setType">,
	) {
		return new IpSet<HashNetPortCreate, HashNetPortEntryAdd>(name, {
			...createOptions,
			setType: SetTypes.HashNetPort,
		});
	}
	static HashIpPort(
		name: string,
		createOptions: Omit<HashIpPortCreate, "setType">,
	) {
		return new IpSet<HashIpPortCreate, HashIpPortEntryAdd>(name, {
			...createOptions,
			setType: SetTypes.HashIpPort,
		});
	}
	static HashNet(name: string, createOptions: Omit<HashNetCreate, "setType">) {
		return new IpSet<HashNetCreate, HashNetEntryAdd>(name, {
			...createOptions,
			setType: SetTypes.HashNet,
		});
	}
	static HashNetNet(
		name: string,
		createOptions: Omit<HashNetNetCreate, "setType">,
	) {
		return new IpSet<HashNetNetCreate, HashNetNetEntryAdd>(name, {
			...createOptions,
			setType: SetTypes.HashNetNet,
		});
	}
	static BitMapIp(
		name: string,
		createOptions: Omit<BitMapIpCreate, "setType">,
	) {
		return new IpSet<BitMapIpCreate, BitMapIpEntryAdd>(name, {
			...createOptions,
			setType: SetTypes.BitmapIp,
		});
	}
	static BitMapIpMac(
		name: string,
		createOptions: Omit<BitMapIpMacCreate, "setType">,
	) {
		return new IpSet<BitMapIpMacCreate, BitMapIpMacEntryAdd>(name, {
			...createOptions,
			setType: SetTypes.BitmapIpMac,
		});
	}
	static BitMapPort(
		name: string,
		createOptions: Omit<BitMapPortCreate, "setType">,
	) {
		return new IpSet<BitMapPortCreate, BitMapPortEntryAdd>(name, {
			...createOptions,
			setType: SetTypes.BitmapPort,
		});
	}
	static HashIp(name: string, createOptions: Omit<HashIpCreate, "setType">) {
		return new IpSet<HashIpCreate, HashIpEntryAdd>(name, {
			...createOptions,
			setType: SetTypes.HashIp,
		});
	}
	static HashMac(name: string, createOptions: Omit<HashMacCreate, "setType">) {
		return new IpSet<HashMacCreate, HashMacEntryAdd>(name, {
			...createOptions,
			setType: SetTypes.HashMac,
		});
	}
	static HashIpMac(
		name: string,
		createOptions: Omit<HashIpMacCreate, "setType">,
	) {
		return new IpSet<HashIpMacCreate, HashIpMacEntryAdd>(name, {
			...createOptions,
			setType: SetTypes.HashIpMac,
		});
	}

	readonly createOptions: CreateOptions;
	readonly entries: EntryAddOptions[] = [];
	readonly name: string;
	readonly numComponents: number;

	constructor(name: string, createOptions: CreateOptions) {
		this.createOptions = createOptions;
		this.name = name;
		this.numComponents = createOptions.setType.split(":")[1].split(",").length;
	}

	add(entry: EntryAddOptions) {
		this.entries.push(entry);
		return this;
	}

	/**
	 * Generates the commands for createing this IP set
	 *
	 * @param postfix supplied if you're trying to create a swappable ipset
	 */
	createCommand(postfix: string = ""): string {
		const { setType, ...cliOpts } = this.createOptions;

		const flags = this.optionsToFlagStr(
			cliOpts as {
				[key: string]: boolean | string | number;
			},
		);

		return `ipset create ${this.name}${postfix} ${setType} ${flags}`;
	}
	/**
	 * Generates an array of commands to add the ipset entries to the named ipset
	 * @returns
	 */
	addCommands(postfix: string = ""): string[] {
		return this.entries.map((entry) => {
			const [value, flags] = this.getValueAndFlags(entry);
			return `ipset add ${this.name}${postfix} ${value} ${this.optionsToFlagStr(flags)}`;
		});
	}

	/**
	 * This is just used for detecting changes - right now it's super large
	 */
	changeSignature(): string {
		return JSON.stringify({
			create: this.createOptions,
			entries: this.entries,
		});
	}

	/**
	 * Creates the match args string for the given flags
	 *
	 * Must match the number options for the structure hash:net,net should have 2 to evaluate src,dst
	 */
	matchArgs(flags: ("src" | "dst")[]) {
		if (flags.length !== this.numComponents) {
			throw new Error(
				`Cannot crate a cli match arg string without exactly ${this.numComponents} src/dst calls for ${this.createOptions.setType}`,
			);
		}
		return `--match-set ${this.name} ${flags.join(",")}`;
	}

	/**
	 * Generates a command to fill the set
	 */
	private getValueAndFlags(entry: EntryAddOptions): [
		string,
		{
			[key: string]: boolean | string | number;
		},
	] {
		let value: string;
		let flags: {
			[key: string]: boolean | string | number;
		};
		switch (this.createOptions.setType) {
			case SetTypes.BitmapIp: {
				const { ip, ..._flags } = entry as BitMapIpEntryAdd;
				value = ip;
				flags = _flags;
				break;
			}
			case SetTypes.BitmapIpMac: {
				const { ip, mac, ..._flags } = entry as BitMapIpMacEntryAdd;
				value = `${ip}${mac ? `,${mac}` : ""}`;
				flags = _flags;
				break;
			}
			case SetTypes.BitmapPort: {
				const { port, protocol, ..._flags } = entry as BitMapPortEntryAdd;
				value = `${protocol ? `${protocol}:` : ""}${port}`;
				flags = _flags;
				break;
			}
			case SetTypes.HashIp: {
				const { ip, ..._flags } = entry as HashIpEntryAdd;
				value = ip;
				flags = _flags;
				break;
			}
			case SetTypes.HashMac: {
				const { mac, ..._flags } = entry as HashMacEntryAdd;
				value = mac;
				flags = _flags;
				break;
			}
			case SetTypes.HashIpMac: {
				const { ip, mac, ..._flags } = entry as HashIpMacEntryAdd;
				value = `${ip},${mac}`;
				flags = _flags;
				break;
			}
			case SetTypes.HashNet: {
				const { netaddr, ..._flags } = entry as HashNetEntryAdd;
				value = netaddr;
				flags = _flags;
				break;
			}
			case SetTypes.HashNetNet: {
				const { netaddr, netaddr2, ..._flags } = entry as HashNetNetEntryAdd;
				value = `${netaddr},${netaddr2}`;
				flags = _flags;
				break;
			}
			case SetTypes.HashIpPort: {
				const { ip, protocol, port, ..._flags } = entry as HashIpPortEntryAdd;
				value = `${ip},${protocol ? `${protocol}:` : ""}${port}`;
				flags = _flags;
				break;
			}
			case SetTypes.HashNetPort: {
				const { netaddr, protocol, port, ..._flags } =
					entry as HashNetPortEntryAdd;
				value = `${netaddr},${protocol ? `${protocol}:` : ""}${port}`;
				flags = _flags;
				break;
			}
			case SetTypes.HashIpPortIp: {
				const { ip, secondIp, protocol, port, ..._flags } =
					entry as HashIpPortIpEntryAdd;
				value = `${ip},${protocol ? `${protocol}:` : ""}${port},${secondIp}`;
				flags = _flags;
				break;
			}
			case SetTypes.HashIpPortNet: {
				const { ip, netaddr, protocol, port, ..._flags } =
					entry as HashIpPortNetEntryAdd;
				value = `${ip},${protocol ? `${protocol}:` : ""}${port},${netaddr}`;
				flags = _flags;
				break;
			}
			case SetTypes.HashIpMark: {
				const { ip, mark, ..._flags } = entry as HashIpMarkEntryAdd;
				value = `${ip},${mark}`;
				flags = _flags;
				break;
			}
			case SetTypes.HashNetPortNet: {
				const { netaddr, netaddr2, protocol, port, ..._flags } =
					entry as HashNetPortNetEntryAdd;
				value = `${netaddr},${protocol ? `${protocol}:` : ""}${port},${netaddr2}`;
				flags = _flags;
				break;
			}
			case SetTypes.HashNetIface: {
				const { netaddr, iface, phsydev, ..._flags } =
					entry as HashNetIfaceEntryAdd;
				value = `${netaddr},${phsydev ? "physdev:" : ""}${iface}`;
				flags = _flags;
				break;
			}
			case SetTypes.ListSet: {
				const { setname, order, ..._flags } = entry as ListSetEntryAdd;
				value = `${setname} ${order ? `${order.type} ${order.setname}` : ""}`;
				flags = _flags;
				break;
			}
			default:
				throw new Error(
					`Unimplemented set type: ${(this.createOptions as any).setType}`,
				);
		}

		return [value, flags];
	}

	private optionsToFlagStr(options: {
		[key: string]: boolean | string | number;
	}) {
		return Object.keys(options)
			.map((opt) => {
				const val = options[opt];
				// flags just return
				if (typeof val === "boolean") {
					return opt;
				}
				return `${opt} ${val}`;
			})
			.join(" ");
	}
}
