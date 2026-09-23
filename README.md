# 🌍 sveltext

[![npm](https://img.shields.io/npm/v/sveltext.svg)](https://www.npmjs.com/package/sveltext)

A compiled, Svelte-first i18n library with Gettext-like syntax and ICU plurals.

- ✍️ **Gettext-like authoring** with no translation key management
- ⚡ **Lightweight, fast runtime** with compact compiled PO catalogs
- 🛠️ **Compile-time checks** with an extraction CLI
- 🌐 **Works in both SSR and SPA** environments

## 🚀 Try it out

| Example                                                                   | Online IDE                                                                                                                                                                                                                                                                                                               |
| ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| [SSR](https://github.com/raycnwong/sveltext/tree/main/examples/ssr)       | [![Open in SvelteLab](https://docs.sveltelab.dev/button/dark_short.svg)](https://sveltelab.dev/github.com/raycnwong/sveltext/tree/main/examples/ssr) [![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/raycnwong/sveltext/tree/main/examples/ssr)       |
| [SPA](https://github.com/raycnwong/sveltext/tree/main/examples/spa)       | [![Open in SvelteLab](https://docs.sveltelab.dev/button/dark_short.svg)](https://sveltelab.dev/github.com/raycnwong/sveltext/tree/main/examples/spa) [![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/raycnwong/sveltext/tree/main/examples/spa)       |
| [Svelte](https://github.com/raycnwong/sveltext/tree/main/examples/svelte) | [![Open in SvelteLab](https://docs.sveltelab.dev/button/dark_short.svg)](https://sveltelab.dev/github.com/raycnwong/sveltext/tree/main/examples/svelte) [![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/raycnwong/sveltext/tree/main/examples/svelte) |

## 📦 Getting Started

Please follow the [Setup Guide](https://github.com/raycnwong/sveltext/blob/main/docs/getting-started.md) to install and configure `sveltext`.

## 📖 Usage

### Basic Translation & Interpolation

In a standalone Svelte app, `App.svelte` loads the catalog and renders a child inside `SveltextRoot`:

```svelte
<script lang="ts">
	import { SveltextRoot } from 'sveltext';
	import Greeting from './Greeting.svelte';
</script>

{#await import('./locales/en.po') then catalog}
	<SveltextRoot locale="en" messages={catalog.messages}>
		<Greeting />
	</SveltextRoot>
{/await}
```

Put calls to `t` in `Greeting.svelte`, which renders beneath the root. In SvelteKit, put `SveltextRoot` in [`+layout.svelte`](https://github.com/raycnwong/sveltext/blob/main/examples/ssr/src/routes/+layout.svelte) and use this child code in `+page.svelte` instead:

```svelte
<script lang="ts">
	import { t } from 'sveltext';
	let name = 'John Doe';
</script>

<h1>{t`Welcome back, ${name}!`}</h1>
```

### Lazy Translations (Outside Components)

Sometimes you need to define translated text outside of Svelte's render cycle, such as in Zod schemas, navigation arrays, or constant files.

The `t` function is **not supported outside of a Svelte component**. Message catalogs are loaded inside the Svelte context to prevent [cross-request state pollution in SSR](https://svelte.dev/docs/kit/state-management#Avoid-shared-state-on-the-server), which means the active catalog is only available within the component tree. Outside of it, no catalog is accessible.

Instead, use the `msg` tag. It marks the string for the CLI extractor and compiles it to a hash, while **deferring** the actual dictionary lookup until render time inside a component.

```ts
// src/lib/helpers.ts
import { msg } from 'sveltext';

export const errors = {
	sync: msg`Error while syncing items`,
};
```

```svelte
<script lang="ts">
	import { t } from 'sveltext';
	import { errors } from '$lib/helpers';

	function goRefresh(success = true) {
		if (success) {
			itemCount = 1;
			alert(t`Refreshed`);
			return;
		}

		alert(t(errors.sync));
	}
</script>
```

If you truly need translation on the server outside the component tree, use the pure runtime function `_` and manually provide the message catalog (see the server code usage introduction).

### Plurals

`sveltext` catches missing plural categories at compile-time. If you forget any of the categories, the Vite build will fail and point you to the exact line.

```svelte
<script lang="ts">
	import { plural } from 'sveltext';
	let count = 5;
</script>

<p>
    {plural(count, {
        one: '# Apple',
        other: '# Apples',
    })}
    <!-- This will be inlined at compile time into the equivalent of t`5 Apples` -->
    {plural(5, {
        one: '# Apple',
        other: '# Apples',
    })}
</p>
```

### Context (Deduplication)

Because `sveltext` is content-addressed, having the same `Home` t call 50 times in your app will only generate one entry in your dictionary. If you need the same word translated differently based on context, use the `c()` wrapper.

```svelte
<script lang="ts">
	import { c, t } from 'sveltext';
</script>

<h1>{t`Home`}</h1>

<p>{c('real_estate').t`Home`}</p>
```

### The `<T>` Component (Rich Text & Snippets)

`sveltext` embraces Svelte 5's native `{#snippet}` architecture to translate strings with embedded HTML or components (like bold text or links).

Use the `<T>` component to interpolate rich UI elements without breaking the sentence structure for your translators.

```svelte
<script lang="ts">
  import { T, msg } from 'sveltext';
</script>

<T msg={msg`Toolbar: {refresh} {refreshFail}`}>
    {#snippet refresh()}
        <button type="button" onclick={() => goRefresh(true)}>
            {t`Refresh`}
        </button>
    {/snippet}

    {#snippet refreshFail()}
        <button type="button" onclick={() => goRefresh(false)}>
            {t`Refresh (fail)`}
        </button>
    {/snippet}
</T>
```

_Because `sveltext` is Svelte 5 native, your interpolated snippets can contain fully interactive components, state bindings, or any complex UI you need._

### Using the pure runtime function `_` on the server

To use Sveltext while remaining safe from cross-request state pollution, use the pure runtime function `_` and manually load and pass the message catalog when performing server-side actions.

```ts
import { msg, _ } from 'sveltext';
import type { MessageCatalog } from 'sveltext';
import type { Actions } from './$types';

const catalogLoaders = import.meta.glob<MessageCatalog>('../locales/*.po', { import: 'messages' });

export const actions = {
	sendEmail: async (event) => {
		const {
			locals: { currentLocale },
		} = event;
		const messages = await catalogLoaders[`../locales/${currentLocale}.po`]();
		const sveltextContext = { locale: currentLocale, messages };
		const name = 'John';
		const title = _(msg`Test Email to ${name}`, sveltextContext);
		const body = _(msg`Hello ${name} from SvelteKit form actions!`, sveltextContext);
		console.log(
			`Sending email to the user with ${currentLocale}:\n\nTitle: ${title}\nBody: ${body}`,
		);
	},
} satisfies Actions;
```

## 🛠️ The CLI Extractor

Run the extraction script to scan your codebase for translatable messages.

```sh
npx sveltext extract
```

- **Safe merging**: New messages are safely merged into your existing .po catalogs.
- **Dead code cleanup**: Unused translations are automatically marked as obsolete and excluded from the bundle.

## Acknowledgement

The API design and AOT-compilation philosophy were heavily inspired by [Lingui](https://lingui.dev/), [svelte-i18n-lingui](https://github.com/HenryLie/svelte-i18n-lingui/) and [ttag](https://ttag.js.org/). `sveltext` is a ground-up rewrite specifically designed to lerverage the Svelte 5 compiler and Vite ecosystem for zero-overhead integration.

## License

[MIT](https://github.com/raycnwong/sveltext/blob/main/LICENSE)
