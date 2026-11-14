<script lang="ts">
	import { base } from '$app/paths';
	import { deviceHref, cardFacts, shortName, sizeLabel, sortedNotes, tierClass, ratingWord, LIST_LABEL, shownLists, type Item } from './catalog';

	import { units } from './units.svelte';
	// variant: a lower-half style being tried out on /card-options (none = the current look).
	let { item, expert = false, variant = '' }: { item: Item; expert?: boolean; variant?: string } = $props();
	const href = $derived(deviceHref(base, item));
	const facts = $derived(cardFacts(item, units.value));
	// Pen cards stay short: the release row says "(expected)" instead of a note.
	const notes = $derived(item.kind === 'pen' ? [] : sortedNotes(item).slice(0, expert ? 9 : 1));
	const flags = $derived(
		[
			item.status === 'DISCONTINUED' ? 'discontinued' : null,
			item.ratingBasis === 'SPECS_ONLY' && item.kind !== 'pen' ? 'not released yet' : null,
			item.kind === 'family' ? 'product family' : null,
			...shownLists(item).map((l) => LIST_LABEL[l] ?? l.toLowerCase())
		].filter(Boolean) as string[]
	);
</script>

<a class="card tier-{tierClass(item.rating)} {variant ? `v-${variant}` : ''}" class:pen={item.kind === 'pen'} {href}>
	<div class="band">
		<div class="top"><span class="size">{sizeLabel(item)}</span></div>
		<div class="brand">{item.brandName}</div>
		<div class="name">{shortName(item)}</div>
		{#if item.kind !== 'family' && item.modelId && item.modelId.toLowerCase() !== shortName(item).toLowerCase()}<span class="model">{item.modelId}</span>{:else}<span class="model blank" aria-hidden="true">&nbsp;</span>{/if}
		<span class="word">{ratingWord(item)}</span>
	</div>
	<div class="body">
		{#if item.aka.length}<div class="aka">also sold as {item.aka.join(', ')}</div>{/if}
		{#if facts.length}
			<dl class="facts">
				{#each facts as [k, v] (k)}<dt>{k}</dt><dd>{v}</dd>{/each}
			</dl>
		{/if}
		{#if flags.length}
			<div class="flags">{#each flags as f, k (k)}<span class="flag" class:warn={f === 'discontinued' || f === 'not released yet'}>{f}</span>{/each}</div>
		{/if}
		{#each notes as n, k (k)}
			<p class="note {n.kind.toLowerCase()}">{n.text}</p>
		{/each}
	</div>
</a>

<style>
	/* The band and body are rows of the parent grid (subgrid), so every band
	   in a grid row is the same height even when a name wraps. */
	.card {
		display: grid;
		grid-template-rows: subgrid;
		grid-row: span 2;
		row-gap: 0;
		text-decoration: none;
		color: var(--text);
		/* The band colour carried down, lightened as if see-through over the page
		   (option 5 on /card-options, chosen Nov 2026). */
		background: linear-gradient(rgba(255, 255, 255, 0.78), rgba(255, 255, 255, 0.84)), var(--band);
	}
	.card:hover {
		color: var(--text);
	}
	.card:hover .name {
		text-decoration: underline;
		text-decoration-thickness: 2px;
		text-underline-offset: 4px;
	}
	.band {
		position: relative;
		background: var(--band);
		color: #fff;
		padding: 1rem 1.25rem 2.1rem;
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
	}
	.top {
		display: flex;
		justify-content: flex-end;
		align-items: baseline;
		min-height: 1.5rem;
		margin-bottom: -1.5rem;
	}
	/* Rating sits in a shaded box flush with the band's lower-right corner. */
	.word {
		position: absolute;
		right: 0;
		bottom: 0;
		padding: 0.3rem 0.75rem;
		background: rgba(255, 255, 255, 0.18);
		font-size: 0.75rem;
		font-weight: 700;
		letter-spacing: 0.16em;
		text-transform: uppercase;
	}
	.size {
		font-size: 1.25rem;
		font-weight: 300;
	}
	.brand {
		margin-top: 0.6rem;
		font-size: 0.95rem;
		font-weight: 700;
		letter-spacing: 0.14em;
		text-transform: uppercase;
	}
	.name {
		font-size: 1.6rem;
		font-weight: 600;
		line-height: 1.15;
		letter-spacing: -0.02em;
	}
	.model {
		align-self: flex-start;
		margin-top: 0.4rem;
		padding: 0.15rem 0.5rem;
		background: rgba(0, 0, 0, 0.3);
		font: 600 0.875rem var(--sans);
		letter-spacing: 0.03em;
	}
	/* Pens have no size line, so their band can be shorter. */
	.card.pen .band {
		padding-top: 0.8rem;
		padding-bottom: 1.9rem;
	}
	.card.pen .top {
		display: none;
	}
	.card.pen .brand {
		margin-top: 0;
	}
	.model.blank {
		visibility: hidden;
	}
	.body {
		padding: 0.9rem 1.25rem 1.1rem;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		font-size: 0.95rem;
		color: var(--text-2);
		flex: 1;
	}
	.aka {
		font-style: italic;
	}
	.facts {
		display: grid;
		grid-template-columns: max-content 1fr;
		gap: 0.25rem 0.75rem;
		margin: 0;
	}
	dt {
		font-size: 0.72rem;
		font-weight: 700;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: var(--text-3);
		padding-top: 0.15rem;
	}
	dd {
		margin: 0;
	}
	.flags {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
	}
	.flag {
		padding: 0.15rem 0.5rem;
		background: rgba(255, 255, 255, 0.85);
		font-size: 0.72rem;
		font-weight: 700;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--text-2);
	}
	.flag.warn {
		color: var(--warning);
	}
	.note {
		margin: 0;
		padding-left: 0.6rem;
		border-left: 3px solid var(--text-4);
		font-size: 0.875rem;
		line-height: 1.4;
	}
	.note.warning {
		border-color: var(--warning);
	}
	.note.tip {
		border-color: var(--tip);
	}

	/* ---- Lower-half options under review (/card-options). ---- */
	/* Dark lower halves: white text, softened labels and chips. */
	.card:is(.v-black, .v-glass, .v-shade) .body {
		color: #fff;
	}
	.card:is(.v-black, .v-glass, .v-shade) dt {
		color: rgba(255, 255, 255, 0.68);
	}
	.card:is(.v-black, .v-glass, .v-shade) .flag {
		background: rgba(255, 255, 255, 0.16);
		color: #fff;
	}
	.card:is(.v-black, .v-glass, .v-shade) .flag.warn {
		color: #ffc9a8;
	}
	.card:is(.v-black, .v-glass, .v-shade) .note {
		border-color: rgba(255, 255, 255, 0.45);
	}
	.card:is(.v-black, .v-glass, .v-shade) .note.warning {
		border-color: #ff9a62;
	}
	/* 1. Solid near-black. */
	.card.v-black {
		background: #17151a;
	}
	/* 2. Dark gradient, slightly see-through so the page colour tints it. */
	.card.v-glass {
		background: linear-gradient(180deg, rgba(23, 21, 26, 0.94), rgba(23, 21, 26, 0.8));
	}
	/* 3. No background: the text sits on the page. */
	.card.v-none {
		background: transparent;
	}
	.card.v-none .flag {
		background: var(--surface);
	}
	/* 4. The band's own colour carried down, a shade deeper. */
	.card.v-shade {
		background: linear-gradient(rgba(0, 0, 0, 0.32), rgba(0, 0, 0, 0.44)), var(--band);
	}
	/* 5. The band's colour, lightened: now the default look above. */
	/* The old pale rating wash, kept for comparison. */
	.card.v-wash {
		background: var(--wash);
	}
	/* 6. White, with a thin rating-colour frame round the lower half. */
	.card.v-frame {
		background: var(--surface);
	}
	.card.v-frame .body {
		border: 2px solid transparent;
		border-top: 0;
		border-image: var(--band) 1;
	}
	.card.v-frame .flag {
		background: var(--surface-2, #f1efec);
	}
</style>
