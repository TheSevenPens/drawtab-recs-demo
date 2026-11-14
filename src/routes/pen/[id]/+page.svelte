<script lang="ts">
	import { base } from '$app/paths';
	import '$lib/detail.css';
	import Hero from '$lib/Hero.svelte';
	import PressureSection from '$lib/PressureSection.svelte';
	import { PRESSURE_TITLE, TYPE_LABEL, longDate, monthYear, penHref, tabletHref, tierClass, type TabletRef } from '$lib/catalog';

	let { data } = $props();
	const p = $derived(data.pen);
	const yn = (v: boolean | null | undefined) => (v === true ? 'yes' : v === false ? 'no' : null);
	const tech = (t: string | null) => (t ? t.replace('_', ' ').toLowerCase().replace('emr', 'EMR') : null);
	const rating = $derived(p.rating);
	const notes = $derived([...(p.notes ?? [])].sort((a, b) => (a.kind === 'WARNING' ? -1 : 0) - (b.kind === 'WARNING' ? -1 : 0)));
	const history = $derived([...(p.history ?? [])].reverse());

	// [label, value, hint, small label after the value, tier badge]
	type Tile = [string, string | null, string, string?, string?];
	const pTile = (k: string, m: 'IAF' | 'MAX', r: typeof p.pressureIaf): Tile =>
		r
			? [k, `${r.median} gf`, r.units.length > 1 ? `range ${r.min} to ${r.max} gf` : 'one pen tested', 'median', r.tier ? `${r.tier} tier` : undefined]
			: [k, 'no data', ''];
	const glance = $derived(
		(
			[
				['PRESSURE', p.pressure ? `${p.pressure} levels` : null, ''],
				['TILT', yn(p.tilt), ''],
				pTile('IAF', 'IAF', p.pressureIaf),
				pTile('MAX PRESSURE', 'MAX', p.pressureMax),
				['BUTTONS', p.buttons != null ? String(p.buttons) : null, ''],
				['ERASER', p.eraser === true ? 'yes' : p.eraser === false ? 'no' : 'not recorded', ''],
				['WEIGHT', p.weight ? `${p.weight} g` : null, ''],
				['SIZE', p.length ? `${p.length} mm` : null, p.diameter ? `${p.diameter} mm diameter` : ''],
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
	// Other pens on the site in the same IAF / max-pressure tier, closest median first.
	const sameTier = (m: 'IAF' | 'MAX') => {
		const mine = m === 'IAF' ? p.pressureIaf : p.pressureMax;
		if (!mine?.tier) return [];
		return data.catalog.pens
			.filter((o) => o.id !== p.id)
			.map((o) => ({ pen: o, r: m === 'IAF' ? o.pressureIaf : o.pressureMax }))
			.filter((o) => o.r?.tier === mine.tier)
			.sort((a, b) => Math.abs(a.r!.median - mine.median) - Math.abs(b.r!.median - mine.median));
	};
	const peers = $derived(
		(
			[
				['IAF', p.pressureIaf?.tier, sameTier('IAF')],
				['MAX', p.pressureMax?.tier, sameTier('MAX')]
			] as const
		).filter(([, t]) => t)
	);
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
		links={[{ href: p.explorerUrl, label: 'open in Explorer' }]}
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
				{#each glance as [k, v, hint, sub, badge] (k)}
					<div class="tile" class:badged={badge}>
						<div class="k">{k}</div>
						<div class="v">{v}{#if sub}<span class="vsub">{sub}</span>{/if}</div>
						{#if hint}<div class="hint">{hint}</div>{/if}
						{#if badge}<span class="badge">{badge}</span>{/if}
					</div>
				{/each}
			</div>
		</section>

		<section aria-labelledby="p-pressure">
			<h2 id="p-pressure">pressure</h2>
			<PressureSection pen={p} />
		</section>

		{#if peers.length}
			<section aria-labelledby="p-peers">
				<h2 id="p-peers">pens in the same tier</h2>
				<div class="split">
					{#each peers as [m, t, list] (m)}
						<section aria-label="same {m === 'IAF' ? 'IAF' : 'max pressure'} tier">
							<h3 class="peerhead">{PRESSURE_TITLE[m]}: {t} tier</h3>
							{#if list.length}
								<ul class="list">
									{#each list as o (o.pen.id)}
										<li class="row tier-{tierClass(o.pen.rating)}">
											<a href={penHref(base, o.pen.id)}>{o.pen.brandName} {o.pen.name}</a>
											{#if o.pen.modelId.toLowerCase() !== o.pen.name.toLowerCase()}<span class="mono">{o.pen.modelId}</span>{/if}
											{#if o.pen.rating}<span class="tag">{o.pen.rating}</span>{/if}
											<span class="sub">{o.r?.median} gf median</span>
										</li>
									{/each}
								</ul>
							{:else}
								<p class="dim">No other pen on this site is in this tier.</p>
							{/if}
						</section>
					{/each}
				</div>
			</section>
		{/if}

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
