<script lang="ts">
	import { SveltextRoot } from 'sveltext';
	import Page from './Page.svelte';
	import Footer from './Footer.svelte';
	import { loadMessageCatalog } from './lib/i18n';

	let currentLocale: 'en' | 'ja' = $state('en');
</script>

{#key currentLocale}
	{#await loadMessageCatalog(currentLocale) then messages}
		<SveltextRoot locale={currentLocale} {messages}>
			{#if currentLocale === 'en'}
				<button data-testid="switch-locale" onclick={() => (currentLocale = 'ja')}>ja</button>
			{:else}
				<button data-testid="switch-locale" onclick={() => (currentLocale = 'en')}>en</button>
			{/if}
			<!-- [Sveltext]: ⚠️ Writing t`Test` right here will crash -->
			<!-- [Sveltext]: ✅ Place translated content inside a separate component -->
			<Page />
			<Footer />
		</SveltextRoot>
	{/await}
{/key}
