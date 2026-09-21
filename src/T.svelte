<script lang="ts">
	import { getMessage, getSveltextContext } from './runtime.js';
	const context = getSveltextContext();
	let { msg, ...snippets } = $props();
	let parts = $derived(getMessage(msg.id, context.messages));
</script>

{#each parts as part, index (index)}
	{#if part in snippets}
		{@render snippets[part]?.()}
	{:else if msg.args && part in msg.args}
		{msg.args[part]}
	{:else}
		{part}
	{/if}
{/each}
