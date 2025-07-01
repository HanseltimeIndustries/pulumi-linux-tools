import { CopyableAsset } from "@hanseltime/pulumi-file-utils";
import { VLAN } from "@hanseltime/pulumi-linode";
import * as pulumi from "@pulumi/pulumi";
import * as std from "@pulumi/std";
import { readFileSync } from "fs";
import { homedir } from "os";
import { join } from "path";

CopyableAsset.setChangeDetectHashFunction(CopyableAsset.sha256AndLength);

export const config = new pulumi.Config();
export const REGION = config.require("linodeRegion");

const publicKeysDirectory = join(__dirname, "..", "public_keys");

const initialRootKeyName = config.require("deploymentSSHKey");

export const initialRootKey1 = std
	.file({
		input: join(publicKeysDirectory, initialRootKeyName),
	})
	.then((invoke) =>
		std.chomp({
			input: invoke.result,
		}),
	)
	.then((invoke) => invoke.result);

// We'll get the initial key that was also generated on our machine, we could also technically have saved the key
// to a secret or loaded it onto the machine if it was a CI/CD machine.
export const deployPrivateKey = pulumi.secret(
	readFileSync(
		join(
			homedir(),
			".ssh",
			initialRootKeyName.substring(0, initialRootKeyName.lastIndexOf(".")) ||
				initialRootKeyName,
		),
	).toString(),
);

export const vlan = new VLAN("internal-vlan", "10.0.0.0/24");
