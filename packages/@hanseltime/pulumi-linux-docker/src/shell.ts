import { DockerDeployType } from "./types";

/**
 * The docker command for an assumed docker compose service and the type of deploy
 * @param serviceName
 */
export function dockerUpCommand(
	serviceName: string,
	opts: {
		deployType: DockerDeployType;
		/**
		 * The file path of the compose file
		 */
		file: string;
		/**
		 * The maximum timeout to wait before healthy - if -1, does not wait for health checks
		 */
		maxWaitTimeout: number;
	},
) {
	const { deployType, file, maxWaitTimeout } = opts;
	const noWait = maxWaitTimeout == -1;

	const fileArg = `-f ${file}`;
	switch (deployType) {
		case DockerDeployType.Replace: {
			const waitArg = noWait ? "" : `--wait --wait-timeout ${maxWaitTimeout}`;
			return `docker compose ${fileArg} build ${serviceName} && docker compose ${fileArg} stop ${serviceName} && docker compose ${fileArg} up -d ${waitArg} ${serviceName}`;
		}
		case DockerDeployType.BlueGreen: {
			const waitArg = noWait ? "" : `--timeout ${maxWaitTimeout}`;
			// We call compose up to make sure scaling didn't get messed up
			// Due to rollout just doubling current containers
			// We don't need a --wait becuase rollout does a wait operation
			return `docker compose ${fileArg} build ${serviceName} && docker rollout ${fileArg} ${waitArg} ${serviceName} && docker compose ${fileArg} up -d ${serviceName}`;
		}
		default:
			throw new Error(`Unexpected deployType: ${deployType}`);
	}
}

/**
 * The docker command for an assumed docker compose service and the type of deploy
 * @param serviceName
 */
export function dockerDownCommand(opts: {
	/**
	 * The file path of the compose file
	 */
	file: string;
}) {
	const { file } = opts;

	const fileArg = `-f ${file}`;

	return `docker compose ${fileArg} down --rmi all -v`;
}
