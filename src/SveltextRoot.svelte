<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { MessageCatalog } from './runtime.js';
	import { setLocale } from './runtime.js';

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
