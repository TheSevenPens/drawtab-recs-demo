<script lang="ts">
	// Short version of a pen's pressure results for tablet pages: range, median
	// and tier for IAF and max pressure. The charts live on the pen page.
	import { base } from '$app/paths';
	import { PRESSURE_DEF, PRESSURE_TITLE, penHref, type Pen, type PressureMetric } from './catalog';

	let { pen }: { pen: Pen } = $props();
	const rows = $derived([
		['IAF', pen.pressureIaf],
		['MAX', pen.pressureMax]
	] as const);
	const tested = $derived(Math.max(pen.pressureIaf?.units.length ?? 0, pen.pressureMax?.units.length ?? 0));
</script>

<div class="sum">
	{#each rows as [m, r] (m)}
		<div class="row">
			<div class="what">
				<div class="k">{PRESSURE_TITLE[m as PressureMetric]}</div>
				<div class="def">{PRESSURE_DEF[m as PressureMetric]}</div>
			</div>
			{#if r}
				<div class="v">{r.median}<span class="unit">gf</span><span class="lbl">median</span></div>
				<div class="range">{r.units.length > 1 ? `range ${r.min} to ${r.max} gf` : 'one pen tested'}</div>
				{#if r.tier}<span class="tier">{r.tier} tier</span>{/if}
			{:else}
				<div class="v none">not measured yet</div>
			{/if}
		</div>
	{/each}
</div>
<p class="foot">
	{#if tested}Seven's measurements of {tested} {tested === 1 ? 'pen' : 'pens'}, so treat them as a guide.{/if}
	<a href={penHref(base, pen.id)}>See every measurement on the pen's page</a>.
</p>

<style>
	.sum {
		display: grid;
		gap: 0.5rem;
		max-width: 62rem;
	}
	.row {
		display: grid;
		grid-template-columns: minmax(0, 1.6fr) auto minmax(6.5rem, auto) minmax(8.5rem, auto);
		align-items: center;
		gap: 0.5rem 1.5rem;
		padding: 0.85rem 1.1rem;
		background: var(--surface);
	}
	.k {
		font-size: 1.05rem;
	}
	.def {
		font-size: 0.85rem;
		color: var(--text-3);
	}
	.v {
		font-size: 1.9rem;
		font-weight: 200;
		letter-spacing: -0.02em;
		line-height: 1;
		white-space: nowrap;
	}
	.v.none {
		grid-column: span 3;
		font-size: 1rem;
		color: var(--text-3);
	}
	.unit {
		margin-left: 0.15rem;
		font-size: 0.95rem;
		font-weight: 400;
		color: var(--text-2);
	}
	.lbl {
		margin-left: 0.45rem;
		font-size: 0.65rem;
		font-weight: 700;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: var(--text-3);
	}
	.range {
		font-size: 0.95rem;
		color: var(--text-2);
		white-space: nowrap;
	}
	.tier {
		justify-self: start;
		padding: 0.2rem 0.55rem;
		background: var(--band);
		color: #fff;
		font-size: 0.7rem;
		font-weight: 700;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		white-space: nowrap;
	}
	.foot {
		margin: 0.75rem 0 0;
		font-size: 0.9rem;
		color: var(--text-3);
	}
	@media (max-width: 640px) {
		.row {
			grid-template-columns: auto auto;
		}
		.what {
			grid-column: 1 / -1;
		}
	}
</style>
