#!/bin/bash -e

#########################################################
#
# Sets up this example with secret values
#
#########################################################

SSH_KEY=${SSH_PATH:-$HOME/.ssh/linode_public_internet_vpn_rsa}

set +e;
stackExists=$(pulumi stack ls | grep example)
set -e;
if [ -z "$stackExists" ]; then
    echo "Creating the 'example' stack..."
    pulumi stack init --stack example
fi

echo "Creating ssh keys at $SSH_KEY..."
read -s -p "Please provide the ssh password: " SSH_PASSWORD
echo
ssh-keygen -b 2048 -t rsa -f $SSH_KEY -N $SSH_PASSWORD

echo "Copying public key to project as part of version control..."
cp $SSH_KEY.pub ./public_keys/

echo "Saving ssh password..."
echo "pulumi config set sshPassword --secret"
echo $SSH_PASSWORD | pulumi config set sshPassword --secret

echo "Saving the pub key that we expect for deployments..."
echo "pulumi config set deploymentSSHKey"
pulumi config set deploymentSSHKey $(basename $SSH_KEY).pub

read -s -p "Please provide the root user password: " ROOT_PASSWORD
echo
echo "pulumi config set rootPassword --secret"
echo $ROOT_PASSWORD | pulumi config set rootPassword --secret

read -s -p "Please provide the automation user password: " AUTO_USER_PASSWORD
echo
echo "pulumi config set automationUserPassword --secret"
echo $AUTO_USER_PASSWORD | pulumi config set automationUserPassword --secret

read -s -p "Linode: Provide your Linode API KEY for deployment: " LINODE_KEY
echo
echo "Saving key to .env file"
echo "LINODE_TOKEN=${LINODE_KEY}" >> .env

read -p "Please provide linode region to deploy in: " LINODE_REGION
echo
echo "pulumi config set linodeRegion ${LINODE_REGION}"
pulumi config set linodeRegion ${LINODE_REGION}

echo "Creating a public-private key for your wireguard client..."
mkdir -p private_keys
mkdir -p public_keys
mkdir -p wg_configs
wg genkey | tee private_keys/vpn_myclient | wg pubkey > public_keys/vpn_myclient
echo "Generated private + public key (vpn_myclient)..."
echo "Remember to create the config from the auto-generated public key on the wireguard server"

echo "Success!"
echo "Note: run 'set -a; source .env; set +a;' before running pulumi commands on your shell"
