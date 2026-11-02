<script lang="ts">
	import { plural, t } from 'sveltext';

	let { response }: { response: { data: { item: { count: number } } } } = $props();
	const itemLabel = plural(response.data.item.count, { one: '# item', other: '# items' });
</script>

<p>{t`You have ${plural(response.data.item.count, { one: '# item', other: '# items' })} (${itemLabel}).`}</p>
