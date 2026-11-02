<script lang="ts">
	import { t } from 'sveltext';
	import { title, body } from '#lib/test.ts';
</script>

<section>
	<h2>{t(title)}</h2>

	<p>{t(body)}</p>
</section>
