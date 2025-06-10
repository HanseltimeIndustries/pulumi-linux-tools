export enum ACLPermissions {
	Read = "r",
	Write = "w",
	Execute = "x",
	ExecuteOnlyOnDir = "X",
}

export interface PermissionObject {
	type: "user" | "group";
	id: number;
	permissions: ACLPermissions[];
}

/**
 * Represents an ACL on a directory path that is ONLY the permissions provided
 * and then default perms to all others
 */
export class StrictACL {
	permissions: PermissionObject[];
	path: string;
	others: "read" | "none";

	constructor(
		path: string,
		permissions: PermissionObject[],
		others: "read" | "none" = "none",
	) {
		this.permissions = permissions;
		this.path = path;
		this.others = others;
	}

	/**
	 * This creates a command that will not clean up any different ACLs but insert it.
	 *
	 * This is meant for appending changes while two different applications are running
	 * that may require different permissions
	 */
	insertCommand() {
		const permObjsString = this.permissions
			.map((perm) => {
				return `${this.createPermObjectString(perm)}`;
			})
			.join(",");
		const sharedArgs = `-R -m ${permObjsString},${this.createOtherObjectString()} ${this.path}`;
		return `setfacl ${sharedArgs} && setfacl -d ${sharedArgs}`;
	}

	/**
	 * This createa a command that will fully replace the ACLs on the path.
	 *
	 * This should be done after stopping any previous applications that need it
	 *
	 * IMPORTANT - we set the user, and group to rwx, because we expect that chmod has restricted those
	 *
	 * @returns
	 */
	setCommand() {
		const permObjsString = this.permissions
			.map((perm) => {
				return `${this.createPermObjectString(perm)}`;
			})
			.join(",");
		const sharedArgs = `-R --set='u::rwX,${this.createOtherObjectString()},${permObjsString}' ${this.path}`;
		return `setfacl ${sharedArgs} && setfacl -d ${sharedArgs}`;
	}

	removeCommand() {
		return `setfacl -b -k -R ${this.path}`;
	}

	private createPermObjectString(object: PermissionObject, _default?: boolean) {
		const d = _default ? "d:" : "";
		const { type, id, permissions } = object;
		if (type === "group") {
			return `${d}g:${id}:${permissions.join("")}`;
		} else if (type === "user") {
			return `${d}u:${id}:${permissions.join("")}`;
		} else {
			throw new Error(`Unknown type: ${type}`);
		}
	}

	private createOtherObjectString() {
		const perm = this.others === "read" ? "rX" : "---";
		return `o::${perm},g::${perm}`;
	}
}
