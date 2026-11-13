import { base } from '$app/paths';
import type { Catalog } from '$lib/catalog';

export const prerender = true;
// Every page is a folder with its own index.html: GitHub Pages serves those
// without redirects, and device ids (which contain dots) stay clean URLs.
export const trailingSlash = 'always';

export async function load({ fetch }) {
	const res = await fetch(`${base}/data/catalog.json`);
	const catalog: Catalog = await res.json();
	return { catalog };
}
