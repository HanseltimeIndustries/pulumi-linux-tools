# Test-server

This is a simple express server that helps demonstrate some of the wirings of the `DockerComposeService`
resource from `@hanseltime/pulumi-linux-docker`.

In general, this is meant to be bundle and built on the target server and will:

1. Provide a simple "I am a server" response on `/`
2. Write out a secret at `/fromSecret/<secret name>`
3. Write out the text of a file in a mount at `/var/mountedvolume` if it exists at `/fromDir/<file>`

Please note that this is clearly NOT a secure server.  It exposes secrets and volumes files so that you 
can feel comfortable verifying secrets and a volume mounted at `/var/mountedvolume`.

## TLS support

If you provide the TLS_CRT and TLS_KEY environment variables with a path to the respective TLS certificates,
the server will be started with end to end encryption at the application level.
