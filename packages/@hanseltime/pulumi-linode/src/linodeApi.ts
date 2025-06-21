import type {
	ErrorResponse,
	LinodeInfoResponse,
	Paginated,
} from "./linode-types";

// linode seems to have a messy type system, I'm just gonna put it here

const LINODE_TOKEN = process.env.LINODE_TOKEN;
const BASE_LINODE = "https://api.linode.com/v4";

if (!LINODE_TOKEN) {
	throw new Error("Must supply LINODE_TOKEN on shell");
}

const AUTH_HEADERS = {
	authorization: `Bearer ${LINODE_TOKEN}`,
};

export async function getLinodeInfo(linodeId: number) {
	const url = `${BASE_LINODE}/linode/instances/${linodeId}`;
	const options = {
		method: "GET",
		headers: {
			accept: "application/json",
			...AUTH_HEADERS,
		},
	};

	const resp = await fetch(url, options);

	if (resp.status !== 200) {
		const errResponse = (await resp.json()) as ErrorResponse;
		throw new Error(
			`Could not retrieve information for linode(${linodeId}) from the linode api:\n${JSON.stringify(errResponse)}`,
		);
	}

	const payload = (await resp.json()) as LinodeInfoResponse;
	return payload;
}

export async function tagLinode(label: string, linodeId: number) {
	const url = `${BASE_LINODE}/tags`;
	const options = {
		method: "POST",
		headers: {
			accept: "application/json",
			"content-type": "application/json",
			...AUTH_HEADERS,
		},
		body: JSON.stringify({
			label,
			linodes: [linodeId],
		}),
	};

	const resp = await fetch(url, options);

	if (resp.status !== 200 && resp.status !== 201) {
		const errResponse = (await resp.json()) as ErrorResponse;
		throw new Error(
			`Could not tag linode(${linodeId}) with label ${label}\n${JSON.stringify(errResponse)}`,
		);
	}

	const payload = (await resp.json()) as LinodeInfoResponse;
	return payload;
}

export async function getLinodeInfoByLabel(
	label: string,
): Promise<LinodeInfoResponse | undefined> {
	const url = `${BASE_LINODE}/linode/instances?page=1&page_size=100`;
	const options = {
		method: "GET",
		headers: {
			accept: "application/json",
			"X-Filter": JSON.stringify({ label }),
			...AUTH_HEADERS,
		},
	};

	const resp = await fetch(url, options);

	if (resp.status !== 200) {
		const errResponse = (await resp.json()) as ErrorResponse;
		throw new Error(
			`Could not retrieve information for linode(${label}) from the linode api:\n${JSON.stringify(errResponse)}`,
		);
	}

	const payload = (await resp.json()) as Paginated<LinodeInfoResponse>;
	return payload.data[0] ?? undefined;
}
