<script lang="ts">
	import { onMount } from 'svelte';
	// Compact, bold page header for device, pen and family pages: brand big and
	// first, the name, and the model number in a dark chip, all within ~200px.
	type Link = { href: string; label: string; primary?: boolean };
	let {
		brand,
		kind,
		title,
		model = null,
		back,
		rating = null,
		badges = [],
		since = null,
		aka = null,
		links = [],
		context = null
	}: {
		brand: string;
		kind: string;
		title: string;
		model?: string | null;
		back: { href: string; label: string };
		rating?: string | null;
		badges?: string[];
		since?: string | null;
		aka?: string | null;
		links?: Link[];
		context?: { href: string; label: string } | null;
	} = $props();

	// "pop out": open this page in its own small window (to sit beside the list, or
	// on a stream). The window's name marks it, and survives navigating inside it,
	// so a popped-out window drops the back link and the pop-out button.
	const POP = 'recs-pop';
	let popped = $state(false);
	onMount(() => {
		popped = window.name.startsWith(POP);
		if (popped) document.documentElement.classList.add('popped');
	});
	function popOut() {
		const w = Math.min(820, screen.availWidth);
		const h = Math.min(960, screen.availHeight);
		const win = window.open(location.href, `${POP}:${location.pathname}`, `popup,width=${w},height=${h}`);
		win?.focus();
	}
</script>

<header class="hero">
	<div class="ghost" aria-hidden="true">{brand.toUpperCase()}</div>
	<div class="inner">
		<div class="top">
			{#if !popped}
				<a class="back" href={back.href}>
					<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><path d="M15 18l-6-6 6-6"></path></svg>
					{back.label}
				</a>
			{/if}
			{#if context}<a class="context" href={context.href}>{context.label}</a>{/if}
			{#if !popped}
				<button class="pop" onclick={popOut} title="Open this page in its own window">
					<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><path d="M14 4h6v6"></path><path d="M20 4l-9 9"></path><path d="M18 14v6H4V6h6"></path></svg>
					pop out
				</button>
			{/if}
		</div>
		<div class="brandrow">
			<span class="brand">{brand.toUpperCase()}</span>
			<span class="kind">{kind.toUpperCase()}</span>
		</div>
		<div class="namerow">
			<h1>{title}</h1>
			{#if model}<span class="model"><span class="sr-only">Model </span>{model}</span>{/if}
		</div>
		{#if aka}<p class="aka">{aka}</p>{/if}
		<div class="meta">
			{#if rating}<span class="rating">{rating.toUpperCase()}</span>{/if}
			{#each badges as b, k (k)}<span class="badge">{b.toUpperCase()}</span>{/each}
			{#if since}<span class="since">{since}</span>{/if}
			<span class="links">
				{#each links as l (l.href)}<a class:primary={l.primary} href={l.href}>{l.label}</a>{/each}
			</span>
		</div>
	</div>
</header>

<style>
	.hero {
		position: relative;
		overflow: hidden;
		color: #fff;
		background: var(--band);
	}
	.ghost {
		position: absolute;
		right: -1rem;
		bottom: -2.2rem;
		font-size: clamp(5rem, 13vw, 10rem);
		font-weight: 800;
		letter-spacing: 0.04em;
		line-height: 1;
		color: rgba(255, 255, 255, 0.1);
		white-space: nowrap;
		pointer-events: none;
	}
	.inner {
		position: relative;
		max-width: 1440px;
		margin: 0 auto;
		padding: 0.75rem 2rem 1.1rem;
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
	}
	.top {
		display: flex;
		gap: 1.25rem;
		align-items: center;
		flex-wrap: wrap;
	}
	.back,
	.context {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		min-height: 32px;
		color: #fff;
		text-decoration: none;
		font-size: 0.85rem;
	}
	.context {
		opacity: 0.85;
	}
	.pop {
		margin-left: auto;
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		min-height: 32px;
		padding: 0 0.7rem;
		border: 1px solid rgba(255, 255, 255, 0.55);
		background: transparent;
		color: #fff;
		font: inherit;
		font-size: 0.85rem;
		cursor: pointer;
	}
	.pop:hover {
		background: rgba(255, 255, 255, 0.15);
	}
	.back:hover,
	.context:hover {
		color: #fff;
		text-decoration: underline;
	}
	.brandrow {
		display: flex;
		align-items: baseline;
		gap: 1rem;
		flex-wrap: wrap;
	}
	.brand {
		font-size: clamp(1.4rem, 2.4vw, 1.9rem);
		font-weight: 800;
		letter-spacing: 0.1em;
		line-height: 1;
	}
	.kind {
		font-size: 0.75rem;
		font-weight: 700;
		letter-spacing: 0.2em;
		opacity: 0.88;
	}
	.namerow {
		display: flex;
		align-items: center;
		gap: 0.4rem 1rem;
		flex-wrap: wrap;
	}
	h1 {
		margin: 0;
		font-size: clamp(2rem, 4vw, 3.25rem);
		font-weight: 300;
		letter-spacing: -0.035em;
		line-height: 1.05;
	}
	.model {
		padding: 0.2rem 0.7rem;
		background: rgba(0, 0, 0, 0.32);
		font: 700 clamp(1rem, 1.6vw, 1.3rem) var(--sans);
		letter-spacing: 0.04em;
	}
	.aka {
		margin: 0;
		font-style: italic;
		font-size: 0.95rem;
	}
	.meta {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem 0.6rem;
		align-items: center;
		margin-top: 0.3rem;
	}
	.rating {
		padding: 0.3rem 0.75rem;
		background: #fff;
		color: var(--text);
		font-size: 0.85rem;
		font-weight: 700;
		letter-spacing: 0.12em;
	}
	.badge {
		padding: 0.3rem 0.7rem;
		background: rgba(0, 0, 0, 0.28);
		font-size: 0.75rem;
		font-weight: 600;
		letter-spacing: 0.08em;
	}
	.since {
		font-size: 0.9rem;
		opacity: 0.92;
	}
	.links {
		display: inline-flex;
		gap: 0.6rem;
		flex-wrap: wrap;
		margin-left: auto;
	}
	.links a {
		display: inline-flex;
		align-items: center;
		height: 32px;
		padding: 0 0.85rem;
		border: 1px solid rgba(255, 255, 255, 0.75);
		color: #fff;
		text-decoration: none;
		font-size: 0.85rem;
	}
	.links a.primary {
		background: #fff;
		border-color: #fff;
		color: var(--text);
		font-weight: 600;
	}
	.links a:hover {
		text-decoration: underline;
	}
	@media (max-width: 700px) {
		.inner {
			padding: 0.6rem 1rem 1rem;
		}
		.links {
			margin-left: 0;
		}
	}
</style>
