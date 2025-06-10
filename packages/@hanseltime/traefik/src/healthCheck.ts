/**
 * Http Health check options for Traefik load balancer
 */
export interface HttpHealthCheck {
	/**
	 * defines the server URL path for the health check endpoint
	 */
	path: string;
	/**
	 * replaces the server URL scheme for the health check endpoint
	 */
	scheme?: string;
	/**
	 * (default: http), if defined to grpc, will use the gRPC health check protocol to probe the server.
	 */
	mode?: string;
	/**
	 * sets the value of hostname in the Host header of the health check request.
	 */
	hostname?: string;
	/**
	 *  replaces the server URL port for the health check endpoint.
	 */
	port?: string;
	/**
	 * (default: 30s), defines the frequency of the health check calls.
	 */
	interval?: string;
	/**
	 * (default: 5s), defines the maximum duration Traefik will wait for a health check request before considering the server unhealthy.
	 */
	timeout?: string;
	/**
	 * defines custom headers to be sent to the health check endpoint.
	 */
	headers?: {
		[key: string]: string;
	};
	/**
	 * (default: true), defines whether redirects should be followed during the health check calls.
	 */
	followRedirects?: boolean;
	/**
	 * (default: GET), defines the HTTP method that will be used while connecting to the endpoint.
	 */
	method?: string;
	/**
	 * defines the expected HTTP status code of the response to the health check request.
	 */
	status?: string;
}
