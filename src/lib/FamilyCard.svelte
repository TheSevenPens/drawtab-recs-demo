<script lang="ts">
	// One card for several devices of a family that share a rating (the "group families"
	// setting). Lists each member's size and price; links to the family page.
	import { base } from '$app/paths';
	import { familyHref, monthYear, money, penLabel, priceOf, ratingWord, releaseTime, tierClass } from './catalog';
	import type { FamilyGroup } from './family-groups';
	let { group }: { group: FamilyGroup } = $props();

	const m = $derived(group.members);
	const first = $derived(m[0]);
	const diags = $derived(m.map((i) => i.specs.activeDiagIn).filter((d): d is number => d != null));
	const sizeRange = $derived(
		diags.length ? (Math.min(...diags) === Math.max(...diags) ? `${diags[0]}″` : `${Math.min(...diags)}–${Math.max(...diags)}″`) : ''
	);
	const pens = $derived([...new Set(m.map((i) => (i.pen ? penLabel(i.pen) : null)).filter(Boolean))] as string[]);
	const released = $derived.by(() => {
		const r = m.filter((i) => i.released).sort((a, b) => releaseTime(a.released) - releaseTime(b.released));
		if (!r.length) return null;
		const a = monthYear(r[0].released) ?? r[0].year;
		const b = monthYear(r[r.length - 1].released) ?? r[r.length - 1].year;
		return a === b ? String(a) : `${a} – ${b}`;
	});
	const anyDiscontinued = $derived(m.some((i) => i.status === 'DISCONTINUED'));
</script>

<a class="card tier-{tierClass(first.rating)}" href={familyHref(base, group.familyId)}>
	<div class="band">
		<div class="top"><span class="size">{sizeRange}</span></div>
		<div class="brand">{first.brandName}</div>
		<div class="name">{group.name}</div>
		<span class="model">{m.length} models</span>
		<span class="word">{ratingWord(first)}</span>
	</div>
	<div class="body">
		<ul class="members">
			{#each m as i, k (i.id)}
				{@const p = priceOf(i)}
				<li>
					<span class="lbl">{group.labels[k]}</span>
					<span class="d">{i.specs.activeDiagIn ? `${i.specs.activeDiagIn}″` : ''}</span>
					<span class="p">{p != null ? money(p) : '—'}</span>
				</li>
			{/each}
		</ul>
		<dl class="facts">
			{#if pens.length}<dt>pen</dt><dd>{pens.length === 1 ? pens[0] : `${pens.length} different pens`}</dd>{/if}
			{#if released}<dt>released</dt><dd>{released}</dd>{/if}
		</dl>
		{#if anyDiscontinued}<div class="flags"><span class="flag warn">{m.every((i) => i.status === 'DISCONTINUED') ? 'discontinued' : 'some discontinued'}</span></div>{/if}
	</div>
</a>

<style>
	/* Mirrors Card.svelte, so a family card sits in the same grid rows as device cards. */
	.card {
		display: grid;
		grid-template-rows: subgrid;
		grid-row: span 2;
		row-gap: 0;
		text-decoration: none;
		color: var(--text);
		background: linear-gradient(rgba(255, 255, 255, 0.78), rgba(255, 255, 255, 0.84)), var(--band);
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
		min-height: 1.5rem;
		margin-bottom: -1.5rem;
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
	.body {
		padding: 0.9rem 1.25rem 1.1rem;
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
		font-size: 0.95rem;
		color: var(--text-2);
	}
	.members {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		grid-template-columns: 1fr auto auto;
		column-gap: 1rem;
	}
	.members li {
		display: contents;
	}
	.members li > span {
		padding: 0.22rem 0;
		border-bottom: 1px solid rgba(0, 0, 0, 0.08);
	}
	.lbl {
		color: var(--text);
		font-weight: 600;
	}
	.d,
	.p {
		text-align: right;
		font-variant-numeric: tabular-nums;
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
		gap: 6px;
	}
	.flag {
		padding: 0.15rem 0.5rem;
		background: rgba(255, 255, 255, 0.85);
		font-size: 0.72rem;
		font-weight: 700;
		letter-spacing: 0.08em;
		text-transform: uppercase;
	}
	.flag.warn {
		color: var(--warning);
	}
</style>
