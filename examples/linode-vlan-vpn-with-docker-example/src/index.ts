import { vlan } from "./constants";
import { toolsInstance, vpnServer } from "./machineWithVpn";
import "./machine2";
import * as pulumi from "@pulumi/pulumi";

// Install docker + cadvisor on the non-vpn server (as if we're running apps here, we'll just monitor cadvisor and node exporter for example)

// Install monitoring stack on VPN server

// Export the linode ipaddress
export const instanceIp: pulumi.Output<string> =
	toolsInstance.instance.ipAddress;
export const automationUser: pulumi.Output<string | undefined> = pulumi.output(
	toolsInstance.automationUserConnection.user,
);
export const vpnPublicKey: pulumi.Output<string> = vpnServer.publicKey;
export const vpnPort: pulumi.Output<number> = vpnServer.port;
export const myVpnClientIp: pulumi.Output<string> =
	vpnServer.getPeerAddress("myvpn");
export const myVpnClientPresharedKey: pulumi.Output<string> =
	vpnServer.getPeerPreSharedKey("myvpn");
export const vpnVlanCIDR = vlan.cidr;
