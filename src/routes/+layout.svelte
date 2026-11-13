<script lang="ts">
	import { onMount } from 'svelte';
	import { loadUnits } from '$lib/units.svelte';
	let { children } = $props();

	// Big text mode (for streams and screen sharing), remembered per browser.
	let big = $state(false);
	onMount(() => {
		loadUnits();
		try {
			big = localStorage.getItem('recs-big') === '1';
		} catch {}
	});
	$effect(() => {
		document.body.classList.toggle('big', big);
	});
	function toggleBig() {
		big = !big;
		try {
			localStorage.setItem('recs-big', big ? '1' : '');
		} catch {}
	}
</script>

<div class="ground">
	<!-- Zune-style colour bleeding in from the edges: CSS gradients on two fixed
	     layers that drift slowly. Only transform/opacity animate, so the browser
	     composites them on the GPU without repainting the page. -->
	<div class="aurora" aria-hidden="true">
		<div class="glow a"></div>
		<div class="glow b"></div>
		<div class="glow c"></div>
	</div>
	<div class="content">
		{@render children()}
	</div>
	<button class="bigtoggle" aria-pressed={big} onclick={toggleBig} title="Larger text, for streams and screen sharing">
		{big ? 'normal text' : 'big text'}
	</button>
</div>

<style>
	:global(:root) {
		/* Ink and ground: warm off-white, near-black text. */
		--bg: #ffffff;
		--surface: #ffffff;
		--sunk: #ebe7e2;
		--line: #dddad6;
		--line-strong: #c9c5c0;
		--text: #161616;
		--text-2: #3d3d3d;
		--text-3: #5c5c5c;
		--text-4: #8a8a8a;
		--link: #b3005f;
		--link-hover: #c2410c;
		--glow: radial-gradient(1100px 620px at 95% -10%, rgba(236, 0, 140, 0.2), rgba(255, 122, 26, 0.12) 45%, rgba(247, 245, 243, 0) 75%);
		--chip-on: linear-gradient(100deg, #c8006b, #d24a08);

		/* Rating tiers: band (white text on it), pale body wash, heading text gradient. */
		--band-excellent: linear-gradient(135deg, #b4246c, #bc4a20);
		--wash-excellent: linear-gradient(160deg, #fde8f0, #fdf0e7);
		--head-excellent: linear-gradient(90deg, #c8006b, #d24a08);
		--band-verygood: linear-gradient(135deg, #6a35c4, #a82470);
		--wash-verygood: linear-gradient(160deg, #f1eafd, #fbe9f1);
		--head-verygood: linear-gradient(90deg, #6a2bd6, #c8006b);
		--band-good: linear-gradient(135deg, #1767a8, #3a4cc0);
		--wash-good: linear-gradient(160deg, #e8f1fb, #eceefc);
		--head-good: linear-gradient(90deg, #0a6fb8, #3b4fd8);
		--band-ok: linear-gradient(135deg, #6d5a12, #86691a);
		--wash-ok: linear-gradient(160deg, #f6f0dc, #f3efe6);
		--head-ok: linear-gradient(90deg, #6d5a12, #9a7a1c);
		--band-avoid: linear-gradient(135deg, #8f1d17, #a8301f);
		--wash-avoid: linear-gradient(160deg, #fbe5e3, #f8ecea);
		--head-avoid: linear-gradient(90deg, #8f1d17, #b3261e);
		--band-none: linear-gradient(135deg, #4f4f4f, #6e6e6e);
		--wash-none: linear-gradient(160deg, #eeeeee, #f2f1ef);
		--head-none: linear-gradient(90deg, #4f4f4f, #7a7a7a);

		--warning: #9a3412;
		--warning-wash: #fff1e6;
		--tip: #1d5c96;
		--tip-wash: #eaf2fb;
		--mono: 'JetBrains Mono', ui-monospace, 'Cascadia Mono', Consolas, monospace;
		--sans: 'Open Sans', 'Segoe UI', system-ui, sans-serif;
		--scale: 1;
		color-scheme: light;
	}
	:global(body.big) {
		--scale: 1.2;
	}
	:global(html) {
		font-size: calc(16px * var(--scale));
	}
	:global(body) {
		margin: 0;
		background: var(--bg);
		color: var(--text);
		font-family: var(--sans);
		-webkit-font-smoothing: antialiased;
	}
	:global(a) {
		color: var(--link);
	}
	:global(a:hover) {
		color: var(--link-hover);
	}
	:global(button),
	:global(input),
	:global(select) {
		font: inherit;
		color: inherit;
	}
	:global(:focus-visible) {
		outline: 2px solid var(--link);
		outline-offset: 2px;
	}
	:global(.sr-only) {
		position: absolute;
		width: 1px;
		height: 1px;
		overflow: hidden;
		clip: rect(0 0 0 0);
		white-space: nowrap;
	}
	:global(.tier-excellent) {
		--band: var(--band-excellent);
		--wash: var(--wash-excellent);
		--head: var(--head-excellent);
	}
	:global(.tier-verygood) {
		--band: var(--band-verygood);
		--wash: var(--wash-verygood);
		--head: var(--head-verygood);
	}
	:global(.tier-good) {
		--band: var(--band-good);
		--wash: var(--wash-good);
		--head: var(--head-good);
	}
	:global(.tier-ok) {
		--band: var(--band-ok);
		--wash: var(--wash-ok);
		--head: var(--head-ok);
	}
	:global(.tier-avoid) {
		--band: var(--band-avoid);
		--wash: var(--wash-avoid);
		--head: var(--head-avoid);
	}
	:global(.tier-none) {
		--band: var(--band-none);
		--wash: var(--wash-none);
		--head: var(--head-none);
	}
	.ground {
		min-height: 100vh;
		background: var(--bg);
	}
	.content {
		position: relative;
		z-index: 1;
	}
	.aurora {
		position: fixed;
		inset: 0;
		z-index: 0;
		overflow: hidden;
		pointer-events: none;
	}
	.glow {
		position: absolute;
		will-change: transform;
	}
	/* Bottom edge: the strongest bleed, magenta into orange. */
	.glow.a {
		left: -20vw;
		right: -20vw;
		bottom: -30vh;
		height: 66vh;
		background:
			radial-gradient(45% 55% at 22% 60%, rgba(214, 20, 124, 0.55), rgba(214, 20, 124, 0) 72%),
			radial-gradient(40% 50% at 60% 72%, rgba(242, 110, 34, 0.5), rgba(242, 110, 34, 0) 72%),
			radial-gradient(35% 45% at 90% 55%, rgba(125, 69, 224, 0.4), rgba(125, 69, 224, 0) 72%);
		animation: drift-a 26s ease-in-out infinite alternate;
	}
	/* Top-right corner: a softer magenta/violet glow. */
	.glow.b {
		top: -45vh;
		right: -25vw;
		width: 75vw;
		height: 85vh;
		background:
			radial-gradient(50% 50% at 60% 50%, rgba(236, 0, 140, 0.28), rgba(236, 0, 140, 0) 70%),
			radial-gradient(45% 45% at 30% 60%, rgba(125, 69, 224, 0.2), rgba(125, 69, 224, 0) 70%);
		animation: drift-b 32s ease-in-out infinite alternate;
	}
	/* Left edge: a faint orange wash, low down. */
	.glow.c {
		left: -30vw;
		top: 30vh;
		width: 50vw;
		height: 70vh;
		background: radial-gradient(50% 50% at 50% 50%, rgba(255, 122, 26, 0.13), rgba(255, 122, 26, 0) 70%);
		animation: drift-c 38s ease-in-out infinite alternate;
	}
	@keyframes drift-a {
		from {
			transform: translate3d(-4vw, 0, 0) scale(1);
		}
		to {
			transform: translate3d(4vw, -3vh, 0) scale(1.06);
		}
	}
	@keyframes drift-b {
		from {
			transform: translate3d(0, 0, 0) scale(1);
		}
		to {
			transform: translate3d(-6vw, 4vh, 0) scale(1.08);
		}
	}
	@keyframes drift-c {
		from {
			transform: translate3d(0, 0, 0);
		}
		to {
			transform: translate3d(5vw, -8vh, 0);
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.glow {
			animation: none;
		}
	}
	.bigtoggle {
		position: fixed;
		right: 16px;
		bottom: 16px;
		min-height: 40px;
		padding: 0 14px;
		border: 1px solid var(--line-strong);
		background: var(--surface);
		color: var(--text-2);
		font-size: 0.85rem;
		cursor: pointer;
		z-index: 10;
	}
	.bigtoggle[aria-pressed='true'] {
		background: var(--text);
		color: #fff;
		border-color: var(--text);
	}
</style>
