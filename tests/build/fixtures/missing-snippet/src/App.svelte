<script>
	import { T, msg } from 'sveltext';
</script>

<T msg={msg`Toolbar: {refresh} {refreshFail}`}>
	{#snippet refresh()}<button>Refresh</button>{/snippet}
</T>
