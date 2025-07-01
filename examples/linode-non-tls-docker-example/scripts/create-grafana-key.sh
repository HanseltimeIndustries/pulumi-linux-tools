#!/bin/bash -e

FOLDER=certs

# Create Server Cert
cat > ${FOLDER}/grafana.example.com.conf <<EOF
[ req ]
default_bits       = 2048
prompt             = no
default_md         = sha256
distinguished_name = dn

[ dn ]
C  = US
ST = State
L  = City
O  = ExampleOrg
OU = IT
CN = grafana.example.com
EOF

echo "Creating a self-signed TLS certificate for grafana.example.com..."
openssl req -new -sha256 -nodes -days 365 \
  -out ${FOLDER}/grafana.example.com.csr \
  -newkey rsa:2048 \
  -keyout ${FOLDER}/grafana.example.com.key \
  -config ${FOLDER}/grafana.example.com.conf

cat > ${FOLDER}/grafana.ext <<EOF
authorityKeyIdentifier=keyid,issuer
basicConstraints=CA:FALSE
keyUsage = digitalSignature, keyEncipherment
extendedKeyUsage = serverAuth
subjectAltName = @alt_names

[alt_names]
DNS.1 = grafana.example.com
EOF

# Sign the CSR
openssl x509 -req -in ${FOLDER}/grafana.example.com.csr \
  -CA ${FOLDER}/example.rootCA.pem -CAkey ${FOLDER}/example.rootCA.key -CAcreateserial \
  -out ${FOLDER}/grafana.example.com.crt -days 825 -sha256 \
  -extfile ${FOLDER}/grafana.ext

# Create certificate chain
cat ${FOLDER}/grafana.example.com.crt ${FOLDER}/example.intermediateCA.pem > ${FOLDER}/grafana.example.com.fullchain.pem

# cat ${FOLDER}/example.intermediateCA.pem ${FOLDER}/example.rootCA.pem > ${FOLDER}/ca-chain-for-node.pem
cat ${FOLDER}/example.rootCA.pem > ${FOLDER}/ca-chain-for-node.pem

echo "Storing TLS key and crt as a pulumi secret..."
echo "cat ${FOLDER}/grafana.example.com.crt | pulumi config set grafanacertcrt --secret"
cat ${FOLDER}/grafana.example.com.crt | pulumi config set grafanacertcrt --secret
echo "cat ${FOLDER}/grafana.example.com.key | pulumi config set grafanacertkey --secret"
cat ${FOLDER}/grafana.example.com.key | pulumi config set grafanacertkey --secret