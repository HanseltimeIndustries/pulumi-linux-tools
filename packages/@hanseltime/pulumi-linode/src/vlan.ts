import { Network } from "@hanseltime/pulumi-linux";

/**
 * Helper Class to declare and track a VLAN programmatically.
 *
 * You can use the getInterfaceEntry() method to create a Linode interface entry
 * with the appropriate VLAN properties.  It will also keep track of any overlapped IP addresses
 * on the network
 */
export class VLAN extends Network {
	getInterfaceEntry(ipAddress: string) {
		this.claimIP(ipAddress, `linodeVlan-${ipAddress}`);

		return {
			purpose: "vlan",
			label: this.name,
			ipamAddress: `${ipAddress}/${this.maskNumber}`,
		};
	}
}
