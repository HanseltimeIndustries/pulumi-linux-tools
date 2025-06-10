import * as pulumi from "@pulumi/pulumi";

export function asSudoOutput(
	command: pulumi.Input<string>,
): pulumi.Output<string> {
	if ((command as pulumi.Output<string>).apply) {
		return (command as pulumi.Output<string>).apply((cmd) => asSudoString(cmd));
	}
	return pulumi.output(command).apply((cmd) => asSudoString(cmd));
}

export function asSudoString(command: string) {
	return `sudo bash -c 'set -euo pipefail; ${command.replaceAll("'", `'"'"'`)}'`;
}
