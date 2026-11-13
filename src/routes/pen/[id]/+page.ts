import { error } from '@sveltejs/kit';

export async function load({ params, parent }) {
	const { catalog } = await parent();
	const pen = catalog.pens.find((p) => p.id === params.id);
	if (!pen) error(404, `No pen ${params.id}`);
	return { pen };
}
