#!/bin/bash -e

##############################################################
#
# <script>.sh <config file> [client ip] [server addr] [privatekey] [presharedkey] [vlan cidr] [server public key]
#
# config file - the name of the config file we'll output in wg_configs/
#
# This is a simple script that sets up a very simple wireguard
# client configuration file from the private key of a client and
# the public key of the server.
#
# In keeping with this example repo, we actually set up some defaults
# that will already pull expected pulumi values, etc.
#
# If you were to adapt this to your own flows, you would probably want
# to add additional things like changing "allowed ips" to be split tunnel
# or even adding a DNS server that might be on the Linode network so
# that you can resolve local dns names as well.
#
###############################################################

SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )

CONF_FILE_NAME=$1
CLIENT_IP=$2
SERVER_ADDR=$3
PRIVATE_KEY=$4
PRESHARED_KEY=$5
VLAN_CIDR=$6
SERVER_PUBLIC_KEY=$7

if [ -z "$CONF_FILE_NAME" ]; then
    echo "Must supply position 1 config file"
    exit 1
fi

CONF_FILE="${SCRIPT_DIR}/wg_configs/${CONF_FILE_NAME}"

if [ -z "$PRIVATE_KEY" ]; then
    PRIVATE_KEY=$(cat $SCRIPT_DIR/private_keys/vpn_myclient)
fi

if [ -z "$SERVER_ADDR" ]; then
    SERVER_ADDR="$(pulumi stack output instanceIp):$(pulumi stack output vpnPort)"
fi

if [ -z "$SERVER_PUBLIC_KEY" ]; then
    SERVER_PUBLIC_KEY=$(pulumi stack output vpnPublicKey --show-secrets)
fi

if [ -z "$CLIENT_IP" ]; then
    CLIENT_IP=$(pulumi stack output myVpnClientIp)
fi

if [ -z "$PRESHARED_KEY" ]; then
    PRESHARED_KEY=$(pulumi stack output myVpnClientPresharedKey --show-secrets)
fi

if [ -z "$VLAN_CIDR" ]; then
    VLAN_CIDR=$(pulumi stack output vpnVlanCIDR)
fi

# Since this example is an internet proxy, we allow everything
cat <<EOF > $CONF_FILE
[Interface]
Address = $CLIENT_IP
PrivateKey = $PRIVATE_KEY

[Peer]
PublicKey = $SERVER_PUBLIC_KEY
Endpoint = $SERVER_ADDR
PresharedKey = $PRESHARED_KEY
AllowedIPs = $VLAN_CIDR
EOF

echo "SUCCESSFULLY wrote wg-quick configuration to ${CONF_FILE}"
echo "You should now add this to your wg config location for your system and then call 'wg-quick up <name of config file>'"
