<script lang="ts">
	import { SveltextRoot } from 'sveltext';
	import Header from './Header.svelte';
	import Footer from './Footer.svelte';
	import type { LayoutProps } from './$types';

	let { data, children }: LayoutProps = $props();
</script>

{#key data.currentLocale}
	<SveltextRoot locale={data.currentLocale} messages={data.messages}>
		<Header currentLocale={data.currentLocale} />

		{@render children()}

		<Footer />
	</SveltextRoot>
{/key}
