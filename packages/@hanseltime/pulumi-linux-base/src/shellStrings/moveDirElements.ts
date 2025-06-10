/**
 * Takes all files in a dir and moves them to another (or creates it) and fully removes any existing data
 * @param dir
 * @param moveTo
 * @returns
 */
export function moveDirElements(
	dir: string,
	moveTo: string,
	exclude?: string[],
) {
	const excludeArgs = exclude
		? exclude.map((e) => `--exclude='${e}'`).join(" ")
		: "";
	return `mkdir -p ${moveTo} && if [ -d "${dir}" ] && [ -n "$(ls -A "${dir}")" ]; then rsync -a --delete-after --remove-source-files ${excludeArgs} ${dir}/ ${moveTo}; fi`;
}
