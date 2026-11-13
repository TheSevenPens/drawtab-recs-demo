import { error } from '@sveltejs/kit';
import { slugOf } from '$lib/catalog';

export async function load({ params, parent }) {
	const { catalog } = await parent();
	const item = catalog.items.find((i) => slugOf(i) === params.id);
	if (!item) error(404, `No recommendation for ${params.id}`);
	return { item };
}
