<script lang="ts">
	import { SveltextRoot, T, msg, t, type SveltextContext } from 'sveltext';
	import Badges from './Badges.svelte';

	let { locale, messages }: SveltextContext = $props();
</script>

<SveltextRoot {locale} {messages}>
	<p>{t`Active`}</p>
	<T msg={msg`Hello {name}!`}>
		{#snippet name()}<b>Ray</b>{/snippet}
	</T>
	<Badges />
</SveltextRoot>
