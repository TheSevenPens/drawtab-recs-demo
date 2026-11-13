<script lang="ts">
	// One pen's IAF or max pressure: the pens Seven tested as dots over a thin
	// tier strip, with the median marked and labelled.
	import { PRESSURE_BANDS, PRESSURE_DEF, PRESSURE_TITLE, tierWord, type PressureMetric, type PressureRange } from './catalog';

	let { metric, data }: { metric: PressureMetric; data: PressureRange | null } = $props();

	const DOMAIN = { IAF: 12, MAX: 1000 };
	const top = $derived(DOMAIN[metric]);
	const x = (v: number) => (Math.min(Math.max(v, 0), top) / top) * 100;
	const pct = (v: number) => `${x(v)}%`;
	const bands = $derived(PRESSURE_BANDS[metric]);
	const word = $derived(data ? tierWord(metric, data.tier) : null);
	const fmt = (v: number) => `${v} gf`;

	// Stack dots that would overlap, so every pen stays visible.
	const DOT = 10;
	const placed = $derived.by(() => {
		if (!data) return [];
		const last: number[] = [];
		return data.units.map((u) => {
			const px = x(u.value);
			let row = last.findIndex((l) => px - l >= 1.9);
			if (row < 0) row = last.push(-Infinity) - 1;
			last[row] = px;
			return { ...u, row };
		});
	});
	const rows = $derived(Math.max(1, ...placed.map((u) => u.row + 1)));
	const plotH = $derived(rows * (DOT + 2) + 26);
</script>

<div class="pr">
	<div class="head">
		<h3>{PRESSURE_TITLE[metric]}</h3>
		{#if data?.tier}<span class="tier">tier {data.tier}{word ? ` · ${word}` : ''}</span>{/if}
	</div>
	<p class="def">{PRESSURE_DEF[metric]}</p>

	{#if data}
		<div class="big">{data.median}<span class="unit">gf</span><span class="lbl">median</span></div>

		<div class="chart" role="img" aria-label="{PRESSURE_TITLE[metric]}: median {fmt(data.median)}, from {fmt(data.min)} to {fmt(data.max)} across {data.units.length} pens">
			<div class="plot" style:height="{plotH}px">
				{#if data.units.length > 1}
					<div class="range" style:left={pct(data.min)} style:width="calc({pct(data.max)} - {pct(data.min)})"></div>
				{/if}
				{#each placed as u (u.unit)}
					<div class="dot" style:left={pct(u.value)} style:bottom="{8 + u.row * (DOT + 2)}px" title={fmt(u.value)}></div>
				{/each}
				<div class="median" style:left={pct(data.median)}><span>{data.median}</span></div>
			</div>
			<div class="strip">
				{#each bands as b (b.tier)}
					<div class="seg" class:on={b.tier === data.tier} style:left={pct(b.lo)} style:width="calc({pct(b.hi ?? top)} - {pct(b.lo)})">
						<span class="letter">{b.tier}</span>
					</div>
				{/each}
			</div>
			<div class="axis">
				{#each bands as b, k (b.tier)}
					{#if k > 0}<span class="tick" style:left={pct(b.lo)}>{b.lo}</span>{/if}
				{/each}
				<span class="tick end">gf</span>
			</div>
		</div>

		<p class="sum">
			{#if data.units.length > 1}
				{fmt(data.min)} to {fmt(data.max)} across {data.units.length} pens tested.
			{:else}
				One pen tested.
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
		align-items: center;
		gap: 0.75rem;
		flex-wrap: wrap;
	}
	h3 {
		margin: 0;
		font-size: 1.3rem;
		font-weight: 400;
		letter-spacing: -0.01em;
	}
	.tier {
		padding: 0.2rem 0.55rem;
		background: var(--band);
		color: #fff;
		font-size: 0.7rem;
		font-weight: 700;
		letter-spacing: 0.14em;
		text-transform: uppercase;
	}
	.def {
		margin: 0.3rem 0 0.9rem;
		color: var(--text-3);
		font-size: 0.9rem;
		max-width: 34rem;
	}
	.big {
		font-size: 2.6rem;
		font-weight: 200;
		letter-spacing: -0.03em;
		line-height: 1;
	}
	.unit {
		margin-left: 0.2rem;
		font-size: 1.1rem;
		font-weight: 400;
		letter-spacing: 0;
		color: var(--text-2);
	}
	.lbl {
		margin-left: 0.6rem;
		font-size: 0.7rem;
		font-weight: 700;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: var(--text-3);
	}
	.chart {
		margin-top: 0.4rem;
		padding: 0 0.25rem;
	}
	.plot {
		position: relative;
	}
	.range {
		position: absolute;
		bottom: 12px;
		height: 2px;
		background: var(--text);
		opacity: 0.18;
	}
	.dot {
		position: absolute;
		width: 10px;
		height: 10px;
		margin-left: -5px;
		border-radius: 50%;
		background: var(--text);
		opacity: 0.55;
	}
	.median {
		position: absolute;
		top: 0;
		bottom: -4px;
		width: 2px;
		margin-left: -1px;
		background: var(--band);
	}
	.median span {
		position: absolute;
		top: -2px;
		left: 6px;
		font: 600 0.75rem var(--mono);
		color: var(--text);
		white-space: nowrap;
	}
	.strip {
		position: relative;
		height: 6px;
	}
	.seg {
		position: absolute;
		top: 0;
		height: 6px;
		background: var(--line);
		border-right: 2px solid var(--bg);
	}
	.seg.on {
		background: var(--band);
	}
	.letter {
		position: absolute;
		top: 11px;
		left: 50%;
		transform: translateX(-50%);
		font-size: 0.72rem;
		font-weight: 600;
		color: var(--text-3);
	}
	.seg.on .letter {
		color: var(--text);
		font-weight: 800;
	}
	/* Tier letters sit mid-segment; boundary values sit on the same line at the edges. */
	.axis {
		position: relative;
		height: 1.9rem;
		margin-top: -6px;
		font: 0.66rem var(--mono);
		color: var(--text-4);
	}
	.tick {
		position: absolute;
		top: 11px;
		transform: translateX(-50%);
	}
	.tick.end {
		right: 0;
		transform: none;
	}
	.tick::before {
		content: '';
		position: absolute;
		top: -5px;
		left: 50%;
		width: 1px;
		height: 4px;
		background: var(--line-strong);
	}
	.tick.end::before {
		display: none;
	}
	.sum,
	.none {
		margin: 0.2rem 0 0;
		color: var(--text-3);
		font-size: 0.88rem;
	}
</style>
