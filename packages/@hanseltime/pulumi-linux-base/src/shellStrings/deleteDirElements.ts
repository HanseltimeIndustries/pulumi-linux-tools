/**
 * Shell script that can be chained with &&'s to delete all elements in a directory if it exists
 * @param dir
 * @returns
 */
export function deleteDirElements(dir: string) {
	return `if [ -d "${dir}" ] && [ -n "$(ls -A "${dir}")" ]; then rm -rf "${dir}/"*; fi`;
}
