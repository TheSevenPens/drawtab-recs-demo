<script lang="ts">
	import { base } from '$app/paths';
	import '$lib/detail.css';
	import Hero from '$lib/Hero.svelte';
	import PressureSection from '$lib/PressureSection.svelte';
	import { TYPE_LABEL, longDate, monthYear, tabletHref, tierClass, tierWord, type TabletRef } from '$lib/catalog';

	let { data } = $props();
	const p = $derived(data.pen);
	const yn = (v: boolean | null | undefined) => (v === true ? 'yes' : v === false ? 'no' : null);
	const tech = (t: string | null) => (t ? t.replace('_', ' ').toLowerCase().replace('emr', 'EMR') : null);
	const rating = $derived(p.rating);
	const notes = $derived([...(p.notes ?? [])].sort((a, b) => (a.kind === 'WARNING' ? -1 : 0) - (b.kind === 'WARNING' ? -1 : 0)));
	const history = $derived([...(p.history ?? [])].reverse());

	type Tile = [string, string | null, string];
	const glance = $derived(
		(
			[
				['PRESSURE', p.pressure ? `${p.pressure} levels` : null, ''],
				['TILT', yn(p.tilt), ''],
				['IAF', p.pressureIaf ? `${p.pressureIaf.median} gf` : null, p.pressureIaf ? `median, tier ${p.pressureIaf.tier} (${tierWord('IAF', p.pressureIaf.tier)})` : ''],
				['MAX PRESSURE', p.pressureMax ? `${p.pressureMax.median} gf` : null, p.pressureMax ? `median, tier ${p.pressureMax.tier} (${tierWord('MAX', p.pressureMax.tier)})` : ''],
				['BUTTONS', p.buttons != null ? String(p.buttons) : null, p.eraser ? 'plus eraser' : ''],
				['WEIGHT', p.weight ? `${p.weight} g` : null, ''],
				['SIZE', p.length ? `${p.length} mm` : null, p.diameter ? `${p.diameter} mm across` : ''],
				['TECH', tech(p.tech), '']
			] as Tile[]
		).filter((x) => x[1])
	);
	const specs = $derived(
		(
			[
				['Model', p.modelId],
				['Pen family', p.family],
				['Released', p.year],
				['Technology', tech(p.tech)],
				['Pressure levels', p.pressure],
				['Tilt', yn(p.tilt)],
				['Buttons', p.buttons],
				['Eraser', yn(p.eraser)],
				['Wheel', yn(p.wheel)],
				['Barrel rotation', yn(p.rotation)],
				['Hover', yn(p.hover)],
				['Shape', p.shape?.toLowerCase()],
				['Weight', p.weight && `${p.weight} g`],
				['Length', p.length && `${p.length} mm`],
				['Diameter', p.diameter && `${p.diameter} mm`],
				['IAF', p.pressureIaf ? `${p.pressureIaf.median} gf median, ${p.pressureIaf.min}–${p.pressureIaf.max} gf range` : null],
				['Max pressure', p.pressureMax ? `${p.pressureMax.median} gf median, ${p.pressureMax.min}–${p.pressureMax.max} gf range` : null]
			] as [string, unknown][]
		).filter(([, v]) => v !== null && v !== undefined && v !== '') as [string, string][]
	);
	const title = $derived(p.name);
</script>

<svelte:head>
	<title>{title} ({p.modelId}) · Seven Pens recommendations</title>
	<meta name="description" content="{p.brandName} {p.name} pen: pressure measurements, and which tablets it is included with or compatible with." />
</svelte:head>

{#snippet tablets(list: TabletRef[])}
	<ul class="list">
		{#each list as t (t.id)}
			<li class="row tier-{tierClass(t.rating)}">
				<a href={tabletHref(base, t)}>{t.name}</a><span class="mono">{t.modelId}</span>
				{#if t.rating}<span class="tag">{t.rating}</span>{/if}
				<span class="sub">{TYPE_LABEL[t.type]}{t.year ? `, ${t.year}` : ''}{t.status === 'DISCONTINUED' ? ', discontinued' : ''}</span>
			</li>
		{/each}
	</ul>
{/snippet}

<div class="detail tier-{tierClass(rating)}">
	<Hero
		brand={p.brandName}
		kind="pen"
		{title}
		model={p.modelId.toLowerCase() !== p.name.toLowerCase() ? p.modelId : null}
		back={{ href: `${base}/#type=PEN`, label: 'back to pens' }}
		rating={p.rating ? p.rating.toLowerCase() : 'not rated'}
		badges={p.ratingBasis === 'SPECS_ONLY' ? ['rated on specs only'] : []}
		since={p.ratedSince ? `rated since ${monthYear(p.ratedSince, true)}` : null}
		links={[{ href: p.explorerUrl, label: 'every spec in the explorer' }]}
	/>

	<main class="content">
		{#if notes.length}
			<section aria-labelledby="p-know">
				<h2 id="p-know">things to know</h2>
				<div class="notes">
					{#each notes as n, k (k)}
						<div class="note {n.kind.toLowerCase()}"><span class="kind">{n.kind}</span>{n.text}</div>
					{/each}
				</div>
			</section>
		{/if}

		<section aria-labelledby="p-glance">
			<h2 id="p-glance">at a glance</h2>
			<div class="tiles">
				{#each glance as [k, v, hint] (k)}
					<div class="tile">
						<div class="k">{k}</div>
						<div class="v">{v}</div>
						{#if hint}<div class="hint">{hint}</div>{/if}
					</div>
				{/each}
			</div>
		</section>

		<section aria-labelledby="p-pressure">
			<h2 id="p-pressure">pressure</h2>
			<PressureSection pen={p} />
		</section>

		<section aria-labelledby="p-with">
			<h2 id="p-with">included with these tablets</h2>
			{#if p.includedWith.length}{@render tablets(p.includedWith)}{:else}<p class="dim">No tablet in DrawTabData lists this pen in the box.</p>{/if}
		</section>

		{#if p.worksWith.length}
			<section aria-labelledby="p-works">
				<h2 id="p-works">compatible with these tablets</h2>
				{@render tablets(p.worksWith)}
			</section>
		{/if}

		<section aria-labelledby="p-basics">
			<h2 id="p-basics">basics</h2>
			<dl class="specs">
				{#each specs as [k, v] (k)}
					<div><dt>{k}</dt><dd>{v}</dd></div>
				{/each}
			</dl>
		</section>

		<section aria-labelledby="p-hist">
			<h2 id="p-hist">rating history</h2>
			{#if history.length}
				<ol class="timeline">
					{#each history as h, k (k)}
						<li class="tier-{tierClass(h.rating === 'DELISTED' ? null : h.rating)}">
							<span class="dot" aria-hidden="true"></span>
							<span class="when">{longDate(h.date)}</span>
							<span class="what">{h.rating === 'DELISTED' ? 'taken off the list' : `rated ${h.rating.toLowerCase()}`}</span>
						</li>
					{/each}
				</ol>
			{:else}
				<p class="dim">Not rated yet.</p>
			{/if}
		</section>
	</main>
</div>
