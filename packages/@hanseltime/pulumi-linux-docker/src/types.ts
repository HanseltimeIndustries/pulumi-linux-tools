import type * as pulumi from "@pulumi/pulumi";

/**
 * If a resource is doing copy operations, some of them require the asset to be in
 * a root-relative path
 */
export interface TempCopyDirArgs {
	tmpCopyDir: pulumi.Input<string>;
}

export enum DockerDeployType {
	/**
	 * This will stop one pod and bring up the new pod - this has downtime and has no fallback if the up fails
	 */
	Replace = "replace",
	/**
	 * This will copy and build the new image but will not deploy it - should we even use this
	 */
	Manual = "manual",
	/**
	 * This assumes that you have a traefik service set up (via DockerInstall resource) and promises to deploy
	 * the newly built images along side the old images and then tear them down once they report healthy via Docker
	 * status check
	 */
	BlueGreen = "blue-green",
}

/**
 * Since pulumi does not seem to honor component resource dependencies and their children, we have a
 * simple interface that declares a last: Resource
 */
export interface WaitOnChildren {
	/**
	 * The last child that should be dependedOn
	 */
	last: pulumi.Input<pulumi.Resource>;
}

export type DockerDaemonJson = Partial<{
	"authorization-plugins": any[];
	bip: string;
	bip6: string;
	bridge: string;
	builder: {
		gc: {
			enabled: boolean;
			defaultKeepStorage: string;
			policy: { keepStorage: string; filter?: string[]; all?: boolean }[];
		};
	};
	"cgroup-parent": string;
	containerd: string;
	"containerd-namespace": string;
	"containerd-plugins-namespace": string;
	"data-root": string;
	debug: boolean;
	"default-address-pools": { base: string; size: number }[];
	"default-cgroupns-mode": string;
	"default-gateway": string;
	"default-gateway-v6": string;
	"default-network-opts": any;
	"default-runtime": string;
	"default-shm-size": string;
	"default-ulimits": {
		[n: string]: {
			Hard: number;
			Name: string;
			Soft: number;
		};
	};
	dns: string[];
	"dns-opts": string[];
	"dns-search": string[];
	"exec-opts": string[];
	"exec-root": string;
	experimental: boolean;
	features: {
		cdi: boolean;
		"containerd-snapshotter": boolean;
	};
	"fixed-cidr": string;
	"fixed-cidr-v6": string;
	group: string;
	"host-gateway-ip": string;
	hosts: string[];
	proxies: {
		[proxyName: string]: string;
	};
	icc: boolean;
	init: boolean;
	"init-path": string;
	"insecure-registries": string[];
	ip: string;
	"ip-forward": boolean;
	"ip-masq": boolean;
	iptables: boolean;
	ip6tables: boolean;
	ipv6: boolean;
	labels: string[];
	"live-restore": boolean;
	"log-driver": string;
	"log-format": "text" | "json";
	"log-level": string;
	"log-opts": {
		[opt: string]: string;
	};
	"max-concurrent-downloads": number;
	"max-concurrent-uploads": number;
	"max-download-attempts": number;
	mtu: number;
	"no-new-privileges": boolean;
	"node-generic-resources": string[];
	pidfile: string;
	"raw-logs": boolean;
	"registry-mirrors": string[];
	runtimes: {
		[rtime: string]: {
			path: string;
			runtimeArgs: string[];
		};
	};
	"seccomp-profile": string;
	"selinux-enabled": boolean;
	"shutdown-timeout": number;
	"storage-driver": string;
	"storage-opts": string[];
	"swarm-default-advertise-addr": string;
	tls: boolean;
	tlscacert: string;
	tlscert: string;
	tlskey: string;
	tlsverify: boolean;
	"userland-proxy": boolean;
	"userland-proxy-path": string;
	"userns-remap": string;
}>;
