<script lang="ts">
	import type { Snippet } from 'svelte';
	import { getMessage, getSveltextContext } from './runtime';
	import type { MessageDescriptor } from './runtime';

	interface Props {
		msg: MessageDescriptor;
		[key: string]: MessageDescriptor | Snippet;
	}

	let { msg, ...snippets }: Props = $props();

	const context = getSveltextContext();
	let parts = $derived(getMessage(msg.id, context.messages)) as (keyof typeof snippets)[];
</script>

{#each parts as part, index (index)}
	{#if part in snippets}
		{@const snippet = snippets[part] as Snippet}
		{@render snippet()}
	{:else if msg.args && part in msg.args}
		{msg.args[part]}
	{:else}
		{part}
	{/if}
{/each}
