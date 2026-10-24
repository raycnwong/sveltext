<script lang="ts">
	import { SveltextRoot } from 'sveltext';
	import Page from './Page.svelte';
	import Footer from './Footer.svelte';
	import { loadMessageCatalog } from './lib/i18n';

	const locales = ['en', 'zh-HK', 'ja'] as const;
	let currentLocale: (typeof locales)[number] = $state('en');
</script>

{#key currentLocale}
	{#await loadMessageCatalog(currentLocale) then messages}
		<SveltextRoot locale={currentLocale} {messages}>
			{#each locales as locale (locale)}
				{#if locale !== currentLocale}
					<button data-testid={`switch-locale-${locale}`} onclick={() => (currentLocale = locale)}>
						{locale}
					</button>
				{/if}
			{/each}
			<Page />
			<Footer />
		</SveltextRoot>
	{/await}
{/key}
