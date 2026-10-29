<script lang="ts">
	import type { Snippet } from 'svelte';
	import { getMessage, getTranslationContext, parseDescriptor } from './runtime';
	import type { MessageDescriptor } from './runtime';

	interface Props {
		msg: MessageDescriptor;
		[key: string]: MessageDescriptor | Snippet;
	}

	let { msg, ...snippets }: Props = $props();

	let descriptor = $derived(parseDescriptor(msg));
	let parts = $derived(getMessage(descriptor.id, getTranslationContext().messages)) as (
		keyof typeof snippets
	)[];
</script>

{#each parts as part, index (index)}
	{#if part in snippets}
		{@const snippet = snippets[part] as Snippet}
		{@render snippet()}
	{:else if part in descriptor.args}
		{descriptor.args[part]}
	{:else}
		{part}
	{/if}
{/each}
