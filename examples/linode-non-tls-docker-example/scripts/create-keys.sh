#!/bin/bash -e

SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )

$SCRIPT_DIR/create-root-ca.sh

$SCRIPT_DIR/create-grafana-key.sh