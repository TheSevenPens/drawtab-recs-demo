<script lang="ts">
	import { base } from '$app/paths';
	import '$lib/detail.css';
	import Hero from '$lib/Hero.svelte';
	import Card from '$lib/Card.svelte';
	import UnitsSwitch from '$lib/UnitsSwitch.svelte';
	import { TYPE_LABEL, bestRating, tabletHref, tierClass } from '$lib/catalog';

	let { data } = $props();
	const f = $derived(data.family);
	const recommended = $derived(data.catalog.items.filter((i) => i.familyId === f.id));
	const others = $derived(f.members.filter((m) => !m.recommended));
	const rating = $derived(bestRating(f.members, data.catalog.ratingScale));
	const types = $derived([...new Set(f.members.map((m) => TYPE_LABEL[m.type]))].join(' / '));
</script>

<svelte:head>
	<title>{f.name} · Seven Pens recommendations</title>
	<meta name="description" content="Every model in the {f.name}, and which ones Seven Pens recommends." />
</svelte:head>

<div class="detail tier-{tierClass(rating)}">
	<Hero
		brand={f.brandName}
		kind={`${types} family`}
		title={f.name}
		back={{ href: `${base}/`, label: 'back to recommendations' }}
		badges={[`${f.members.length} model${f.members.length === 1 ? '' : 's'}`, `${recommended.length} recommended`]}
		links={[{ href: f.explorerUrl, label: 'this family in the explorer' }]}
	/>

	<main class="content">
		<section aria-labelledby="f-recs">
			<div class="sechead">
				<h2 id="f-recs">recommended</h2>
				<UnitsSwitch />
			</div>
			<div class="grid">
				{#each recommended as i (i.id)}<Card item={i} />{/each}
			</div>
		</section>

		{#if others.length}
			<section aria-labelledby="f-others">
				<h2 id="f-others">other models in this family</h2>
				<ul class="list">
					{#each others as m (m.id)}
						<li class="row">
							<a href={tabletHref(base, m)}>{m.name}</a><span class="mono">{m.modelId}</span>
							<span class="sub">{TYPE_LABEL[m.type]}{m.year ? `, ${m.year}` : ''}{m.status === 'DISCONTINUED' ? ', discontinued' : ''}</span>
						</li>
					{/each}
				</ul>
				<p class="dim">Not rated. These link to the DrawTabData explorer.</p>
			</section>
		{/if}
	</main>
</div>
