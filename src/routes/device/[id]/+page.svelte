<script lang="ts">
	import { base } from '$app/paths';
	import '$lib/detail.css';
	import Hero from '$lib/Hero.svelte';
	import UnitsSwitch from '$lib/UnitsSwitch.svelte';
	import PressureSummary from '$lib/PressureSummary.svelte';
	import PriceSection from '$lib/PriceSection.svelte';
	import { units } from '$lib/units.svelte';
	import {
		CONTEXT_LABEL,
		LIST_LABEL,
		shownLists,
		TYPE_LABEL,
		TYPE_PLURAL,
		areaLabel,
		familyHref,
		longDate,
		monthYear,
		money,
		priceWhere,
		penHref,
		penLabel,
		previousRating,
		resolutionLabel,
		shortName,
		sizeLabel,
		sortedNotes,
		tabletHref,
		tierClass,
		ratingWord,
		type LinkRef
	} from '$lib/catalog';

	let { data } = $props();
	const i = $derived(data.item);
	const s = $derived(i.specs);
	const pen = $derived(i.pen ? data.catalog.pens.find((p) => p.id === i.pen!.id) : null);
	const family = $derived(i.familyId ? data.catalog.families.find((f) => f.id === i.familyId) : null);
	const yn = (v: boolean | null | undefined) => (v === true ? 'yes' : v === false ? 'no' : null);
	const lb = (g: number) => `${(g / 453.6).toFixed(1)} lb`;
	const area = $derived(areaLabel(s, units.value));

	const ANTI_GLARE: Record<string, string> = { ETCHEDGLASS: 'etched glass', AGFILM: 'film' };

	// Tiles: the things a buyer compares first.
	type Tile = [string, string | null, string, string?];
	const glance = $derived(
		(
			[
				i.type === 'PENTABLET'
					? ['ACTIVE AREA', s.activeDiagIn ? `${s.activeDiagIn}″` : null, area ?? '']
					: ['ACTIVE AREA', s.activeDiagIn ? `${s.activeDiagIn}″` : null, area ?? ''],
				i.type !== 'PENTABLET' ? ['DISPLAY PANEL', s.resolution, [(s.pixelsW ?? 0) >= 3840 ? '4K' : null, s.laminated ? 'laminated' : null, s.panel].filter(Boolean).join(', ')] : null,
				i.type !== 'PENTABLET' ? ['ANTI-GLARE', ANTI_GLARE[s.antiGlare ?? ''] ?? null, ''] : null,
				i.type !== 'PENTABLET' ? ['COLOR', s.srgb ? `${s.srgb}% sRGB` : null, [s.adobeRgb && `${s.adobeRgb}% Adobe RGB`, s.dciP3 && `${s.dciP3}% DCI-P3`].filter(Boolean).join(', ')] : null,
				['PRICE', i.price?.current ? money(i.price.current.amount) : null, i.price?.current ? priceWhere(i.price.current) : '', '#d-price'],
				['WEIGHT', s.weight ? (s.weight >= 1000 ? `${(s.weight / 1000).toFixed(2).replace(/0$/, '')} kg` : `${s.weight} g`) : null, s.weight ? lb(s.weight) : ''],
				['PEN', i.pen ? penLabel(i.pen) : null, pen?.pressureIaf ? `IAF median ${pen.pressureIaf.median} gf` : '', i.pen ? penHref(base, i.pen.id) : undefined],
				['TILT', s.tilt ? `±${s.tilt}°` : s.tilt === 0 ? 'none' : null, ''],
				['PRESSURE', s.pressure ? `${s.pressure} levels` : null, ''],
				i.type === 'PENDISPLAY' ? ['STAND', s.includedStand ? 'included' : s.legs ? 'built-in legs' : s.includedStand === false ? 'not included' : null, s.vesa ? 'VESA mount' : ''] : null,
				i.type === 'PENTABLET' ? ['WIRELESS', yn(s.bluetooth), ''] : null,
				i.type === 'STANDALONE' ? ['RUNS', s.os, s.ram ? `${s.ram} GB RAM${s.storage ? `, ${s.storage} GB storage` : ''}` : ''] : null,
				['RELEASED', monthYear(i.released) ?? (i.year ? String(i.year) : null), i.family ?? '']
			].filter((x) => x && x[1]) as Tile[]
		)
	);

	const specs = $derived(
		(
			[
				['Model', i.modelId],
				['Family', i.family],
				['Type', TYPE_LABEL[i.type]],
				['Released', i.released],
				['Status', i.status?.toLowerCase()],
				['Active area', area && `${area}, ${s.activeAreaCm2} cm²`],
				['Active area diagonal', s.activeDiagIn && `${s.activeDiagIn}″`],
				['Physical size', s.physW && `${s.physW} × ${s.physH} × ${s.depth ?? '?'} mm`],
				['Weight', s.weight && `${s.weight} g (${lb(s.weight)})`],
				['Pressure levels', s.pressure],
				['Report rate', s.reportRate && `${s.reportRate} RPS`],
				['Max hover', s.hover && `${s.hover} mm`],
				['Digitizer', s.digitizer?.replace('_', ' ').toLowerCase().replace('emr', 'EMR')],
				['Panel', s.panel],
				['Anti-glare', s.antiGlare && ({ ETCHEDGLASS: 'etched glass', FILM: 'film', NONE: 'none' }[s.antiGlare] ?? s.antiGlare.toLowerCase())],
				['Brightness', s.brightness && `${s.brightness} nits`],
				['Refresh', s.refresh && `${s.refresh} Hz`],
				['Touch', yn(s.touch)],
				['Buttons / dials', s.buttons != null ? `${s.buttons} / ${s.dials ?? 0}` : null],
				['Bluetooth', yn(s.bluetooth)],
				['VESA', yn(s.vesa)],
				['Ports', s.ports.join(', ').replaceAll('_', '-') || null],
				['Battery', s.battery && `${s.battery} mAh`]
			] as [string, unknown][]
		).filter(([, v]) => v !== null && v !== undefined && v !== '' && v !== 0) as [string, string][]
	);
	const prev = $derived(previousRating(i));
	const history = $derived([...i.history].reverse());
	const notes = $derived(sortedNotes(i));
	const title = $derived(`${i.name}${i.kind !== 'family' ? ` (${i.modelId})` : ''}`);
	const desc = $derived(
		`${i.rating ? `Rated ${i.rating.toLowerCase()} by Seven Pens.` : ''} ${TYPE_LABEL[i.type]}${sizeLabel(i) ? `, ${sizeLabel(i)}` : ''}${resolutionLabel(s) ? `, ${resolutionLabel(s)}` : ''}${i.pen ? `, ${i.pen.name} pen` : ''}.`.trim()
	);
	const badges = $derived(
		[...shownLists(i).map((l) => LIST_LABEL[l] ?? l), i.status === 'DISCONTINUED' ? 'discontinued' : null, i.ratingBasis === 'SPECS_ONLY' ? 'rated on specs only' : null].filter(Boolean) as string[]
	);
	const links = $derived(
		[
			i.notesUrl ? { href: i.notesUrl, label: i.kind === 'family' ? 'read more' : "read Seven's notes", primary: true } : null,
			i.explorerUrl ? { href: i.explorerUrl, label: 'open in Explorer' } : null
		].filter(Boolean) as { href: string; label: string; primary?: boolean }[]
	);
	// Reviews by everyone, not just Seven: videos and written pieces apart,
	// then the maker's own pages.
	const linkLists = $derived(
		(
			[
				['d-vids', 'videos', i.videos ?? []],
				['d-read', 'written reviews', i.articles ?? []],
				['d-maker', `from ${i.brandName}`, i.makerLinks ?? []]
			] as [string, string, LinkRef[]][]
		).filter(([, , l]) => l.length)
	);
	// Other recommended tablets in the same DrawTabData family.
	const siblings = $derived(family ? family.members.filter((m) => m.id !== i.id) : []);
</script>

<svelte:head>
	<title>{title} · Seven Pens recommendations</title>
	<meta name="description" content={desc} />
	<meta property="og:title" content={title} />
	<meta property="og:description" content={desc} />
</svelte:head>

<div class="detail tier-{tierClass(i.rating)}">
	<Hero
		brand={i.brandName}
		kind={TYPE_LABEL[i.type] + (i.kind === 'family' ? ' · product family' : '')}
		title={shortName(i)}
		model={i.kind !== 'family' ? i.modelId : null}
		back={{ href: `${base}/#type=${i.type}`, label: `back to ${TYPE_PLURAL[i.type]}` }}
		context={family ? { href: familyHref(base, family.id), label: `part of the ${family.name}` } : null}
		rating={ratingWord(i)}
		{badges}
		since={i.ratedSince ? `rated since ${monthYear(i.ratedSince, true)}${prev ? `, was ${prev.toLowerCase()}` : ''}` : null}
		aka={i.aka.length ? `Also sold as ${i.aka.join(', ')}${i.akaNote ? `. ${i.akaNote}` : ''}` : null}
		{links}
	/>

	<main class="content">
		{#if notes.length}
			<section aria-labelledby="d-know">
				<h2 id="d-know">things to know</h2>
				<div class="notes">
					{#each notes as n, k (k)}
						<div class="note {n.kind.toLowerCase()}"><span class="kind">{n.kind}</span>{n.text}</div>
					{/each}
				</div>
			</section>
		{/if}

		{#if i.kind === 'family'}
			<section aria-labelledby="d-members">
				<h2 id="d-members">models in this family</h2>
				{#if i.members?.length}
					<ul class="list">
						{#each i.members as m (m.id)}
							<li class="row">
								<a href="https://thesevenpens.github.io/DrawTabDataExplorer/entity/{m.id}">{m.name}</a>
								<span class="sub">{m.year ?? ''}{m.status === 'DISCONTINUED' ? ' · discontinued' : ''}</span>
							</li>
						{/each}
					</ul>
				{:else}
					<p class="dim">None in DrawTabData yet.</p>
				{/if}
				<p class="dim">This is a recommendation for the product line, not a single model.</p>
			</section>
		{:else}
			<section aria-labelledby="d-glance">
				<div class="sechead">
					<h2 id="d-glance">at a glance</h2>
					<UnitsSwitch />
				</div>
				<div class="tiles">
					{#each glance as [k, v, hint, href] (k)}
						<div class="tile">
							<div class="k">{k}</div>
							<div class="v">{#if href}<a {href}>{v}</a>{:else}{v}{/if}</div>
							{#if hint}<div class="hint">{hint}</div>{/if}
						</div>
					{/each}
				</div>
			</section>

			<section aria-labelledby="d-price-h" id="d-price">
				<h2 id="d-price-h">price</h2>
				<PriceSection price={i.price} />
			</section>

			<div class="split">
				<section aria-labelledby="d-box">
					<h2 id="d-box">in the box</h2>
					{#if i.inBox?.length}
						<ul class="list box">
							{#each i.inBox as b, k (k)}<li>{b}</li>{/each}
						</ul>
					{:else}
						<p class="dim">Not recorded in DrawTabData yet.</p>
					{/if}
				</section>
				{#each linkLists as [lid, heading, list] (lid)}
					<section aria-labelledby={lid}>
						<h2 id={lid}>{heading}</h2>
						<ul class="list">
							{#each list as v (v.url)}
								<li class="row"><a href={v.url}>{v.title}</a><span class="sub">{[v.author, v.date ? longDate(v.date) : null].filter(Boolean).join(', ')}</span></li>
							{/each}
						</ul>
					</section>
				{/each}
			</div>

			<section aria-labelledby="d-pressure">
				<h2 id="d-pressure">pressure</h2>
				{#if pen}
					<p class="lede">
						Pressure behavior is determined by the pen, not the tablet. This tablet comes with the
						<a href={penHref(base, pen.id)}>{penLabel(pen)}</a>{#if pen.pressure}, {pen.pressure} levels{/if}{#if pen.tilt}, with tilt{/if}{#if pen.buttons != null}, {pen.buttons} button{pen.buttons === 1 ? '' : 's'}{/if}{#if pen.eraser}, eraser{/if}.
					</p>
					<PressureSummary {pen} />
				{:else}
					<p class="dim">No pen recorded for this tablet in DrawTabData yet.</p>
				{/if}
			</section>

			<section aria-labelledby="d-basics">
				<h2 id="d-basics">basics</h2>
				<dl class="specs">
					{#each specs as [k, v] (k)}
						<div><dt>{k}</dt><dd>{v}</dd></div>
					{/each}
					{#if pen}
						<div><dt>Pen</dt><dd><a href={penHref(base, pen.id)}>{penLabel(pen)}</a></dd></div>
					{/if}
					{#if family}
						<div><dt>Family page</dt><dd><a href={familyHref(base, family.id)}>{family.name}</a></dd></div>
					{/if}
				</dl>
			</section>

			{#if siblings.length}
				<section aria-labelledby="d-sib">
					<h2 id="d-sib">others in the {family?.name}</h2>
					<ul class="list">
						{#each siblings as m (m.id)}
							<li class="row tier-{tierClass(m.rating)}">
								<a href={tabletHref(base, m)}>{m.name}</a><span class="mono">{m.modelId}</span>
								{#if m.rating}<span class="tag">{m.rating}</span>{/if}
								<span class="sub">{m.year ?? ''}</span>
							</li>
						{/each}
					</ul>
				</section>
			{/if}

			<section aria-labelledby="d-hist">
				<h2 id="d-hist">rating history</h2>
				{#if history.length}
					<ol class="timeline">
						{#each history as h, k (k)}
							<li class="tier-{tierClass(h.rating === 'DELISTED' ? null : h.rating)}">
								<span class="dot" aria-hidden="true"></span>
								<span class="when">{longDate(h.date)}</span>
								<span class="what">{h.rating === 'DELISTED' ? 'taken off the list' : `rated ${h.rating.toLowerCase()}`}</span>
								{#if h.context}<span class="where">on the {CONTEXT_LABEL[h.context] ?? h.context}</span>{/if}
							</li>
						{/each}
					</ol>
				{:else}
					<p class="dim">Not rated yet.</p>
				{/if}
			</section>
		{/if}
	</main>
</div>
