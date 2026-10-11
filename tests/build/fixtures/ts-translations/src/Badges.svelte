<script module lang="ts">
	import { c } from 'sveltext';

	export function moduleBadge() {
		return c('badge').t`New`;
	}
</script>

<script lang="ts">
	import { plural } from 'sveltext';

	const count = 2;
</script>

<span>{moduleBadge()}</span>
<span>{plural(count, { one: '# item', other: '# items' })}</span>
