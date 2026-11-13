<script lang="ts">
	import { onMount } from 'svelte';
	import { base } from '$app/paths';
	import Card from '$lib/Card.svelte';
	import ResultsTable from '$lib/ResultsTable.svelte';
	import UnitsSwitch from '$lib/UnitsSwitch.svelte';
	import {
		FEATURES,
		NOT_RATED,
		RECENT,
		SORTS,
		TYPES,
		TYPE_PLURAL,
		CONTEXT_LABEL,
		PRICE_BANDS,
		PRICE_DISCLAIMER,
		inPriceBand,
		priceOf,
		defaultFilters,
		filtersFromHash,
		filtersToHash,
		matches,
		ratingKey,
		recentCutoff,
		releaseTime,
		sizeChoices,
		tierClass,
		type DeviceType,
		type Filters,
		type Item
	} from '$lib/catalog';

	let { data } = $props();
	const catalog = $derived(data.catalog);
	const items = $derived(catalog.items);

	let f: Filters = $state(defaultFilters());
	let ready = $state(false);
	let open: 'brand' | 'rating' | 'released' | 'price' | 'more' | null = $state(null);
	const toggleOpen = (k: 'brand' | 'rating' | 'released' | 'price' | 'more') => (open = open === k ? null : k);

	onMount(() => {
		f = filtersFromHash(location.hash);
		ready = true;
		const onHash = () => (f = filtersFromHash(location.hash));
		addEventListener('hashchange', onHash);
		return () => removeEventListener('hashchange', onHash);
	});
	// Keep the URL in step with the filters, so any view is a shareable link.
	$effect(() => {
		const h = filtersToHash(f);
		if (ready && h !== location.hash) history.replaceState(history.state, '', h || location.pathname);
	});

	const list = $derived(items.filter((i) => matches(i, f)).sort((SORTS[f.sort] ?? SORTS.rating)[1]));
	const groups = $derived.by(() => {
		const g = new Map<string, Item[]>();
		for (const i of list) {
			const k = ratingKey(i);
			if (!g.has(k)) g.set(k, []);
			g.get(k)!.push(i);
		}
		return [...g];
	});

	// Facet counts leave their own facet out, so each count says what you'd get by picking it.
	const count = (skip: string, pred: (i: Item) => boolean) => items.filter((i) => matches(i, f, skip) && pred(i)).length;
	const inType = $derived(items.filter((i) => i.type === f.type).length);
	const sorts = $derived(Object.entries(SORTS).filter(([k]) => f.type !== 'PEN' || !/^(size|weight|price)/.test(k)));
	const ratings = $derived([...catalog.ratingScale, NOT_RATED].filter((r) => items.some((i) => ratingKey(i) === r)));
	const brands = $derived(
		[...new Map(items.map((i) => [i.brand, i.brandName])).entries()].sort((a, b) => a[1].localeCompare(b[1]))
	);
	const sizes = $derived(sizeChoices(f.type));
	const brandName = $derived(Object.fromEntries(brands));
	const moreCount = $derived([f.diagMin !== '' && !sizes.some(([, a, b]) => sizeOn(a, b)), f.widthMin !== '', f.weightMax !== '', f.feats.size > 0, f.hideDisc, f.hideAvoid].filter(Boolean).length);
	const maxWeight = $derived(Math.ceil(Math.max(...items.map((i) => i.specs.weight ?? 0)) / 100) * 100);

	const sizeOn = (a: number | null, b: number | null) => f.diagMin === (a === null ? '' : String(a)) && f.diagMax === (b === null ? '' : String(b));
	function setSize(a: number | null, b: number | null) {
		if (sizeOn(a, b)) {
			f.diagMin = '';
			f.diagMax = '';
		} else {
			f.diagMin = a === null ? '' : String(a);
			f.diagMax = b === null ? '' : String(b);
		}
	}
	const bandOn = (a: number | null, b: number | null) => f.priceMin === (a === null ? '' : String(a)) && f.priceMax === (b === null ? '' : String(b));
	const priceOn = $derived(f.priceMin !== '' || f.priceMax !== '');
	function setBand(a: number | null, b: number | null) {
		const off = bandOn(a, b);
		f.priceMin = off || a === null ? '' : String(a);
		f.priceMax = off || b === null ? '' : String(b);
	}
	function toggle(set: Set<string>, v: string): Set<string> {
		const n = new Set(set);
		if (n.has(v)) n.delete(v);
		else n.add(v);
		return n;
	}
	function setType(t: DeviceType | '') {
		// Size words mean different inches per type, so a type change clears the size.
		if (t !== f.type) {
			f.diagMin = '';
			f.diagMax = '';
		}
		f.type = t;
	}
	const reset = () => (f = { ...defaultFilters(), mode: f.mode, view: f.view });
	const anyFilter = $derived(filtersToHash({ ...f, mode: 'simple', view: 'cards', sort: 'rating' }) !== '');

	let copied = $state('');
	async function copyLink() {
		try {
			await navigator.clipboard.writeText(location.href);
			copied = 'copied';
		} catch {
			copied = 'copy failed';
		}
		setTimeout(() => (copied = ''), 1500);
	}
	const heading = (g: string) => (g === NOT_RATED ? 'general purpose & unrated' : g.toLowerCase());
</script>

<svelte:window onclick={(e) => open && !(e.target as HTMLElement).closest('.bar-wrap') && (open = null)} onkeydown={(e) => e.key === 'Escape' && (open = null)} />

<svelte:head>
	<title>Drawing tablet recommendations · Seven Pens</title>
	<meta name="description" content="Seven Pens' recommendations for pen tablets, pen displays, standalone devices and pens, with specs. Filter by size, brand, rating and release date." />
</svelte:head>

<div class="page">
	<header class="head">
		<div class="title">
			<h1>recommendations</h1>
		</div>
		<div class="tools">
			<label class="search">
				<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="11" cy="11" r="7"></circle><path d="M20 20l-3.5-3.5"></path></svg>
				<span class="sr-only">Search</span>
				<input type="search" placeholder={f.type === 'PEN' ? 'Pro Pen 3, PW600, X3 Pro…' : 'Kamvas 16, DTK-168, Intuos…'} bind:value={f.q} />
			</label>
			<div class="seg" role="group" aria-label="Detail level">
				<button aria-pressed={f.mode === 'simple'} onclick={() => (f.mode = 'simple')}>simple</button>
				<button aria-pressed={f.mode === 'expert'} onclick={() => (f.mode = 'expert')}>expert</button>
			</div>
			<div class="seg" role="group" aria-label="View">
				<button aria-pressed={f.view === 'cards'} onclick={() => (f.view = 'cards')}>cards</button>
				<button aria-pressed={f.view === 'table'} onclick={() => (f.view = 'table')}>table</button>
			</div>
		</div>
	</header>

	<nav class="pivot" aria-label="Category">
		{#each TYPES as t (t)}
			<button aria-pressed={f.type === t} onclick={() => setType(t)}>{TYPE_PLURAL[t]}</button>
		{/each}
	</nav>

	<div class="bar-wrap">
		<section class="bar" aria-label="Filters">
			{#if sizes.length}
				<div class="chips sizes" role="group" aria-label="Size">
					{#each sizes as [l, a, b] (l)}
						<button class="chip" aria-pressed={sizeOn(a, b)} onclick={() => setSize(a, b)}>{l}</button>
					{/each}
				</div>
				<span class="sep" aria-hidden="true"></span>
			{/if}
			<button class="drop" aria-expanded={open === 'brand'} class:on={f.brands.size} onclick={() => toggleOpen('brand')}>
				{f.brands.size ? `brand: ${[...f.brands].map((b) => brandName[b] ?? b).join(', ')}` : 'brand'} <span class="caret" aria-hidden="true">▾</span>
			</button>
			<button class="drop" aria-expanded={open === 'rating'} class:on={f.ratings.size} onclick={() => toggleOpen('rating')}>
				{f.ratings.size ? `rating: ${[...f.ratings].map((r) => r.toLowerCase()).join(', ')}` : 'rating'} <span class="caret" aria-hidden="true">▾</span>
			</button>
			<button class="drop" aria-expanded={open === 'released'} class:on={f.recent} onclick={() => toggleOpen('released')}>
				{f.recent ? RECENT.find(([y]) => y === f.recent)?.[1] : 'released'} <span class="caret" aria-hidden="true">▾</span>
			</button>
			{#if f.type !== 'PEN'}
				<button class="drop" aria-expanded={open === 'price'} class:on={priceOn} onclick={() => toggleOpen('price')}>
					{priceOn ? PRICE_BANDS.find(([, a, b]) => bandOn(a, b))?.[0] ?? 'price' : 'price'} <span class="caret" aria-hidden="true">▾</span>
				</button>
			{/if}
			{#if f.mode === 'expert' && f.type !== 'PEN'}
				<button class="drop" aria-expanded={open === 'more'} class:on={moreCount} onclick={() => toggleOpen('more')}>
					{moreCount ? `more · ${moreCount}` : 'more'} <span class="caret" aria-hidden="true">▾</span>
				</button>
			{/if}
			<span class="push"></span>
			{#if f.type !== 'PEN'}<UnitsSwitch />{/if}
			<label class="sortlbl">sort
				<select bind:value={f.sort}>
					{#each sorts as [k, [l]] (k)}<option value={k}>{l}</option>{/each}
				</select>
			</label>
			<span class="total"><strong>{list.length}</strong>&nbsp;of {inType}</span>
			{#if anyFilter}<button class="textbtn" onclick={reset}>clear</button>{/if}
		</section>

		{#if open}
			<div class="panel" role="group" aria-label="{open} filter">
				{#if open === 'brand'}
					<div class="chips">
						{#each brands as [code, name] (code)}
							{@const n = count('brands', (i) => i.brand === code)}
							{#if n || f.brands.has(code)}
								<button class="chip" aria-pressed={f.brands.has(code)} onclick={() => (f.brands = toggle(f.brands, code))}>{name}<span class="n">{n}</span></button>
							{/if}
						{/each}
					</div>
				{:else if open === 'rating'}
					<div class="chips">
						{#each ratings as r (r)}
							<button class="chip" aria-pressed={f.ratings.has(r)} onclick={() => (f.ratings = toggle(f.ratings, r))}>{r.toLowerCase()}<span class="n">{count('ratings', (i) => ratingKey(i) === r)}</span></button>
						{/each}
					</div>
				{:else if open === 'released'}
					<div class="chips">
						{#each RECENT as [y, l] (y)}
							<button class="chip" aria-pressed={f.recent === y} onclick={() => (f.recent = y)}>{l}<span class="n">{count('recent', (i) => !y || releaseTime(i.released) >= recentCutoff(y))}</span></button>
						{/each}
					</div>
				{:else if open === 'price'}
					<div class="chips">
						{#each PRICE_BANDS as [l, a, b] (l)}
							<button class="chip" aria-pressed={bandOn(a, b)} onclick={() => setBand(a, b)}>{l}<span class="n">{count('price', (i) => inPriceBand(priceOf(i), a, b))}</span></button>
						{/each}
					</div>
					<p class="pnote">{PRICE_DISCLAIMER}</p>
				{:else if open === 'more'}
					<div class="more">
						<div class="group">
							<div class="label">DIAGONAL (INCHES)</div>
							<div class="range">
								<input type="number" step="0.5" min="0" placeholder="min" aria-label="Minimum diagonal" bind:value={f.diagMin} />
								<span>to</span>
								<input type="number" step="0.5" min="0" placeholder="max" aria-label="Maximum diagonal" bind:value={f.diagMax} />
							</div>
						</div>
						<div class="group">
							<label class="label" for="wmin">WIDTH AT LEAST (MM)</label>
							<input id="wmin" type="number" step="10" min="0" placeholder="e.g. 250" bind:value={f.widthMin} />
						</div>
						<div class="group">
							<label class="label" for="wmax">WEIGHT AT MOST · {f.weightMax ? `${f.weightMax} g (${(+f.weightMax / 453.6).toFixed(1)} lb)` : 'any'}</label>
							<input
								id="wmax"
								type="range"
								min="200"
								max={maxWeight}
								step="100"
								value={f.weightMax || maxWeight}
								oninput={(e) => (f.weightMax = e.currentTarget.value === String(maxWeight) ? '' : e.currentTarget.value)}
							/>
						</div>
						<div class="group">
							<div class="label">FEATURES</div>
							<div class="chips">
								{#each FEATURES as [k, l] (k)}
									<button class="chip" aria-pressed={f.feats.has(k)} onclick={() => (f.feats = toggle(f.feats, k))}>{l}</button>
								{/each}
								<button class="chip" aria-pressed={f.hideDisc} onclick={() => (f.hideDisc = !f.hideDisc)}>hide discontinued</button>
								<button class="chip" aria-pressed={f.hideAvoid} onclick={() => (f.hideAvoid = !f.hideAvoid)}>hide "avoid"</button>
							</div>
						</div>
					</div>
				{/if}
				<button class="textbtn done" onclick={() => (open = null)}>done</button>
			</div>
		{/if}
	</div>

	{#if !list.length}
		<p class="empty">Nothing matches these filters. Try another size or clear a filter.</p>
	{:else if f.view === 'table'}
		<ResultsTable {list} expert={f.mode === 'expert'} />
	{:else if f.sort === 'rating'}
		{#each groups as [g, members] (g)}
			<section class="tier tier-{tierClass(g === NOT_RATED ? null : g)}" aria-labelledby="t-{tierClass(g)}">
				<div class="tier-head">
					<h2 id="t-{tierClass(g)}">{heading(g)}</h2>
					<span class="count" aria-label="{members.length} devices">{members.length}</span>
				</div>
				<div class="grid">
					{#each members as i (i.id)}<Card item={i} expert={f.mode === 'expert'} />{/each}
				</div>
			</section>
		{/each}
	{:else}
		<div class="grid">
			{#each list as i (i.id)}<Card item={i} expert={f.mode === 'expert'} />{/each}
		</div>
	{/if}

	<footer class="foot">
		<p>
			Ratings by Seven Pens. Specs from <a href="https://github.com/TheSevenPens/DrawTabData">DrawTabData</a>{catalog.source.drawTabDataCommit ? ` @ ${catalog.source.drawTabDataCommit}` : ''},
			built {catalog.builtAt.slice(0, 10)}. IAF is initial activation force, measured by Seven.
		</p>
		<p>{PRICE_DISCLAIMER}</p>
		{#if catalog.issues.length + catalog.notCovered.length}
			<details>
				<summary>Data gaps found while building this ({catalog.issues.length + catalog.notCovered.length})</summary>
				<ul>
					{#each catalog.issues as x, k (k)}<li>{CONTEXT_LABEL[x.page] ?? x.page}: {x.label}. {x.issue}</li>{/each}
					{#each catalog.notCovered as x, k (k)}<li>{x.page}: {x.label}. {x.why}</li>{/each}
				</ul>
			</details>
		{/if}
		<p><button class="textbtn" onclick={copyLink}>{copied || 'copy a link to this exact view'}</button></p>
	</footer>
</div>

<style>
	.page {
		max-width: 1440px;
		margin: 0 auto;
		padding: 1.25rem 2rem 5rem;
		display: flex;
		flex-direction: column;
		gap: 0.9rem;
		position: relative;
	}
	.head {
		display: flex;
		flex-wrap: wrap;
		justify-content: space-between;
		align-items: center;
		gap: 0.75rem 1.25rem;
	}
	.title {
		display: flex;
		align-items: baseline;
		gap: 0.9rem;
	}
	h1 {
		margin: 0;
		font-size: clamp(1.9rem, 3vw, 2.5rem);
		font-weight: 300;
		letter-spacing: -0.035em;
		line-height: 1.1;
	}
	.tools {
		display: flex;
		gap: 0.6rem;
		align-items: center;
		flex-wrap: wrap;
	}
	.search {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		height: 38px;
		padding: 0 0.8rem;
		background: var(--surface);
		border: 1px solid var(--line);
		color: var(--text-3);
		box-sizing: border-box;
	}
	.search input {
		background: transparent;
		border: 0;
		outline: none;
		width: 13rem;
		max-width: 50vw;
		color: var(--text);
		font-size: 0.9rem;
	}
	.seg {
		display: flex;
	}
	.seg button {
		height: 38px;
		padding: 0 0.9rem;
		border: 1px solid var(--line);
		background: var(--surface);
		color: var(--text-2);
		cursor: pointer;
		font-size: 0.9rem;
	}
	.seg button + button {
		border-left: 0;
	}
	.seg button[aria-pressed='true'] {
		background: var(--text);
		border-color: var(--text);
		color: #fff;
		font-weight: 600;
	}

	.pivot {
		display: flex;
		flex-wrap: wrap;
		gap: 0 1.75rem;
		align-items: baseline;
	}
	.pivot button {
		border: 0;
		background: none;
		padding: 0;
		font-size: clamp(1.4rem, 2.2vw, 1.9rem);
		font-weight: 300;
		letter-spacing: -0.02em;
		color: var(--text-4);
		cursor: pointer;
	}
	.pivot button:hover {
		color: var(--text-2);
	}
	.pivot button[aria-pressed='true'] {
		color: var(--text);
		font-weight: 400;
	}

	/* Slim filter bar that stays in reach while scrolling. */
	.bar-wrap {
		position: sticky;
		top: 0;
		z-index: 5;
		margin: 0 -2rem;
		padding: 0 2rem;
		background: rgba(238, 234, 228, 0.88);
		backdrop-filter: blur(10px);
		-webkit-backdrop-filter: blur(10px);
		border-top: 1px solid var(--line);
		border-bottom: 1px solid var(--line);
	}
	.bar {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.5rem 0.6rem;
		padding: 0.55rem 0;
	}
	.sep {
		width: 1px;
		height: 22px;
		background: var(--line);
		margin: 0 0.2rem;
	}
	.chips {
		display: flex;
		gap: 0.4rem;
		flex-wrap: wrap;
	}
	.chip,
	.drop {
		height: 32px;
		padding: 0 0.7rem;
		border: 1px solid var(--line-strong);
		background: var(--surface);
		color: var(--text);
		cursor: pointer;
		font-size: 0.85rem;
		white-space: nowrap;
	}
	.drop {
		max-width: 22rem;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.drop .caret {
		font-size: 0.7em;
		margin-left: 0.2em;
		color: var(--text-3);
	}
	.drop[aria-expanded='true'] {
		border-color: var(--text);
	}
	.drop.on {
		border-color: transparent;
		background: var(--chip-on);
		color: #fff;
		font-weight: 600;
	}
	.drop.on .caret {
		color: #fff;
	}
	.chip .n {
		margin-left: 0.35em;
		color: var(--text-4);
		font-size: 0.85em;
	}
	.chip[aria-pressed='true'] {
		border-color: transparent;
		background: var(--chip-on);
		color: #fff;
		font-weight: 600;
	}
	.chip[aria-pressed='true'] .n {
		color: rgba(255, 255, 255, 0.85);
	}
	.push {
		margin-left: auto;
	}
	.sortlbl {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		font-size: 0.85rem;
		color: var(--text-3);
	}
	select {
		height: 32px;
		padding: 0 0.4rem;
		border: 1px solid var(--line-strong);
		background: var(--surface);
		font-size: 0.85rem;
	}
	.total {
		font-size: 0.9rem;
		color: var(--text-3);
		white-space: nowrap;
	}
	.total strong {
		color: var(--text);
	}
	.panel {
		display: flex;
		align-items: flex-start;
		gap: 1rem;
		padding: 0.25rem 0 0.75rem;
	}
	.panel > .chips,
	.panel > .more {
		flex: 1;
	}
	.more {
		display: flex;
		flex-wrap: wrap;
		gap: 1rem 2rem;
	}
	.group {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
	}
	.label {
		font-size: 0.72rem;
		font-weight: 700;
		letter-spacing: 0.14em;
		color: var(--text-3);
	}
	.range {
		display: flex;
		gap: 0.4rem;
		align-items: center;
	}
	.range input,
	#wmin {
		height: 32px;
		width: 5.5rem;
		padding: 0 0.5rem;
		border: 1px solid var(--line-strong);
		background: var(--surface);
		box-sizing: border-box;
	}
	.textbtn {
		border: 0;
		background: none;
		padding: 0;
		color: var(--link);
		cursor: pointer;
		text-decoration: underline;
		text-underline-offset: 3px;
		font-size: 0.85rem;
	}
	.done {
		margin-top: 0.4rem;
	}
	.pnote {
		margin: 0.6rem 0 0;
		max-width: 46rem;
		font-size: 0.85rem;
		color: var(--text-3);
	}
	.empty {
		font-size: 1.25rem;
		color: var(--text-3);
	}

	.tier {
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
		margin-top: 0.4rem;
	}
	.tier-head {
		display: flex;
		align-items: center;
		gap: 1rem;
	}
	.tier h2 {
		margin: 0;
		font-size: clamp(1.9rem, 3vw, 2.6rem);
		font-weight: 300;
		letter-spacing: -0.03em;
		line-height: 1.2;
		padding-bottom: 0.1em;
		background: var(--head);
		-webkit-background-clip: text;
		background-clip: text;
		color: transparent;
	}
	.count {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: 1.8rem;
		height: 1.8rem;
		padding: 0 0.5rem;
		box-sizing: border-box;
		background: var(--sunk);
		color: var(--text-2);
		font-size: 0.95rem;
		font-weight: 600;
	}
	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(min(290px, 100%), 1fr));
		gap: 1rem;
	}

	.foot {
		margin-top: 2rem;
		padding-top: 1.25rem;
		border-top: 1px solid var(--line);
		color: var(--text-3);
		font-size: 0.85rem;
		line-height: 1.5;
	}
	.foot p {
		margin: 0 0 0.5rem;
	}

	@media (max-width: 700px) {
		.page {
			padding: 1rem 1rem 5rem;
		}
		.bar-wrap {
			margin: 0 -1rem;
			padding: 0 1rem;
		}
		.search {
			flex: 1 1 100%;
		}
		.search input {
			width: 100%;
			max-width: none;
		}
		.push {
			display: none;
		}
	}
</style>
