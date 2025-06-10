import * as pulumi from "@pulumi/pulumi";
import * as command from "@pulumi/command";
import { LIBRARY_PREFIX } from "./constants";
import { shellStrings } from "@hanseltime/pulumi-linux-base";

export interface IpTablesInstallArgs {
	connection: pulumi.Input<command.types.input.remote.ConnectionArgs>;

	noSudo?: boolean;
}

/**
 * Installs iptables, ipset and their persistent packages so that we can set up iptables
 * rules that do not disappear on reboots.
 *
 * Because iptables is so critical to security, once installed, this construct does not uninstall it.
 */
export class IpTablesInstall extends pulumi.ComponentResource {
	constructor(
		name: string,
		args: IpTablesInstallArgs,
		opts?: pulumi.ComponentResourceOptions,
	) {
		super(`${LIBRARY_PREFIX}:IpTablesInstall`, name, args, opts);

		const sudoPortion = args.noSudo ? "" : "sudo";

		new command.remote.Command(
			`${name}-install`,
			{
				connection: args.connection,
				create: shellStrings.asSudoOutput(
					`${sudoPortion} apt-get update && ${sudoPortion} apt-get install -y ipset iptables ipset-persistent iptables-persistent`,
				),
			},
			{
				parent: this,
			},
		);
	}
}
