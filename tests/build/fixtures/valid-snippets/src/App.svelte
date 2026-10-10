<script>
	import { T, msg, c } from 'sveltext';
	const name = 'Ray';
	const user = { name };
</script>

<T msg={msg`Toolbar: {refresh} {refreshFail}`}>
	<!-- Comments and whitespace are allowed. -->
	{#snippet refresh()}<button>Refresh</button>{/snippet}
	{#snippet refreshFail()}<button>Retry</button>{/snippet}
</T>
<T msg={msg`Hello ${name}: {refresh}`}>
	{#snippet refresh()}<button>Refresh</button>{/snippet}
</T>
<T msg={c('toolbar').msg`Toolbar: {refresh}`}>
	{#snippet refresh()}<button>Refresh</button>{/snippet}
</T>
<T msg={msg`Hello ${user.name} ${1 + 2}`} />
{#snippet refresh()}<button>Refresh</button>{/snippet}
<T msg={msg`Toolbar: {refresh}`} {refresh} />
<T msg={msg`Toolbar: {refresh} {refresh}`} {refresh} />
<T msg={msg`Toolbar: '{refresh}'`} />
