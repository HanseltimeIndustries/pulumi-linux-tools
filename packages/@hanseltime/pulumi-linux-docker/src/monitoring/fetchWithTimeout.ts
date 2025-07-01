import type { RequestInfo, RequestInit, Response } from "node-fetch";

// Helper function for better timeout errors
export async function fetchWithTimeout(
	url: URL | RequestInfo,
	options: Omit<RequestInit, "signal">,
	timeoutMs: number,
): Promise<Response> {
	const fetch = (await import("node-fetch")).default;

	try {
		return await fetch(url, {
			...options,
			signal: AbortSignal.timeout(timeoutMs),
		});
	} catch (err) {
		if ((err as any).name === "AbortError") {
			console.error(`Fetch timed out after ${timeoutMs} ms: ${url}`);
			throw err;
		}
		console.error(`Fetch failed for ${url}: ${err}`);

		throw err;
	}
}
