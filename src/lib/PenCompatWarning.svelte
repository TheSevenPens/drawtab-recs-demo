<script lang="ts">
	// Shown above the pens list and near the top of every pen page: pens only work with
	// specific tablets, so buyers should confirm with the tablet maker before buying.
</script>

<aside class="pencompat" role="note" aria-label="Pen compatibility warning">
	<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
		<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"></path>
		<path d="M12 9v4"></path>
		<path d="M12 17h.01"></path>
	</svg>
	<div>
		<p class="t">Check pen compatibility before you buy</p>
		<p>
			Pens only work with specific tablets. Even if a pen is listed here as compatible with your tablet, the safest thing to do is
			contact your tablet brand's customer support and ask them directly whether that pen works with your exact tablet model.
		</p>
	</div>
</aside>

<style>
	.pencompat {
		display: flex;
		gap: 0.9rem;
		align-items: flex-start;
		padding: 1rem 1.25rem;
		background: var(--warning-wash);
		border-left: 5px solid var(--warning);
		color: var(--text);
	}
	svg {
		flex: none;
		color: var(--warning);
		margin-top: 0.1rem;
	}
	p {
		margin: 0;
		font-size: 1rem;
		line-height: 1.5;
	}
	.t {
		font-size: 1.15rem;
		font-weight: 700;
		color: var(--warning);
		margin-bottom: 0.2rem;
	}
</style>
