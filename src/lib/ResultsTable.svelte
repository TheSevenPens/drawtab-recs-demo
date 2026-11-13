<script lang="ts">
	import { base } from '$app/paths';
	import { goto } from '$app/navigation';
	import { areaLabel, penLabel, deviceHref, TYPE_LABEL, diagOf, monthYear, money, priceOf, ratingWord, releaseTime, resolutionLabel, shortName, sizeLabel, tierClass, type Item } from './catalog';

	import { units } from './units.svelte';
	let { list, expert = false }: { list: Item[]; expert?: boolean } = $props();

	type Col = { key: string; label: string; simple: boolean; cell: (i: Item) => string; sort: (a: Item, b: Item) => number; big?: boolean };
	const yn = (v: boolean | null | undefined) => (v === true ? 'yes' : v === false ? 'no' : '—');
	const or = (v: unknown, unit = '') => (v === null || v === undefined || v === '' ? '—' : `${v}${unit}`);
	const COLS: Col[] = [
		{ key: 'type', label: 'TYPE', simple: true, cell: (i) => TYPE_LABEL[i.type], sort: (a, b) => a.type.localeCompare(b.type) },
		{ key: 'diag', label: 'SIZE', simple: true, big: true, cell: (i) => sizeLabel(i) || '—', sort: (a, b) => (diagOf(a) ?? 0) - (diagOf(b) ?? 0) },
		{ key: 'area', label: 'ACTIVE AREA', simple: false, cell: (i) => areaLabel(i.specs, units.value) ?? '—', sort: (a, b) => (a.specs.activeAreaCm2 ?? 0) - (b.specs.activeAreaCm2 ?? 0) },
		{ key: 'res', label: 'RESOLUTION', simple: true, cell: (i) => resolutionLabel(i.specs) ?? '—', sort: (a, b) => (a.specs.pixelsW ?? 0) - (b.specs.pixelsW ?? 0) },
		{ key: 'pen', label: 'PEN', simple: true, cell: (i) => (i.pen ? penLabel(i.pen) : '—'), sort: (a, b) => (a.pen?.name ?? '').localeCompare(b.pen?.name ?? '') },
		{ key: 'srgb', label: 'sRGB', simple: false, cell: (i) => or(i.specs.srgb, '%'), sort: (a, b) => (a.specs.srgb ?? 0) - (b.specs.srgb ?? 0) },
		{ key: 'weight', label: 'WEIGHT', simple: false, cell: (i) => or(i.specs.weight, ' g'), sort: (a, b) => (a.specs.weight ?? 1e9) - (b.specs.weight ?? 1e9) },
		{ key: 'tilt', label: 'TILT', simple: false, cell: (i) => (i.specs.tilt ? `±${i.specs.tilt}°` : '—'), sort: (a, b) => (a.specs.tilt ?? 0) - (b.specs.tilt ?? 0) },
		{ key: 'stand', label: 'STAND', simple: false, cell: (i) => (i.specs.includedStand ? 'in box' : i.specs.legs ? 'legs' : yn(i.specs.includedStand)), sort: () => 0 },
		{ key: 'wireless', label: 'WIRELESS', simple: false, cell: (i) => yn(i.specs.bluetooth), sort: () => 0 },
		{ key: 'iaf', label: 'PEN IAF', simple: false, big: true, cell: (i) => or(i.pen?.iaf, ' gf'), sort: (a, b) => (a.pen?.iaf ?? 1e9) - (b.pen?.iaf ?? 1e9) },
		{ key: 'released', label: 'RELEASED', simple: true, cell: (i) => monthYear(i.released) ?? or(i.year), sort: (a, b) => (releaseTime(a.released) || 0) - (releaseTime(b.released) || 0) },
		{ key: 'notes', label: 'NOTES', simple: false, cell: (i) => (i.notes.length ? `${i.notes.length}${i.notes.some((n) => n.kind === 'WARNING') ? ' ⚠' : ''}` : ''), sort: (a, b) => a.notes.length - b.notes.length },
		{ key: 'price', label: 'PRICE', simple: true, cell: (i) => (i.price?.current ? `${money(i.price.current.amount)} · ${monthYear(i.price.current.date)}` : i.price?.from ? `from ${money(i.price.from.amount)}` : '—'), sort: (a, b) => (priceOf(a) ?? 1e9) - (priceOf(b) ?? 1e9) }
	];
	const pf = (i: Item) => i.penFacts;
	const tiered = (v: number | null | undefined, t: string | null | undefined) => (v == null ? '—' : `${v} gf${t ? ` · ${t} tier` : ''}`);
	const PEN_COLS: Col[] = [
		{ key: 'p-iaf', label: 'IAF', simple: true, big: true, cell: (i) => tiered(pf(i)?.iaf, pf(i)?.iafTier), sort: (a, b) => (pf(a)?.iaf ?? 1e9) - (pf(b)?.iaf ?? 1e9) },
		{ key: 'p-max', label: 'MAX PRESSURE', simple: true, big: true, cell: (i) => tiered(pf(i)?.max, pf(i)?.maxTier), sort: (a, b) => (pf(a)?.max ?? -1) - (pf(b)?.max ?? -1) },
		{ key: 'p-levels', label: 'LEVELS', simple: false, cell: (i) => or(i.specs.pressure), sort: (a, b) => (a.specs.pressure ?? 0) - (b.specs.pressure ?? 0) },
		{ key: 'p-tilt', label: 'TILT', simple: false, cell: (i) => yn(pf(i)?.tilt), sort: () => 0 },
		{ key: 'p-weight', label: 'WEIGHT', simple: false, cell: (i) => or(i.specs.weight, ' g'), sort: (a, b) => (a.specs.weight ?? 1e9) - (b.specs.weight ?? 1e9) },
		{ key: 'p-incl', label: 'INCLUDED WITH', simple: true, cell: (i) => (pf(i)?.includedWith ? `${pf(i)!.includedWith} tablet${pf(i)!.includedWith === 1 ? '' : 's'}` : '—'), sort: (a, b) => (pf(a)?.includedWith ?? 0) - (pf(b)?.includedWith ?? 0) },
		COLS.find((c) => c.key === 'released')!
	];
	const isPen = $derived(list.length > 0 && list.every((i) => i.kind === 'pen'));
	const cols = $derived((isPen ? PEN_COLS : COLS).filter((c) => expert || c.simple));

	let sortKey: string | null = $state(null);
	let dir = $state(1);
	const allCols: Record<string, (a: Item, b: Item) => number> = {
		rating: (a, b) => a.ratingRank - b.ratingRank,
		device: (a, b) => a.name.localeCompare(b.name),
		...Object.fromEntries([...COLS, ...PEN_COLS].map((c) => [c.key, c.sort]))
	};
	const rows = $derived(sortKey ? [...list].sort((a, b) => dir * allCols[sortKey!](a, b)) : list);
	function sortBy(k: string) {
		if (sortKey === k) dir = -dir;
		else {
			sortKey = k;
			dir = 1;
		}
	}
	const arrow = (k: string) => (sortKey === k ? (dir > 0 ? ' ▲' : ' ▼') : '');
	const ariaSort = (k: string) => (sortKey === k ? (dir > 0 ? 'ascending' : 'descending') : 'none');
	const href = (i: Item) => deviceHref(base, i);
</script>

<div class="wrap">
	<table>
		<thead>
			<tr>
				<th aria-sort={ariaSort('rating')}><button onclick={() => sortBy('rating')}>RATING{arrow('rating')}</button></th>
				<th aria-sort={ariaSort('device')}><button onclick={() => sortBy('device')}>{isPen ? 'PEN' : 'DEVICE'}{arrow('device')}</button></th>
				{#each cols as c (c.key)}
					<th aria-sort={ariaSort(c.key)}><button onclick={() => sortBy(c.key)}>{c.label}{arrow(c.key)}</button></th>
				{/each}
			</tr>
		</thead>
		<tbody>
			{#each rows as i (i.id)}
				<tr class="tier-{tierClass(i.rating)}" onclick={(e) => !(e.target as HTMLElement).closest('a') && goto(href(i))}>
					<td class="band">{ratingWord(i)}</td>
					<td class="device">
						<div class="brand">{i.brandName}</div>
						<a href={href(i)} class="name">{shortName(i)}</a>
						{#if i.kind !== 'family' && i.modelId.toLowerCase() !== shortName(i).toLowerCase()}<div><span class="model">{i.modelId}</span></div>{/if}
					</td>
					{#each cols as c (c.key)}
						<td class:big={c.big}>{c.cell(i)}</td>
					{/each}
				</tr>
			{/each}
		</tbody>
	</table>
</div>

<style>
	.wrap {
		overflow-x: auto;
	}
	table {
		width: 100%;
		border-collapse: separate;
		border-spacing: 0 6px;
		font-size: 0.95rem;
	}
	th {
		text-align: left;
		padding: 0 0.85rem;
		white-space: nowrap;
	}
	th button {
		border: 0;
		background: none;
		padding: 0.5rem 0;
		font-size: 0.75rem;
		font-weight: 700;
		letter-spacing: 0.14em;
		color: var(--text-3);
		cursor: pointer;
	}
	tbody tr {
		background: var(--wash);
		cursor: pointer;
	}
	tbody tr:hover .name {
		text-decoration: underline;
	}
	td {
		padding: 0.8rem 0.85rem;
		vertical-align: middle;
		white-space: nowrap;
	}
	td.band {
		background: var(--band);
		color: #fff;
		width: 8.5rem;
		font-size: 0.75rem;
		font-weight: 700;
		letter-spacing: 0.14em;
		text-transform: uppercase;
	}
	.device {
		min-width: 13rem;
	}
	.brand {
		font-size: 0.75rem;
		font-weight: 800;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: var(--text-2);
	}
	.name {
		font-size: 1.05rem;
		font-weight: 600;
		color: var(--text);
		text-decoration: none;
	}
	.model {
		display: inline-block;
		margin-top: 0.25rem;
		padding: 0.1rem 0.45rem;
		background: var(--text);
		color: #fff;
		font: 500 0.8rem var(--mono);
	}
	td.big {
		font-size: 1.35rem;
		font-weight: 300;
		white-space: nowrap;
	}
</style>
