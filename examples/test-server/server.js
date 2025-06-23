const express = require("express");
const { existsSync, createReadStream, readFileSync } = require("fs");

const PORT = 3000;
const HOST = "0.0.0.0";

const app = express();

app.get("/", (_req, res) => {
	res.send("I'm a server!");
});

// Looks up a docker compose mounted secret and returns it
app.get("/fromSecret/:secret", (req, res) => {
	const secretPath = `/run/secrets/${req.params.secret}`;

	if (!existsSync(secretPath)) {
		res.status(403);
		res.send(`Cannot find secret ${req.params.secret}`);
	} else {
		res.send(`The secret is: ${readFileSync(secretPath).toString()}`);
	}
});

// returns the contents of the file /var/mountedvolume1/:file
app.get("/fromDir/:file", (req, res) => {
	createReadStream(`/var/mountedvolume/${req.params.file}`).pipe(res);
});

if (process.env.TLS_CRT && process.env.TLS_KEY) {
	const https = require("https");

	const serverOptions = {
		// Certificate(s) & Key(s)
		cert: readFileSync(process.env.TLS_CRT),
		key: readFileSync(process.env.TLS_KEY),

		// TLS Versions
		maxVersion: "TLSv1.3",
		minVersion: "TLSv1.2",
	};

	const server = https.Server(serverOptions, app);
	server.listen(PORT, HOST, () => {
		console.log(`listening on port ${PORT}, host: ${HOST} with at app TLS`);
	});
} else {
	app.listen(PORT, HOST, () => {
		console.log(`listening on port ${PORT}, host: ${HOST}`);
	});
}
