<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { MessageCatalog } from './runtime';
	import { setLocale } from './runtime';

	interface Props {
		locale: string;
		messages: MessageCatalog;
		syncLangAttribute?: boolean;
		onInit?: () => void;
		children: Snippet;
	}

	let { locale, messages, syncLangAttribute, onInit, children }: Props = $props();

	function initialize() {
		setLocale(locale, messages);
		if (syncLangAttribute !== false && typeof window !== 'undefined') {
			document.documentElement.setAttribute('lang', locale);
		}
		onInit?.();
	}

	initialize();
</script>

{@render children()}
