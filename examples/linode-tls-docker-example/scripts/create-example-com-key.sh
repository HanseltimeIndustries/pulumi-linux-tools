#!/bin/bash -e

FOLDER=certs

echo "Creating a self-signed TLS certificate for example.com..."
openssl req -new -sha256  -nodes -days 365 \
  -out ${FOLDER}/example.com.csr \
  -newkey rsa:2048 \
  -keyout ${FOLDER}/example.com.key \
  -subj "/C=US/ST=State/L=City/O=Organization/CN=example.com"

cat > ${FOLDER}/example.com.ext <<EOF
authorityKeyIdentifier=keyid,issuer
basicConstraints=CA:FALSE
keyUsage = digitalSignature, keyEncipherment
extendedKeyUsage = serverAuth
subjectAltName = @alt_names

[alt_names]
DNS.1 = grafana.example.com
EOF

# Sign the CSR
openssl x509 -req -in ${FOLDER}/example.com.csr \
  -CA ${FOLDER}/example.rootCA.pem -CAkey ${FOLDER}/example.rootCA.key -CAcreateserial \
  -out ${FOLDER}/example.com.crt -days 825 -sha256 \
  -extfile ${FOLDER}/example.com.ext

# Create certificate chain if we were doing intermediates
# cat ${FOLDER}/example.com.crt ${FOLDER}/example.intermediateCA.pem > ${FOLDER}/example.com.fullchain.pem

echo "Storing TLS key and crt as a pulumi secret..."
echo "cat ${FOLDER}/example.com.crt | pulumi config set certcrt --secret"
cat ${FOLDER}/example.com.crt | pulumi config set certcrt --secret
echo "cat ${FOLDER}/example.com.key | pulumi config set certkey --secret"
cat ${FOLDER}/example.com.key | pulumi config set certkey --secret
