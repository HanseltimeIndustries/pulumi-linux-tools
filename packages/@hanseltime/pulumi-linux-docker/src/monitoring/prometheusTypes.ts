/**
 * Incomplete (as of now) types for prometheus config
 */
import type * as pulumi from "@pulumi/pulumi";

export interface PrometheusHttpConfig {
	/**
	 * Sets the `Authorization` header on every request with the
	 * configured username and password.
	 * username and username_file are mutually exclusive.
	 * password and password_file are mutually exclusive.
	 */
	basic_auth?: {
		username?: pulumi.Input<string>;
		username_file?: pulumi.Input<string>;
		password?: pulumi.Input<string>;
		password_file?: pulumi.Input<string>;
	};
	/**
	 *  Sets the `Authorization` header on every request with
	 * the configured credentials.
	 */
	authorization?: {
		/**
		 * default: Bearer
		 */
		type?: pulumi.Input<string>;
		/**
		 * Sets the credentials of the request. It is mutually exclusive with
		 * `credentials_file`.
		 */
		credentials?: pulumi.Input<string>;
		/**
		 * Sets the credentials of the request with the credentials read from the
		 * configured file. It is mutually exclusive with `credentials`.
		 */
		credentials_file?: pulumi.Input<string>;
	};
	/**
	 * Configure whether requests follow HTTP 3xx redirects.
	 *
	 * default: true
	 */
	follow_redirects?: pulumi.Input<boolean>;
	/**
	 * Whether to enable HTTP2.
	 */
	enable_http2?: pulumi.Input<boolean>;
	/**
	 * Optional proxy url
	 */
	proxy_url?: pulumi.Input<string>;
	/**
	 * Comma-separated string that can contain IPs, CIDR notation, domain names
	 * that should be excluded from proxying. IP and domain names can
	 * contain port numbers.
	 */
	no_proxy?: pulumi.Input<string>;
	/**
	 * Use proxy URL indicated by environment variables (HTTP_PROXY, https_proxy, HTTPs_PROXY, https_proxy, and no_proxy)
	 * default: false
	 */
	proxy_from_environment?: pulumi.Input<boolean>;
	/**
	 * Specifies headers to send to proxies during CONNECT requests.
	 */
	proxy_connect_header?: pulumi.Input<{
		[header: string]: pulumi.Input<pulumi.Input<string>[]>;
	}>;
	/**
	 * Custom HTTP headers to be sent along with each request.
	 * Headers that are set by Prometheus itself can't be overwritten.
	 */
	http_headers: {
		[header: string]: {
			/**
			 * Header values
			 */
			values?: pulumi.Input<pulumi.Input<string>[]>;
			/**
			 * Headers values. Hidden in configuration page.
			 */
			secrets?: pulumi.Input<pulumi.Input<string>[]>;
			/**
			 * Files to read header values from.
			 */
			files: pulumi.Input<pulumi.Input<string>[]>;
		};
	};
	tls_config: pulumi.Input<PrometheusTLSConfig>;
	/**
	 * See https://prometheus.io/docs/prometheus/latest/configuration/configuration/#oauth2
	 * for properties
	 */
	oauth2?: pulumi.Input<any>;
}

export interface PrometheusTLSConfig {
	/**
	 * CA certificate to validate API server certificate with. At most one of ca and ca_file is allowed.
	 */
	ca?: pulumi.Input<string>;
	/**
	 * CA certificate file to validate API server certificate with. At most one of ca and ca_file is allowed.
	 */
	ca_file?: pulumi.Input<string>;
	/**
	 * Certificate and key for client cert authentication to the server.
	 * At most one of cert and cert_file is allowed.
	 * At most one of key and key_file is allowed.
	 */
	cert?: pulumi.Input<string>;
	cert_file?: pulumi.Input<string>;
	key?: pulumi.Input<string>;
	key_file?: pulumi.Input<string>;
	/**
	 * ServerName extension to indicate the name of the server.
	 * https://tools.ietf.org/html/rfc4366#section-3.1
	 */
	server_name?: pulumi.Input<string>;
	/**
	 * Disable validation of the server certificate.
	 */
	insecure_skip_verify?: pulumi.Input<boolean>;

	/**
	 * Minimum acceptable TLS version. Accepted values: TLS10 (TLS 1.0), TLS11 (TLS
	 * 1.1), TLS12 (TLS 1.2), TLS13 (TLS 1.3).
	 * If unset, Prometheus will use Go default minimum version, which is TLS 1.2.
	 * See MinVersion in https://pkg.go.dev/crypto/tls#Config.
	 */
	min_version?: pulumi.Input<string>;
	/**
	 * Maximum acceptable TLS version. Accepted values: TLS10 (TLS 1.0), TLS11 (TLS
	 * 1.1), TLS12 (TLS 1.2), TLS13 (TLS 1.3).
	 * If unset, Prometheus will use Go default maximum version, which is TLS 1.3.
	 * See MaxVersion in https://pkg.go.dev/crypto/tls#Config.
	 */
	max_version?: pulumi.Input<string>;
}
