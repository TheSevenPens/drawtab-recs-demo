<script lang="ts">
	// One pen's IAF or max pressure: the tier bands as a track, each pen unit
	// Seven tested as a dot, the min–max range as a bar and the median marked.
	import { PRESSURE_BANDS, tierWord, type PressureMetric, type PressureRange } from './catalog';

	let { metric, data }: { metric: PressureMetric; data: PressureRange | null } = $props();

	const TITLE = { IAF: 'initial activation force', MAX: 'maximum pressure' };
	const HINT = {
		IAF: 'The force it takes to make the first mark. Lower is lighter.',
		MAX: 'The force at which the pen reaches full pressure. 500 to 900 gf is the sweet spot; much higher tires your hand.'
	};
	const DOMAIN = { IAF: 12, MAX: 1000 };
	const top = $derived(DOMAIN[metric]);
	const pct = (v: number) => `${(Math.min(Math.max(v, 0), top) / top) * 100}%`;
	const bands = $derived(PRESSURE_BANDS[metric]);
	const word = $derived(data ? tierWord(metric, data.tier) : null);
	const measured = $derived(data ? data.units.filter((u) => u.source === 'measured').length : 0);
	const fmt = (v: number) => `${v} gf`;
	// Stack dots that would overlap into rows, so every pen stays visible.
	const placed = $derived.by(() => {
		if (!data) return [];
		const last: number[] = [];
		return data.units.map((u) => {
			const x = (Math.min(Math.max(u.value, 0), top) / top) * 100;
			let row = last.findIndex((l) => x - l >= 2.2);
			if (row < 0) row = last.push(-Infinity) - 1;
			last[row] = x;
			return { ...u, row };
		});
	});
	const rows = $derived(Math.max(1, ...placed.map((u) => u.row + 1)));
	const ticks = $derived([...new Set(bands.flatMap((b) => [b.lo, b.hi ?? top]))].filter((t) => t <= top));
</script>

<div class="pr">
	<div class="head">
		<h3>{TITLE[metric]}{metric === 'IAF' ? ' (IAF)' : ''}</h3>
		{#if data?.tier}<span class="tier">tier {data.tier}{word ? ` · ${word}` : ''}</span>{/if}
	</div>
	<p class="hint">{HINT[metric]}</p>

	{#if data}
		<div class="big">{fmt(data.median)} <span>median</span></div>
		<div class="track" style:height="{40 + rows * 14}px" role="img" aria-label="{TITLE[metric]}: median {fmt(data.median)}, range {fmt(data.min)} to {fmt(data.max)} across {data.units.length} pens tested">
			{#each bands as b (b.tier)}
				<div class="band" class:on={b.tier === data.tier} style:left={pct(b.lo)} style:width="calc({pct(b.hi ?? top)} - {pct(b.lo)})">
					<span>{b.tier}</span>
				</div>
			{/each}
			{#if data.units.length > 1}
				<div class="range" style:left={pct(data.min)} style:width="calc({pct(data.max)} - {pct(data.min)})"></div>
			{/if}
			{#each placed as u (u.unit)}
				<div class="dot" class:est={u.source === 'estimated'} style:left={pct(u.value)} style:top="{30 + u.row * 14}px" title="{u.unit}: {fmt(u.value)} ({u.source})"></div>
			{/each}
			<div class="median" style:left={pct(data.median)}></div>
		</div>
		<div class="axis">
			{#each ticks as t (t)}<span style:left={pct(t)}>{t}{t === top && bands.at(-1)?.hi === null ? '+' : ''}</span>{/each}
		</div>
		<p class="sum">
			{#if data.units.length > 1}
				From {fmt(data.min)} to {fmt(data.max)} across the {data.units.length} pens Seven tested.
			{:else}
				One pen tested, so there's no range yet.
			{/if}
			{#if measured === data.units.length}
				All measured directly.
			{:else if measured === 0}
				Estimated from pressure-response curves.
			{:else}
				{measured} measured directly, {data.units.length - measured} estimated from pressure-response curves.
			{/if}
		</p>
	{:else}
		<p class="none">Not measured yet.</p>
	{/if}
</div>

<style>
	.pr {
		min-width: 0;
	}
	.head {
		display: flex;
		align-items: baseline;
		gap: 0.75rem;
		flex-wrap: wrap;
	}
	h3 {
		margin: 0;
		font-size: 1.35rem;
		font-weight: 400;
	}
	.tier {
		padding: 0.15rem 0.5rem;
		background: var(--band);
		color: #fff;
		font-size: 0.72rem;
		font-weight: 700;
		letter-spacing: 0.12em;
		text-transform: uppercase;
	}
	.hint {
		margin: 0.25rem 0 0.75rem;
		color: var(--text-3);
		font-size: 0.9rem;
	}
	.big {
		font-size: 2.4rem;
		font-weight: 300;
		letter-spacing: -0.02em;
		line-height: 1;
		margin-bottom: 0.75rem;
	}
	.big span {
		font-size: 0.85rem;
		font-weight: 600;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: var(--text-3);
	}
	.track {
		position: relative;
		height: 56px;
	}
	.band {
		position: absolute;
		top: 0;
		bottom: 0;
		border-left: 1px solid var(--bg);
	}
	.band::before {
		content: '';
		position: absolute;
		inset: 0;
		background: var(--sunk);
		opacity: 0.6;
	}
	.band:nth-child(even)::before {
		opacity: 0.9;
	}
	.band.on::before {
		background: var(--band);
		opacity: 0.25;
	}
	.band span {
		position: absolute;
		top: 4px;
		left: 6px;
		font-size: 0.72rem;
		font-weight: 800;
		color: var(--text);
	}
	.band span {
		z-index: 1;
	}
	.range {
		position: absolute;
		top: 33px;
		height: 6px;
		background: var(--text);
		opacity: 0.35;
	}
	.dot {
		position: absolute;
		top: 30px;
		width: 12px;
		height: 12px;
		margin-left: -6px;
		border-radius: 50%;
		background: var(--text);
		border: 2px solid var(--bg);
	}
	.dot.est {
		background: var(--bg);
		border-color: var(--text);
	}
	.median {
		position: absolute;
		top: -4px;
		bottom: -4px;
		width: 3px;
		margin-left: -1.5px;
		background: var(--band);
	}
	.axis {
		position: relative;
		height: 1.2rem;
		font: 0.75rem var(--mono);
		color: var(--text-3);
	}
	.axis span {
		position: absolute;
		top: 0.2rem;
		transform: translateX(-50%);
	}
	.axis span:first-child {
		transform: none;
	}
	.axis span:last-child {
		transform: translateX(-100%);
	}
	.sum,
	.none {
		margin: 0.6rem 0 0;
		color: var(--text-2);
		font-size: 0.9rem;
	}
</style>
