import fs from 'node:fs';
import path from 'node:path';
import { slugOf, type Catalog } from '$lib/catalog';

// Build time only: one prerendered page per recommendation, so each device has
// a real URL that answers 200 and carries its own title and preview text.
export function entries() {
	const file = path.join(process.cwd(), 'static', 'data', 'catalog.json');
	const catalog: Catalog = JSON.parse(fs.readFileSync(file, 'utf8'));
	return catalog.items.filter((i) => i.kind !== 'pen').map((i) => ({ id: slugOf(i) }));
}
