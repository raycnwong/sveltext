<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { MessageCatalog } from './runtime';
	import { setBrowserContext } from './runtime';

	interface Props {
		locale: string;
		messages: MessageCatalog;
		syncLangAttribute?: boolean;
		onInit?: () => void;
		children: Snippet;
	}

	let { locale, messages, syncLangAttribute, onInit, children }: Props = $props();

	function initialize() {
		if (typeof window !== 'undefined') {
			setBrowserContext({ locale, messages });
			if (syncLangAttribute !== false) {
				document.documentElement.setAttribute('lang', locale);
			}
		}
		onInit?.();
	}

	initialize();
</script>

{@render children()}
