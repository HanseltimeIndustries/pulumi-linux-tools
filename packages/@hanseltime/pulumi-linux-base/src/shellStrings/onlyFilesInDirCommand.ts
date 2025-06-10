/**
 * Command that ensures that the directory only has these files in it
 *
 * @param dirPath - the absolute path to the directory we'er aligning
 * @param files - a list of relative file paths within the directory
 */
export function onlyFilesInDirCommand(dirPath: string, files: string[]) {
	if (!dirPath.startsWith("/")) {
		throw new Error(`dirPath must be absolute! ${dirPath}`);
	}

	const fullPath = `${dirPath.endsWith("/") ? dirPath.substring(0, dirPath.length - 1) : dirPath}`;
	const scanCommand = `find ${fullPath} -type f -printf '%P\\n' | sort`;
	const getMissingLines = (check: string, existingLines: string) => {
		return `comm -23 ${check} ${existingLines}`;
	};
	return `mkdir -p ${fullPath}; ${getMissingLines(`<(${scanCommand})`, `<(echo -e "${files.sort().join("\\n")}" | sort)`)} | xargs -I '{}' rm ${fullPath}/{}`;
}
