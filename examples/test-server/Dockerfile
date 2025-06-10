FROM node:19

RUN groupadd -g 10001 testuser && groupadd -g 10005 swap && useradd -m -s /bin/bash "testuser" -u 10001 -g testuser

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install
COPY . .

EXPOSE 3000
CMD [ "node", "server.js" ]
