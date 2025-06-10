export function insertNamespaceRange(
	path: string,
	entity: string,
	start: number,
	range: number,
) {
	const rangeLine = `${entity}:${start}:${range}`;
	return `(grep -q ${entity} ${path} && sed -i '/${entity}:/c\\${rangeLine}' ${path} || echo ${rangeLine} >> ${path})`;
}
