<script lang="ts">
	import { units, setUnits } from './units.svelte';
	import type { Units } from './catalog';
	const OPTIONS: [Units, string][] = [
		['mm', 'mm'],
		['in', 'inches'],
		['both', 'both']
	];
</script>

<label class="units">
	units
	<select value={units.value} onchange={(e) => setUnits(e.currentTarget.value as Units)}>
		{#each OPTIONS as [v, l] (v)}<option value={v}>{l}</option>{/each}
	</select>
</label>

<style>
	.units {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		font-size: 0.85rem;
		color: var(--text-3);
		white-space: nowrap;
	}
	select {
		height: 32px;
		padding: 0 0.4rem;
		border: 1px solid var(--line-strong);
		background: var(--surface);
		color: var(--text);
		font-size: 0.85rem;
		cursor: pointer;
	}
</style>
