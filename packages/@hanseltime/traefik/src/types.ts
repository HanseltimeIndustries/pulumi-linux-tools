export interface HeaderRule {
	header: string;
	value: string;
	not?: boolean;
}

export interface HeaderRegexpRule {
	header: string;
	value: RegExp;
	not?: boolean;
}

export interface HostRule {
	domain: string;
	not?: boolean;
}

export interface HostRegexpRule {
	domain: RegExp;
	not?: boolean;
}

export interface MethodRule {
	method: string;
	not?: boolean;
}

export interface PathRule {
	path: string;
	not?: boolean;
}

export interface PathPrefixRule {
	prefix: string;
	not?: boolean;
}

export interface PathRegexpRule {
	path: RegExp;
	not?: boolean;
}

export interface QueryRule {
	key: string;
	value: string;
	not?: boolean;
}

export interface QueryRegexpRule {
	key: string;
	value: RegExp;
	not?: boolean;
}

export interface ClientIpRule {
	ip: string;
	not?: boolean;
}

export enum RuleType {
	Header = "header",
	HeaderRegexp = "headerregexp",
	Host = "host",
	HostRegexp = "hostregexp",
	Method = "method",
	Path = "path",
	PathPrefix = "pathprefix",
	PathRegexp = "pathregexp",
	Query = "query",
	QueryRegexp = "queryregexp",
	ClientIP = "clientip",
}

export enum RuleCond {
	Or = "or",
	And = "and",
}

export type BuiltRules =
	| {
			type: RuleType.ClientIP;
			rule: ClientIpRule;
	  }
	| {
			type: RuleType.Header;
			rule: HeaderRule;
	  }
	| {
			type: RuleType.HeaderRegexp;
			rule: HeaderRegexpRule;
	  }
	| {
			type: RuleType.Host;
			rule: HostRule;
	  }
	| {
			type: RuleType.HostRegexp;
			rule: HostRegexpRule;
	  }
	| {
			type: RuleType.Method;
			rule: MethodRule;
	  }
	| {
			type: RuleType.Path;
			rule: PathRule;
	  }
	| {
			type: RuleType.PathPrefix;
			rule: PathPrefixRule;
	  }
	| {
			type: RuleType.PathRegexp;
			rule: PathRegexpRule;
	  }
	| {
			type: RuleType.Query;
			rule: QueryRule;
	  }
	| {
			type: RuleType.QueryRegexp;
			rule: QueryRegexpRule;
	  };

export type Condition = {
	type: RuleCond;
	rules: (BuiltRules | Condition)[];
};

export interface StaticConfiguration {
	log?: {
		/**
		 * By default, the logs are written to the standard output. You can configure a file path instead using the filePath option.
		 */
		filePath?: string;
		/**
		 * By default, the logs use a text format (common), but you can also ask for the json format in the format option.
		 */
		format?: string;
		/**
		 * By default, the level is set to ERROR
		 */
		level?: "TRACE" | "DEBUG" | "INFO" | "WARN" | "ERROR" | "FATAL" | "PANIC";
		/**
		 * When using the 'common' format, disables the colorized output.
		 */
		noColor?: boolean;
	} & LogFileOptions & {
			// TODO - otlp options - currently experimental
			otlp?: any;
		};
	/**
	 * if provided enables access logs
	 */
	accessLog?: {
		/**
		 * Optional, Default="false"
		 *
		 * Enables access logs for internal resources (e.g.: ping@internal).
		 */
		addInternals?: boolean;
		/**
		 * By default access logs are written to the standard output. To write the logs into a log file, use the filePath option.
		 */
		filePath?: string;
		/**
		 * By default, the logs use a text format (common), but you can also ask for the json format in the format option.
		 */
		format?: string;
		/**
		 * To write the logs in an asynchronous fashion, specify a bufferingSize option. This option represents the number of log lines Traefik will keep in memory before writing them to the selected output. In some cases, this option can greatly help performances.
		 */
		bufferingSize?: number;
		/**
		 * To filter logs, you can specify a set of filters which are logically "OR-connected". Thus, specifying multiple filters will keep more access logs than specifying only one.
		 */
		filters?: {
			/**
			 * to limit the access logs to requests with a status codes in the specified range
			 */
			statusCodes?: string[];
			/**
			 * to keep the access logs when at least one retry has happened
			 */
			retryAttempts?: boolean;
			/**
			 * to keep access logs when requests take longer than the specified duration (provided in seconds or as a valid duration format, see time.ParseDuration)
			 */
			minDuration?: string;
		};
		/**
		 * You can decide to limit the logged fields/headers to a given list with the fields.names and fields.headers options.
		 *
		 * Each field can be set to:
		 *
		 *     keep to keep the value
		 *     drop to drop the value
		 *
		 * Header fields may also optionally be set to redact to replace the value with "REDACTED".
		 *
		 * The defaultMode for fields.names is keep.
		 *
		 * The defaultMode for fields.headers is drop.
		 */
		fields?: {
			defaultMode?: "keep" | "drop";
			names?: {
				[n: string]: "keep" | "drop";
			};
			headers?: {
				defaultMode?: "keep" | "drop";
				names?: {
					[n: string]: "keep" | "drop";
				};
			};
		};
		// TODO: otlp properties
		otlp?: any;
	};
	/**
	 * https://doc.traefik.io/traefik/observability/metrics/overview/
	 */
	metrics?: {
		/**
		 * Optional, Default="false"
		 *
		 * Enables metrics for internal resources (e.g.: ping@internals).
		 */
		addInternals?: boolean;
	} & {
		// Properties per provider type is for you to look up and add
		[specificProps: string]: any;
	};
	/**
	 * The tracing system allows developers to visualize call flows in their infrastructure.
	 *
	 * Traefik uses OpenTelemetry, an open standard designed for distributed tracing.
	 *
	 * Please check our dedicated OTel docs to learn more.
	 */
	tracing?: {
		/**
		 * Optional, Default="false"
		 *
		 * Enables metrics for internal resources (e.g.: ping@internals).
		 */
		addInternals?: boolean;
		/**
		 * Required, Default="traefik"
		 *
		 * Service name used in selected backend.
		 */
		serviceName?: string;
		/**
		 * Optional, Default=1.0
		 *
		 * The proportion of requests to trace, specified between 0.0 and 1.0.
		 */
		sampleRate?: number;
		/**
		 * Defines additional resource attributes to be sent to the collector.
		 */
		resourceAttributes?: {
			[attr: string]: string;
		};
		/**
		 * Defines the list of request headers to add as attributes. It applies to client and server kind spans.
		 */
		capturedRequestHeaders?: string[];
		/**
		 * Defines the list of response headers to add as attributes. It applies to client and server kind spans.
		 */
		capturedResponseHeaders?: string[];
		/**
		 * By default, all query parameters are redacted. Defines the list of query parameters to not redact.
		 */
		safeQueryParams?: string[];
		// TODO - add otlp parameters
		otlp?: any;
	};
	api?: {
		/**
		 * Enable the API in insecure mode, which means that the API will be available directly on the entryPoint named traefik, on path /api.
		 *
		 * If the entryPoint named traefik is not configured, it will be automatically created on port 8080.
		 */
		insecure?: boolean;
		/**
		 * Default: true
		 *
		 * Enable the dashboard. More about the dashboard features here.
		 */
		dashboard?: boolean;
		/**
		 * Default: false
		 *
		 * Enable additional endpoints for debugging and profiling, served under /debug/.
		 */
		debug?: boolean;
	};
	/**
	 * Checking the Health of Your Traefik Instances
	 */
	ping?: {
		/**
		 * Optional, Default="traefik"
		 *
		 * Enabling /ping on a dedicated EntryPoint.
		 */
		entryPoint?: string;
		/**
		 * If manualRouting is true, it disables the default internal router in order to allow one to create a custom router for the ping@internal service.
		 */
		manualRouting?: boolean;
		/**
		 * During the period in which Traefik is gracefully shutting down, the ping handler returns a 503 status code by default.
		 * If Traefik is behind, for example a load-balancer doing health checks (such as the Kubernetes LivenessProbe), another code might be expected as the signal for graceful termination.
		 * In that case, the terminatingStatusCode can be used to set the code returned by the ping handler during termination.
		 */
		terminatingStatusCode?: number;
	};
	entryPoints: {
		[name: string]: Entrypoint;
	};
	serversTransports?: ServersTransport;
	tcpServersTransport?: TcpServersTransport;
	certificatesResolvers?: CertificatesResolvers;
	/**
	 * Any provider configuration for supported providers via available via: https://doc.traefik.io/traefik/reference/install-configuration/providers/overview/#supported-providers
	 */
	providers?: any;
}
/**
 * Options that apply if a logfile is set
 */
export interface LogFileOptions {
	/**
	 * maxSize is the maximum size in megabytes of the log file before it gets rotated. It defaults to 100 megabytes.
	 */
	maxSize?: number;
	/**
	 * maxBackups is the maximum number of old log files to retain. The default is to retain all old log files (though maxAge may still cause them to get deleted).
	 */
	maxBackups?: number;
	/**
	 * maxAge is the maximum number of days to retain old log files based on the timestamp encoded in their filename. Note that a day is defined as 24 hours and may not exactly correspond to calendar days due to daylight savings, leap seconds, etc. The default is not to remove old log files based on age.
	 */
	maxAge?: number;
	/**
	 * compress determines if the rotated log files should be compressed using gzip. The default is not to perform compression.
	 */
	compress?: boolean;
}

/**
 * Keep in mind that certificates should not be auto-renewed in multiple places
 * or this will lead to invalidatinng other instances' certificates.
 *
 * Instead, those certificates should be mounted via a shared file system
 */
export interface CertificatesResolvers {
	[resolverName: string]: {
		acme?: {
			/**
			 * Email address used for registration.
			 */
			email: string;
			/**
			 * CA server to use
			 *
			 * Default: https://acme-v02.api.letsencrypt.org/directory
			 */
			caServer?: string;
			/**
			 * Preferred chain to use. If the CA offers multiple certificate chains, prefer the chain with an issuer matching this Subject Common Name. If no match, the default offered chain will be used.
			 */
			preferredChain?: string;
			/**
			 * KeyType to use.
			 *
			 * Default: "RSA4096"
			 */
			keyType?: string;
			/**
			 * Enable external account binding.
			 */
			eab?: {
				/**
				 * Key identifier from External CA.
				 */
				kid?: string;
				/**
				 * HMAC key from External CA, should be in Base64 URL Encoding without padding format.
				 */
				hmacEncoded: string;
			};
			/**
			 * The certificates' duration in hours, exclusively used to determine renewal dates.
			 *
			 * Default: 2160
			 */
			certificatesDuration?: number;
			/**
			 * Enable DNS-01 challenge. More information here.
			 */
			dnsChallenge: {
				/**
				 * DNS provider to use.
				 */
				provider?: string;
				/**
				 * DNS servers to resolve the FQDN authority
				 */
				resolvers?: string[];

				propagation?: {
					/**
					 * By default, the provider will verify the TXT DNS challenge record before letting ACME verify. If delayBeforeCheck is greater than zero, this check is delayed for the configured duration in seconds. This is Useful if internal networks block external DNS queries.
					 *
					 * Default: 0s
					 */
					delayBeforeChecks?: string;
					/**
					 * Disables the challenge TXT record propagation checks, before notifying ACME that the DNS challenge is ready. Please note that disabling checks can prevent the challenge from succeeding.
					 */
					disableChecks?: boolean;
					/**
					 * Enables the challenge TXT record to be propagated to all recursive nameservers. If you have disabled authoritative nameservers checks (with propagation.disableANSChecks), it is recommended to check all recursive nameservers instead.
					 */
					requireAllRNS?: boolean;
					/**
					 * Disables the challenge TXT record propagation checks against authoritative nameservers. This option will skip the propagation check against the nameservers of the authority (SOA). It should be used only if the nameservers of the authority are not reachable.
					 */
					disableANSChecks?: boolean;
				};
			};
			/**
			 * Enable HTTP-01 challenge. More information here.
			 */
			httpChallenge?: {
				/**
				 * EntryPoint to use for the HTTP-01 challenges. Must be reachable by Let's Encrypt through port 80
				 */
				entryPoint: string;
			};
			/**
			 * Enable TLS-ALPN-01 challenge. Traefik must be reachable by Let's Encrypt through port 443. More information here.
			 */
			tlsChallenge?: boolean;
			/**
			 * File path used for certificates storage.
			 *
			 * Default: "acme.json"
			 */
			storage: string;
		};
	};
}

/**
 * Static configuration servers transport configuration
 */
export interface ServersTransport {
	/**
	 * insecureSkipVerify disables SSL certificate verification.
	 */
	insecureSkipVerify?: boolean;
	/**
	 * rootCAs is the list of certificates (as file paths, or data bytes) that will be set as Root Certificate Authorities when using a self-signed TLS certificate.
	 */
	rootCAs?: (string | Buffer)[];
	/**
	 * Default=2
	 *
	 * If non-zero, maxIdleConnsPerHost controls the maximum idle (keep-alive) connections to keep per-host.
	 */
	maxIdleConnsPerHost?: number;
	/**
	 * Please note that SPIFFE must be enabled in the static configuration before using it to secure the connection between Traefik and the backends.
	 */
	spiffe?: {
		/**
		 * ids defines the allowed SPIFFE IDs. This takes precedence over the SPIFFE TrustDomain.
		 */
		ids?: string[];
		/**
		 * trustDomain defines the allowed SPIFFE trust domain.
		 */
		trustDomain?: string;
		/**
		 * forwardingTimeouts is about a number of timeouts relevant to when forwarding requests to the backend servers.
		 */
		forwardingTimeouts?: {
			/**
			 * Default=30s
			 *
			 * dialTimeout is the maximum duration allowed for a connection to a backend server to be established. Zero means no timeout.
			 */
			dialTimeout?: string;
			/**
			 * Default=0s
			 *
			 * responseHeaderTimeout, if non-zero, specifies the amount of time to wait for a server's response headers after fully writing the request (including its body, if any). This time does not include the time to read the response body. Zero means no timeout.
			 */
			responseHeaderTimeout?: string;
			/**
			 * Default=90s
			 *
			 * idleConnTimeout, is the maximum amount of time an idle (keep-alive) connection will remain idle before closing itself. Zero means no limit.
			 */
			idleConnTimeout?: string;
		};
	};
}

export interface TcpServersTransport {
	/**
	 * Default="30s"
	 *
	 * dialTimeout is the maximum duration allowed for a connection to a backend server to be established. Zero means no timeout.
	 */
	dialTimeout?: string;
	/**
	 * Default="15s"
	 *
	 * dialKeepAlive defines the interval between keep-alive probes sent on an active network connection. If zero, keep-alive probes are sent with a default value (currently 15 seconds), if supported by the protocol and operating system. Network protocols or operating systems that do not support keep-alives ignore this field. If negative, keep-alive probes are disabled.
	 */
	dialKeepAlive?: string;
	/**
	 * tls defines the TLS configuration to connect with TCP backends.
	 */
	tls?: {
		/**
		 * insecureSkipVerify disables the server's certificate chain and host name verification.
		 */
		insecureSkipVerify?: boolean;
		/**
		 * rootCAs defines the set of Root Certificate Authorities (as file paths, or data bytes) to use when verifying self-signed TLS server certificates.
		 */
		rootCAs?: string[];
	};
	/**
	 * Please note that SPIFFE must be enabled in the static configuration before using it to secure the connection between Traefik and the backends.
	 */
	spiffe?: {
		/**
		 * ids defines the allowed SPIFFE IDs. This takes precedence over the SPIFFE TrustDomain.
		 */
		ids?: string[];
		/**
		 * trustDomain defines the allowed SPIFFE trust domain.
		 */
		trustDomain?: string;
	};
}

export interface SPIFFE {
	/**
	 * The workloadAPIAddr configuration defines the address of the SPIFFE Workload API.
	 *
	 * Enabling SPIFFE does not imply that backend connections are going to use it automatically. Each ServersTransport
	 * or TCPServersTransport, that is meant to be secured with SPIFFE, must explicitly enable it (see SPIFFE with
	 * ServersTransport or SPIFFE with TCPServersTransport).
	 */
	workloadAPIAddr: string;
}

/**
 * Static configuration entrypoints configuration
 */
export interface Entrypoint {
	/**
	 * The address defines the port, and optionally the hostname, on which to listen for incoming connections and packets.
	 * It also defines the protocol to use (TCP or UDP). If no protocol is specified, the default is TCP. The format is:
	 *
	 * [host]:port[/tcp|/udp]
	 *
	 * If both TCP and UDP are wanted for the same port, two entryPoints definitions are needed, such as in the example below.
	 */
	address: string;
	/**
	 * allowACMEByPass determines whether a user defined router can handle ACME TLS or HTTP challenges instead of the Traefik
	 * dedicated one. This option can be used when a Traefik instance has one or more certificate resolvers configured, but
	 * is also used to route challenges connections/requests to services that could also initiate their own ACME challenges.
	 */
	allowACMEByPass?: boolean;
	/**
	 * The ReusePort option enables EntryPoints from the same or different processes listening on the same TCP/UDP port by
	 * utilizing the SO_REUSEPORT socket option. It also allows the kernel to act like a load balancer to distribute
	 * incoming connections between entry points.
	 *
	 * For example, you can use it with the transport.lifeCycle to do canary deployments against Traefik itself.
	 * Like upgrading Traefik version or reloading the static configuration without any service downtime.
	 */
	reusePort?: boolean;
	/**
	 * The AsDefault option marks the EntryPoint to be in the list of default EntryPoints. EntryPoints in this
	 * list are used (by default) on HTTP and TCP routers that do not define their own EntryPoints option.
	 */
	asDefault?: boolean;
	/**
	 * http/2 options
	 */
	http2?: {
		/**
		 * maxConcurrentStreams specifies the number of concurrent streams per connection that each client is
		 * allowed to initiate. The maxConcurrentStreams value must be greater than zero.
		 */
		maxConcurrentStreams?: number;
	};
	/**
	 * If provided, this will enable https3
	 */
	http3?: {
		/**
		 * http3.advertisedPort defines which UDP port to advertise as the HTTP/3 authority. It defaults
		 * to the entryPoint's address port. It can be used to override the authority in the alt-svc header,
		 * for example if the public facing port is different from where Traefik is listening.
		 */
		advertisedPort?: number;
	};
	/**
	 * You can configure Traefik to trust the forwarded headers information (X-Forwarded-*).
	 */
	forwardedHeaders?: {
		/**
		 * Trusting Forwarded Headers from specific IPs or ranges.
		 */
		trustedIPs?: string[];
		/**
		 * Insecure Mode (Always Trusting Forwarded Headers).
		 */
		insecure?: boolean;
		/**
		 * As per RFC7230, Traefik respects the Connection options from the client request.
		 * By doing so, it removes any header field(s) listed in the request Connection
		 * header and the Connection header field itself when empty. The removal happens
		 * as soon as the request is handled by Traefik, thus the removed headers are not
		 * available when the request passes through the middleware chain. The connection
		 * option lists the Connection headers allowed to passthrough the middleware chain
		 * before their removal.
		 */
		connection?: string[];
	};
	transport?: {
		/**
		 * respondingTimeouts are timeouts for incoming requests to the Traefik instance.
		 * Setting them has no effect for UDP entryPoints.
		 */
		respondingTimeouts?: {
			/**
			 * readTimeout is the maximum duration for reading the entire request, including the body.

			 * If zero, no timeout exists.
			 * Can be provided in a format supported by time.ParseDuration or as raw 
			 * values (digits). If no units are provided, the value is parsed assuming seconds.
			 * We strongly suggest adapting this value accordingly to your needs.
			 */
			readTimeout?: string;
			/**
			 * writeTimeout is the maximum duration before timing out writes of the response.
			 *
			 * It covers the time from the end of the request header read to the end of the
			 * response write. If zero, no timeout exists.
			 * Can be provided in a format supported by time.ParseDuration or as raw values
			 * (digits). If no units are provided, the value is parsed assuming seconds.
			 */
			writeTimeout?: string;
			/**
			 * idleTimeout is the maximum duration an idle (keep-alive) connection will remain
			 * idle before closing itself.
			 *
			 * If zero, no timeout exists.
			 * Can be provided in a format supported by time.ParseDuration or as raw values
			 * (digits). If no units are provided, the value is parsed assuming seconds.
			 */
			idleTimeout?: string;
		};
		/**
		 * Controls the behavior of Traefik during the shutdown phase.
		 */
		lifeCycle?: {
			/**
			 * Duration to keep accepting requests prior to initiating the graceful termination
			 * period (as defined by the graceTimeOut option). This option is meant to give
			 * downstream load-balancers sufficient time to take Traefik out of rotation.
			 *
			 * Can be provided in a format supported by time.ParseDuration or as raw values (digits).
			 * If no units are provided, the value is parsed assuming seconds. The zero duration
			 * disables the request accepting grace period, i.e., Traefik will immediately proceed
			 * to the grace period.
			 */
			requestAcceptGraceTimeout?: string;
			/**
			 * Duration to give active requests a chance to finish before Traefik stops.
			 *
			 * Can be provided in a format supported by time.ParseDuration or as raw values (digits).
			 *
			 * If no units are provided, the value is parsed assuming seconds.
			 */
			graceTimeOut?: string;
		};
		/**
		 * The maximum duration Traefik can handle requests before sending a Connection: Close header
		 * to the client (for HTTP2, Traefik sends a GOAWAY). Zero means no limit.
		 */
		keepAliveMaxRequests?: string;
	};
	/**
	 * Traefik supports PROXY protocol version 1 and 2.
	 *
	 * If PROXY protocol header parsing is enabled for the entry point, this entry point can accept
	 * connections with or without PROXY protocol headers.
	 *
	 * If the PROXY protocol header is passed, then the version is determined automatically.
	 */
	proxyProtocol?: {
		/**
		 * Enabling PROXY protocol with Trusted IPs.
		 */
		trustedIPs?: string[];
		/**
		 * Insecure Mode (Testing Environment Only).
		 *
		 * In a test environments, you can configure Traefik to trust every incoming connection.
		 * Doing so, every remote client address will be replaced (trustedIPs won't have any effect)
		 */
		insecure?: boolean;
	};
	/**
	 * This whole section is dedicated to options, keyed by entry point, that will apply only to HTTP routing.
	 */
	http?: {
		/**
		 * This section is a convenience to enable (permanent) redirecting of all incoming
		 * requests on an entry point (e.g. port 80) to another entry point (e.g. port 443)
		 * or an explicit port (:443).
		 */
		redirections?: {
			entryPoint: {
				/**
				 * The target element, it can be:
				 *
				 * an entry point name (ex: websecure)
				 *
				 * a port (:443)
				 */
				to: string;
				/**
				 * Default="https"
				 *
				 * The redirection target scheme.
				 */
				scheme?: "http" | "https";
				/**
				 * Default=true
				 *
				 * To apply a permanent redirection.
				 */
				permanent?: boolean;
				/**
				 * Default=MaxInt-1
				 *
				 * Priority of the generated router.
				 */
				priority?: number;
			};
		};
		/**
		 * The encodeQuerySemicolons option allows to enable query
		 * semicolons encoding. One could use this option to avoid non-encoded
		 * semicolons to be interpreted as query parameter separators by Traefik.
		 * When using this option, the non-encoded semicolons characters in query
		 * will be transmitted encoded to the backend.
		 */
		encodeQuerySemicolons?: boolean;
		/**
		 * Default=true
		 *
		 * The sanitizePath option defines whether to enable the request path sanitization.
		 * When disabled, the incoming request path is passed to the backend as is. This
		 * can be useful when dealing with legacy clients that are not url-encoding data
		 * in the request path. For example, as base64 uses the “/” character internally,
		 * if it's not url encoded, it can lead to unsafe routing when the sanitizePath
		 * option is set to false.
		 */
		sanitizePath?: boolean;
		/**
		 * The list of middlewares that are prepended by default to the list of middlewares
		 * of each router associated to the named entry point.
		 */
		middlewares?: string[];
		/**
		 * This section is about the default TLS configuration applied to all routers associated
		 * with the named entry point.
		 *
		 * If a TLS section (i.e. any of its fields) is user-defined, then the default
		 * configuration does not apply at all.
		 *
		 * The TLS section is the same as the TLS section on HTTP routers.
		 */
		tls?: TLSConfig;
	};
	/**
	 * This whole section is dedicated to options, keyed by entry point, that will apply only to UDP routing.
	 */
	udp?: {
		/**
		 * Default=3s
		 * Timeout defines how long to wait on an idle session before releasing the related resources.
		 * The Timeout value must be greater than zero.
		 */
		timeout?: string;
	};
	/**
	 * This section is dedicated to options to control observability for an EntryPoint.
	 */
	observability?: {
		/**
		 * Default=true
		 *
		 * AccessLogs defines whether a router attached to this EntryPoint produces access-logs by default.
		 * Nonetheless, a router defining its own observability configuration will opt-out from this default.
		 */
		accessLogs?: boolean;
		/**
		 * Default=true
		 *
		 * Metrics defines whether a router attached to this EntryPoint produces metrics by default. Nonetheless,
		 * a router defining its own observability configuration will opt-out from this default.
		 */
		metrics?: boolean;
		/**
		 * Default=true
		 *
		 * Tracing defines whether a router attached to this EntryPoint produces traces by default. Nonetheless,
		 * a router defining its own observability configuration will opt-out from this default.
		 */
		tracing?: boolean;
	};
}

export interface TLSConfig {
	options?: TLSOptions;
	/**
	 * If certResolver is defined, Traefik will try to generate certificates based on routers Host & HostSNI rules.
	 */
	certResolver?: string;
	/**
	 * You can set SANs (alternative domains) for each main domain. Every domain must have A/AAAA records pointing
	 * to Traefik. Each domain & SAN will lead to a certificate request.
	 */
	domains?: {
		main: string;
		sans?: string[];
	}[];
}

/**
 * The options field enables fine-grained control of the TLS parameters.
 * It refers to a TLS Options and will be applied only if a Host rule is defined.
 *
 * Service Name Association
 *
 * Even though one might get the impression that a TLS options reference is mapped
 * to a router, or a router rule, one should realize that it is actually mapped
 * only to the host name found in the Host part of the rule. Of course, there
 * could also be several Host parts in a rule, in which case the TLS options
 * reference would be mapped to as many host names.
 *
 * Another thing to keep in mind is: the TLS option is picked from the mapping
 * mentioned above and based on the server name provided during the TLS handshake,
 * and it all happens before routing actually occurs.
 */
interface TLSOptions {
	/**
	 * The default option key is special. When no tls options are specified in a tls router, the default option is used.
	 * When specifying the default option explicitly, make sure not to specify provider namespace as the default option does not have one.
	 * Conversely, for cross-provider references, for example, when referencing the file provider from a docker label, you must specify the provider namespace, for example:
	 * traefik.http.routers.myrouter.tls.options=myoptions@file
	 */
	[tlsName: string]: {
		minVersion?: string;
		maxVersion?: string;
		cipherSuites?: string[];
		curvePreferences?: string[];
		/**
		 * With strict SNI checking enabled, Traefik won't allow connections from clients that do not specify a
		 * server_name extension or don't match any of the configured certificates.
		 * The default certificate is irrelevant on that matter.
		 */
		sniStrict?: boolean;
		/**
		 * Default="h2, http/1.1, acme-tls/1"
		 *
		 * This option allows to specify the list of supported application level protocols for the TLS handshake, in order of
		 * preference. If the client supports ALPN, the selected protocol will be one from this list, and the connection will
		 * fail if there is no mutually supported protocol.
		 */
		alpnProtocols?: boolean;
		/**
		 * Traefik supports mutual authentication, through the clientAuth section.
		 *
		 * For authentication policies that require verification of the client certificate, the certificate authority for the certificates should be set in clientAuth.caFiles.
		 *
		 * In Kubernetes environment, CA certificate can be set in clientAuth.secretNames. See TLSOption resource for more details.
		 *
		 * The clientAuth.clientAuthType option governs the behaviour as follows:
		 *
		 * NoClientCert: disregards any client certificate.
		 * RequestClientCert: asks for a certificate but proceeds anyway if none is provided.
		 * RequireAnyClientCert: requires a certificate but does not verify if it is signed by a CA listed in clientAuth.caFiles or in clientAuth.secretNames.
		 * VerifyClientCertIfGiven: if a certificate is provided, verifies if it is signed by a CA listed in clientAuth.caFiles or in clientAuth.secretNames. Otherwise proceeds without any certificate.
		 * RequireAndVerifyClientCert: requires a certificate, which must be signed by a CA listed in clientAuth.caFiles or in clientAuth.secretNames.
		 */
		clieanAuth?: {
			clientAuthType?: string;
			caFiles?: string[];
			secretNames?: string[];
		};
		/**
		 * When set to true, Traefik disables the use of session tickets, forcing every client
		 * to perform a full TLS handshake instead of resuming sessions.
		 */
		disableSessionTickets?: boolean;
	};
}
