import { PKG } from "@hanseltime/pulumi-linux-base";
import { join, sep } from "path";

export const LIBRARY_PREFIX = `${PKG}:docker`;
// Since we are nesting our cjs and esm compilations, we need to detect how far away dist is (since its src = dist depth)
const distIndex = __dirname
	.split(sep)
	.reverse()
	.findIndex((v) => v === "dist");
// Assume we're running in src and correct to 0
const extraUp = distIndex !== -1 ? "..".repeat(distIndex) : "";
export const ASSET_PATH = join(__dirname, extraUp, "..", "assets");
