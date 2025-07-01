import type { v3 } from "@hanseltime/compose-types";

/**
 * This will take a set of base labels or env and then apply the docker compose labels/env
 * type structure on top of them to create an overridden set of labels.
 * @param baseLabels
 * @param toOverride
 * @returns
 */
export function overrideLabelsOrEnv(
	baseLabels: {
		[k: string]: string | number | boolean | null;
	},
	toOverride: v3.Service["labels"] | undefined,
): {
	[k: string]: string | number | boolean | null;
} {
	const labels = { ...baseLabels };
	if (toOverride) {
		if (Array.isArray(toOverride)) {
			toOverride.forEach((l) => {
				const equalsIdx = l.indexOf("=");
				if (equalsIdx > 0) {
					const k = l.substring(0, equalsIdx);
					const v = l.substring(equalsIdx + 1);
					labels[k] = v;
				} else {
					labels[l] = null;
				}
			});
		} else {
			Object.keys(toOverride).forEach((k) => {
				const v = toOverride[k];
				labels[k] = v;
			});
		}
	}
	return labels;
}
