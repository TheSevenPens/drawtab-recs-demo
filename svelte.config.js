import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),
	kit: {
		adapter: adapter({ fallback: '404.html' }),
		prerender: {
			// Filter state lives in the hash (#type=PENDISPLAY&brands=HUION), not in element ids.
			handleMissingId: ({ id, message }) => {
				if (id.includes('=')) return;
				throw new Error(message);
			}
		},
		paths: {
			// For GitHub Pages under a repo name, build with BASE_PATH=/repo-name.
			base: process.env.BASE_PATH ?? ''
		}
	}
};

export default config;
