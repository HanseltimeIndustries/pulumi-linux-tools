#!/bin/bash -e

FOLDER=certs

# Root CA generation
# Generate private key
openssl genrsa -out ${FOLDER}/example.rootCA.key 4096

# Create root CA cert (self-signed)
openssl req -x509 -new -nodes -key ${FOLDER}/example.rootCA.key -sha256 -days 3650 -out ${FOLDER}/example.rootCA.pem \
  -subj "/C=US/ST=State/L=City/O=ExampleOrg/OU=IT/CN=ExampleRootCA" \
  -addext "basicConstraints=critical,CA:TRUE,pathlen:1" \
  -addext "keyUsage=critical,keyCertSign,cRLSign"
