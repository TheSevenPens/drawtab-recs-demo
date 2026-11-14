<script lang="ts">
	// Side-by-side options for the card's lower half, for Seven to pick from.
	// Temporary: delete this page once a style is chosen.
	import { base } from '$app/paths';
	import Card from '$lib/Card.svelte';
	import type { Item } from '$lib/catalog';
	let { data } = $props();

		// One real device per rating (a pen display where there is one), preferring ones with a note so every part shows.
	const pick = (items: Item[], r: string) =>
		items.find((i) => i.kind === 'device' && i.type === 'PENDISPLAY' && i.rating === r && i.notes.length) ??
		items.find((i) => i.kind === 'device' && i.rating === r);
	const samples = $derived(['EXCELLENT', 'VERY GOOD', 'GOOD', 'OK'].map((r) => pick(data.catalog.items, r)).filter(Boolean) as Item[]);

	const OPTIONS: [string, string, string][] = [
		['', 'Current', 'The pale rating wash we have now, for reference.'],
		['black', '1. Black', 'White text on solid near-black.'],
		['glass', '2. Dark glass', 'White text on a dark gradient that is slightly see-through.'],
		['none', '3. No background', 'The text sits straight on the page; the band alone carries the colour.'],
		['shade', '4. Deeper shade', 'The band colour carried down, a shade darker, white text.'],
		['tint', '5. Light tint', 'The band colour carried down, lightened as if see-through over the page.'],
		['frame', '6. White with a frame', 'White, with a thin rating-colour frame around the lower half.']
	];
</script>

<svelte:head><title>Card options</title></svelte:head>

<main class="wrap">
	<a href="{base}/">← back to recommendations</a>
	<h1>card options</h1>
	<p class="lede">Each row is the same four real devices, one per rating, with a different lower half.</p>
	{#each OPTIONS as [v, name, desc] (name)}
		<section>
			<h2>{name}</h2>
			<p>{desc}</p>
			<div class="grid">
				{#each samples as i (i.id)}<Card item={i} variant={v} />{/each}
			</div>
		</section>
	{/each}
</main>

<style>
	.wrap {
		max-width: 1400px;
		margin: 0 auto;
		padding: 1.5rem 2rem 4rem;
	}
	h1 {
		font-weight: 300;
		font-size: 2.4rem;
		margin: 0.5rem 0 0.25rem;
	}
	.lede {
		color: var(--text-2);
		margin: 0 0 1.5rem;
	}
	section {
		margin-top: 2.25rem;
	}
	h2 {
		font-weight: 400;
		font-size: 1.6rem;
		margin: 0;
	}
	section > p {
		margin: 0.2rem 0 0.9rem;
		color: var(--text-2);
	}
	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(min(290px, 100%), 1fr));
		gap: 1rem;
	}
</style>
