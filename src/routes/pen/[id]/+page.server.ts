import fs from 'node:fs';
import path from 'node:path';
import type { Catalog } from '$lib/catalog';

// Build time only: one prerendered page per pen in the catalog.
export function entries() {
	const file = path.join(process.cwd(), 'static', 'data', 'catalog.json');
	const catalog: Catalog = JSON.parse(fs.readFileSync(file, 'utf8'));
	return catalog.pens.map((x) => ({ id: x.id }));
}
