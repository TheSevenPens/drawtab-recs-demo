import { error } from '@sveltejs/kit';

export async function load({ params, parent }) {
	const { catalog } = await parent();
	const family = catalog.families.find((f) => f.id === params.id);
	if (!family) error(404, `No family ${params.id}`);
	return { family };
}
