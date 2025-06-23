/**
 * Helper Class to declare and track a Network like a LAN or VLAN programmatically that has defined
 * range
 */
export class Network {
	readonly cidr: string;
	readonly maskNumber: string;
	readonly name: string;
	readonly startIP: string;
	readonly endIP: string;

	private startOctet: number[];
	private endOctet: number[];

	private usedAddresses = new Map<string, string>();
	constructor(name: string, cidr: string) {
		this.name = name;
		this.cidr = cidr;

		const [base, subnet] = cidr.split("/");
		this.maskNumber = subnet;
		const subnetBits = 32 - parseInt(subnet);

		const fulloctets = Math.floor(subnetBits / 8);
		const partialBits = subnetBits % 8;

		const octets: number[] = base
			.split(".")
			.map((octet) => parseInt(octet, 10));
		const startIP: number[] = [];
		const endIP: number[] = [];

		for (let octIdx = 0; octIdx < octets.length; octIdx++) {
			const endIdx = octets.length - 1 - octIdx;
			if (octIdx < fulloctets) {
				startIP[endIdx] = 0;
				endIP[endIdx] = 255;
			} else if (partialBits && octIdx === fulloctets) {
				const zeroMask = 255 << partialBits;
				startIP[endIdx] = octets[endIdx] & zeroMask;
				endIP[endIdx] = octets[endIdx] | (~zeroMask & 255);
			} else {
				startIP[endIdx] = octets[endIdx];
				endIP[endIdx] = octets[endIdx];
			}
		}

		this.startIP = startIP.join(".");
		this.endIP = endIP.join(".");
		this.startOctet = startIP;
		this.endOctet = endIP;
	}

	/**
	 * Use this to claim the ipAddress within the network
	 * @param ipAddress - the ipaddress string to claim
	 * @param name - a readable name to identify which machine/interface is claiming this ip (for troubleshooting messages)
	 */
	claimIP(ipAddress: string, name: string) {
		if (this.usedAddresses.has(ipAddress)) {
			throw new Error(
				`${ipAddress} is already used by another resource! (name: ${this.usedAddresses.get(ipAddress)})`,
			);
		}

		const octets = ipAddress.split(".");

		for (let octIdx = 0; octIdx < octets.length; octIdx++) {
			const oct = parseInt(octets[octIdx]);
			if (oct < this.startOctet[octIdx] || oct > this.endOctet[octIdx]) {
				throw new Error(
					`${ipAddress} (name: ${name}) is outside of ${this.cidr}`,
				);
			}
		}

		this.usedAddresses.set(ipAddress, name);
	}
}
