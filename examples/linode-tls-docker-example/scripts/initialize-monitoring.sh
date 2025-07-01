#!/bin/bash
set -eo pipefail;

SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )

read -p "Do you want to run a monitoring stack?[y|n]" MONITORING_STACK
echo

if [ "${MONITORING_STACK}" == "y" ]; then
    # Create SSL keys for grafana
    $SCRIPT_DIR/create-grafana-key.sh

    echo "Setting the monitoring stack configuration value..."
    echo "pulumi config set withMonitoring true"
    pulumi config set withMonitoring true

    read -s -p "Provide the grafana admin initial password: " ADMIN_PWORD
    echo
    echo "pulumi config set grafanaAdminInitialPassword --secret"
    echo $ADMIN_PWORD | pulumi config set grafanaAdminInitialPassword --secret
    echo "Saving initial password as current password as well, so it's clearer how to update..."
    echo "pulumi config set grafanaAdminCurrentPassword --secret"
    echo $ADMIN_PWORD | pulumi config set grafanaAdminCurrentPassword --secret

    read -p "Do you want to run an example agent-receiver pattern?[y|n]" AGENT_PATTERN
    echo

    if [ "$AGENT_PATTERN" == "y" ]; then
        echo "Setting the monitoring stack configuration value..."
        echo "pulumi config set prometheusAgentMock true"
        pulumi config set prometheusAgentMock true
    fi
fi


if [ "${MONITORING_STACK}" == "y" ]; then
    echo "IMPORTANT:: Remember to edit your /etc/hosts to resolve grafana.example.com to your instanceIp after pulumi up!"
fi