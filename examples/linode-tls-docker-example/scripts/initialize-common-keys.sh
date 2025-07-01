#!/bin/bash
set -eo pipefail;

SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )

# Create SSL keys for rootCA and our example.com keys
$SCRIPT_DIR/create-keys.sh

echo "IMPORTANT:: Remember to edit your /etc/hosts to resolve example.com to your instanceIp after pulumi up!"