<script lang="ts">
	// The pressure section on device and pen pages: IAF and max pressure side
	// by side, then Seven's note on how far to trust the numbers.
	import PressureRange from './PressureRange.svelte';
	import type { Pen } from './catalog';

	let { pen }: { pen: Pen } = $props();
</script>

<div class="pair">
	<PressureRange metric="IAF" data={pen.pressureIaf} />
	<PressureRange metric="MAX" data={pen.pressureMax} />
</div>
<p class="legend"><span class="d"></span> measured directly <span class="d est"></span> estimated from a pressure-response curve <span class="m"></span> median</p>
<aside class="caveat">
	<strong>About these numbers.</strong>
	These are my own measurements of the pens I've bought. I'm consistent, but I'm not the best measurer in the world,
	especially for IAF, so take those with a grain of salt. Maximum pressure I measure much more reliably. Each dot is
	one pen, so you can see how much units vary. The only way to know how a pen really feels to you is to try it.
	<span class="sig">Seven</span>
</aside>

<style>
	.pair {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(min(340px, 100%), 1fr));
		gap: 1.5rem 3rem;
	}
	.legend {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.4rem 0.5rem;
		margin: 1rem 0 0;
		font-size: 0.85rem;
		color: var(--text-3);
	}
	.legend span {
		display: inline-block;
		margin-left: 0.6rem;
	}
	.legend span:first-child {
		margin-left: 0;
	}
	.d {
		width: 10px;
		height: 10px;
		border-radius: 50%;
		background: var(--text);
	}
	.d.est {
		background: var(--bg);
		border: 2px solid var(--text);
	}
	.m {
		width: 3px;
		height: 14px;
		background: var(--band);
	}
	.caveat {
		margin-top: 1.5rem;
		max-width: 62rem;
		padding: 0.9rem 1.1rem;
		border-left: 4px solid var(--tip);
		background: var(--tip-wash);
		color: var(--text-2);
		font-size: 0.95rem;
		line-height: 1.5;
	}
	.sig {
		display: block;
		margin-top: 0.3rem;
		font-style: italic;
		color: var(--text-3);
	}
</style>
