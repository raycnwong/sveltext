<script lang="ts">
	import { c, msg, plural, T, t } from 'sveltext';
	import { formatStatus, validateItems } from '$lib/helpers';
	import { enhance } from '$app/forms';
	import { untrack } from 'svelte';
	import { superForm } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters/zod4';
	import { textSchema } from '$lib/schema';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const id = $props.id();
	const {
		form,
		errors,
		message,
		enhance: enhanceText
	} = superForm(
		untrack(() => data.form),
		{
			id,
			validators: zodClient(textSchema),
			validationMethod: 'onsubmit',
			resetForm: false
		}
	);

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

	async function goRefresh(success = true) {
		if (success) {
			itemCount = 1;
			alert(formatStatus('ready'));
			return;
		}

		alert(await validateItems(false));
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
	<p data-testid="ts-status">{formatStatus('ready')}</p>
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

<section>
	<h2>{t`Translate on server`}</h2>

	<form
		method="POST"
		action="/?/sendEmail"
		use:enhance
		onsubmit={() => {
			alert('The translated email has been logged in the server console.');
		}}
	>
		<button data-testid="send-email" type="submit">{t`Send Email`}</button>
	</form>
</section>

<section>
	<h2>{t`Form validation`}</h2>

	<form method="POST" action="?/validateText" use:enhanceText novalidate>
		<input type="hidden" name="__superform_id" value={id} />
		<label for="validation-text">{t`Text (1–6 characters)`}</label>
		<input
			id="validation-text"
			data-testid="validation-text"
			type="text"
			name="text"
			bind:value={$form.text}
			aria-invalid={$errors.text?.length ? 'true' : undefined}
			aria-describedby={$errors.text?.length ? 'validation-errors' : undefined}
		/>
		{#if $errors.text?.length}
			<div id="validation-errors" data-testid="validation-errors" role="alert">
				{#each $errors.text ?? [] as error}
					<p>{t(error)}</p>
				{/each}
			</div>
		{/if}
		<button data-testid="validation-submit" type="submit">{t`Validate`}</button>
		{#if $message}
			<p data-testid="validation-success" role="status">{t($message)}</p>
		{/if}
	</form>
</section>
