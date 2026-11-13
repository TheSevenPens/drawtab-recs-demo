<script lang="ts">
	import { units, setUnits } from './units.svelte';
	import type { Units } from './catalog';
	const OPTIONS: [Units, string][] = [
		['mm', 'mm'],
		['in', 'inches'],
		['both', 'both']
	];
</script>

<div class="units" role="group" aria-label="Units for active area">
	<span class="lbl">active area in</span>
	{#each OPTIONS as [v, l] (v)}
		<button aria-pressed={units.value === v} onclick={() => setUnits(v)}>{l}</button>
	{/each}
</div>

<style>
	.units {
		display: inline-flex;
		align-items: center;
		font-size: 0.85rem;
	}
	.lbl {
		color: var(--text-3);
		margin-right: 0.4rem;
		white-space: nowrap;
	}
	button {
		height: 32px;
		padding: 0 0.6rem;
		border: 1px solid var(--line-strong);
		background: var(--surface);
		color: var(--text-2);
		cursor: pointer;
		font-size: 0.85rem;
	}
	button + button {
		border-left: 0;
	}
	button[aria-pressed='true'] {
		background: var(--text);
		border-color: var(--text);
		color: #fff;
		font-weight: 600;
	}
</style>
