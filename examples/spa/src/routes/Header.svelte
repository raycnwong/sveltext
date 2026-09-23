<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { t } from 'sveltext';
	import { setCurrentLocale } from '$lib/i18n';

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

	{#each ['en', 'ja'] as lang (lang)}
		{#if lang !== currentLocale}
			<button
				data-testid="switch-locale"
				type="button"
				onclick={() => {
					setCurrentLocale(lang);
					invalidateAll();
				}}
			>
				{lang}
			</button>
		{/if}
	{/each}
</section>
