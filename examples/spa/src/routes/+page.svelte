<script lang="ts">
	import { c, msg, plural, t, T } from 'sveltext';
	import { errors } from '$lib/helpers';

	let name = 'John Doe';
	let greeting = msg`Hello ${name}!`;
	let itemCount = $state(1);

	const itemLabel = $derived(
		plural(itemCount, {
			one: '# item',
			other: '# items'
		})
	);

	const summary = $derived(t`Hello ${name}. You have ${itemLabel}.`);

	function goRefresh(success = true) {
		if (success) {
			itemCount = 1;
			alert(t`Refreshed`);
			return;
		}

		alert(t(errors.sync));
	}
</script>

<section>
	<h2>{t`Plural`}</h2>

	<p data-testid="item-label">{itemLabel}</p>

	<div>
		<button
			data-testid="decrement"
			type="button"
			onclick={() => (itemCount = Math.max(0, itemCount - 1))}
		>
			-
		</button>
		<button data-testid="increment" type="button" onclick={() => itemCount++}>+</button>
	</div>
</section>

<section>
	<h2>{t`Interpolation and composition`}</h2>

	<p data-testid="multiline" style="white-space: pre-wrap;">
		{t`Line 1\nLine 2`}
	</p>

	<p data-testid="greeting">{t(greeting)}</p>

	<p data-testid="count-summary">{t`You have ${itemCount} (${itemLabel}).`}</p>

	<p data-testid="context-message">{t`Interpolated context message: ${c('badge').t`New`}`}</p>

	<p data-testid="summary">{summary}</p>
</section>

<section>
	<h2>{t`Component interpolation`}</h2>

	<T msg={msg`Toolbar: {refresh} {refreshFail}`}>
		{#snippet refresh()}
			<button data-testid="refresh" type="button" onclick={() => goRefresh(true)}>
				{t`Refresh`}
			</button>
		{/snippet}

		{#snippet refreshFail()}
			<button data-testid="refresh-fail" type="button" onclick={() => goRefresh(false)}>
				{t`Refresh (fail)`}
			</button>
		{/snippet}
	</T>
</section>
