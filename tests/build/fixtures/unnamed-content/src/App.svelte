<script>
	import { T, msg } from 'sveltext';
</script>

<T msg={msg`Toolbar: {refresh}`}>
	{#snippet refresh()}<button>Refresh</button>{/snippet}
	<button>Retry</button>
</T>
