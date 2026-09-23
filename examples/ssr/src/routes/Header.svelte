<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import { t } from 'sveltext';

	interface Props {
		currentLocale: string;
	}

	let { currentLocale }: Props = $props();
</script>

<nav>
	<a href={resolve('/')}>
		{t`Home Page`}
	</a>
	|
	<a href={resolve('/test')}>
		{t`Sub Page`}
	</a>
</nav>

<section>
	<h2>{t`Switch language`}</h2>

	{#each ['en', 'ja'] as locale (locale)}
		{#if locale !== currentLocale}
			<form method="POST" action="/?/setLocale" use:enhance>
				<input type="hidden" name="locale" value={locale} />
				<button data-testid="switch-locale" type="submit">
					{locale}
				</button>
			</form>
		{/if}
	{/each}
</section>
