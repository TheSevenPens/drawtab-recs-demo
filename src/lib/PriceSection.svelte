<script lang="ts">
	// A device's U.S. price: the newest store price, the launch price, every other
	// price seen, and the disclaimer. Each price names its store and month.
	import { PRICE_DISCLAIMER, longDate, money, monthYear, type Price, type PriceSeen } from './catalog';

	let { price }: { price: Price | null } = $props();
	const KIND = { CURRENT: 'store price', LAUNCH: 'launch price', RETAIL: 'early store price', LIST: 'list price' };
	const when = (p: PriceSeen) => (p.precision === 'day' ? longDate(p.date) : monthYear(p.date, true)) ?? 'date unknown';
	const lines = $derived(
		[
			price?.current ? { k: 'now', p: price.current, what: 'store price' } : null,
			price?.launch ? { k: price.launchKind === 'LAUNCH' ? 'at launch' : 'early on', p: price.launch, what: price.launchKind === 'LAUNCH' ? 'launch price' : 'early store price' } : null
		].filter(Boolean) as { k: string; p: PriceSeen; what: string }[]
	);
	const others = $derived(
		(price?.history ?? []).filter((h) => !lines.some((l) => l.p.amount === h.amount && l.p.date === h.date && l.p.url === h.url))
	);
</script>

{#if lines.length}
	<div class="lines">
		{#each lines as l (l.k)}
			<div class="line">
				<div class="k">{l.k}</div>
				<div class="v">{money(l.p.amount)}</div>
				<div class="src">
					{l.what}, {monthYear(l.p.date) ?? 'date unknown'}{' '}
					{#if l.p.seller}at {#if l.p.url}<a href={l.p.url}>{l.p.seller}</a>{:else}{l.p.seller}{/if}{:else if l.p.url}(<a href={l.p.url}>source</a>){/if}
				</div>
			</div>
		{/each}
	</div>
	{#if others.length}
		<details class="more">
			<summary>{others.length} other {others.length === 1 ? 'price' : 'prices'} seen</summary>
			<ul>
				{#each others as h, k (k)}
					<li>
						<span class="amt">{money(h.amount)}</span>
						{KIND[h.kind]}, {when(h)}{#if h.seller}, {#if h.url}<a href={h.url}>{h.seller}</a>{:else}{h.seller}{/if}{/if}
					</li>
				{/each}
			</ul>
		</details>
	{/if}
{:else}
	<p class="none">No U.S. price checked yet.</p>
{/if}
<p class="disc">{PRICE_DISCLAIMER}</p>

<style>
	.lines {
		display: grid;
		gap: 0.5rem;
		max-width: 62rem;
	}
	.line {
		display: grid;
		grid-template-columns: 6.5rem auto 1fr;
		align-items: baseline;
		gap: 0.5rem 1.5rem;
		padding: 0.85rem 1.1rem;
		background: var(--wash);
	}
	.k {
		font-size: 0.72rem;
		font-weight: 700;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: var(--text-3);
	}
	.v {
		font-size: 1.9rem;
		font-weight: 200;
		letter-spacing: -0.02em;
		line-height: 1;
		white-space: nowrap;
	}
	.src {
		font-size: 0.95rem;
		color: var(--text-2);
	}
	.more {
		margin-top: 0.75rem;
		font-size: 0.9rem;
		color: var(--text-2);
	}
	.more summary {
		cursor: pointer;
		color: var(--text-3);
	}
	.more ul {
		margin: 0.5rem 0 0;
		padding: 0;
		list-style: none;
		display: grid;
		gap: 0.3rem;
	}
	.amt {
		display: inline-block;
		min-width: 5.5rem;
		font-weight: 600;
		color: var(--text);
	}
	.none {
		margin: 0;
		color: var(--text-3);
	}
	.disc {
		margin: 0.75rem 0 0;
		max-width: 46rem;
		font-size: 0.88rem;
		color: var(--text-3);
	}
	@media (max-width: 640px) {
		.line {
			grid-template-columns: auto 1fr;
		}
		.src {
			grid-column: 1 / -1;
		}
	}
</style>
