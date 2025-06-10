type DateString = string;

export interface ErrorResponse {
	errors: {
		field: string;
		reason: string;
	}[];
}

export interface Paginated<Payload> {
	data: Payload[];
	page: number;
	pages: number;
	results: number;
}

export interface LinodeInfoResponse {
	alerts: {
		cpu: number;
		io: number;
		network_in: number;
		network_out: number;
		transfer_quota: number;
	};
	backups: {
		available: boolean;
		enabled: boolean;
		last_successful: DateString;
		schedule: {
			day: string;
			window: string;
		};
	};
	capabilities: string[];
	created: DateString;
	disk_encryption?: "enabled" | "disabled";
	has_user_data: boolean;
	host_uuid: string;
	hypervisor: string;
	id: number;
	image?: string;
	interface_generation: string;
	ipv4: string[];
	ipv6?: string;
	label: string;
	lke_cluster_id?: number;
	placement_group?: {
		id: number;
		label: string;
		migrating_to?: number;
		placement_group_policy: string;
		placement_group_type: string;
	};
	region: string;
	specs: {
		disk: number;
		gpus: number;
		memory: number;
		transfer: number;
		vcpus: number;
	};
	status: string;
	tags: string[];
	type: string;
	updated: DateString;
	watchdog_enabled: boolean;
}
