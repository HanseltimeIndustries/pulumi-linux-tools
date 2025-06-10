export function deleteDirIfExists(dir: string) {
	return `if [ -d "${dir}" ]; then rm -rf ${dir}; fi`;
}
