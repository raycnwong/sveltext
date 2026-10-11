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

### Translation in TypeScript Helpers and Schemas

Import `t` directly in `.ts` and `.js` files, and call it inside formatters or validation callbacks:

```ts
import { t } from 'sveltext';
import { z } from 'zod';

export function formatStatus(status: 'active' | 'pending') {
	return status === 'active' ? t`Active` : t`Pending`;
}

export const schema = z.string().superRefine((value, ctx) => {
	if (!value.trim()) {
		ctx.addIssue({ code: 'custom', message: t`Required` });
	}
});
```

Components, `<T>`, and TypeScript helpers all use the same translation context. In the browser, `SveltextRoot` initializes the app-wide catalog. Calls use the most recently initialized root's locale, including calls from other roots; nested roots do not provide separate locales. This setup assumes one active app-wide locale. When switching locales, recreate the root with `{#key currentLocale}`, as in the examples. Future calls translate using the new catalog; existing strings and validation errors need to be recomputed.

For SSR, initialize a translation scope once per request. This scope is required for component rendering as well as server helpers; `SveltextRoot` only initializes the browser catalog. In SvelteKit:

```ts
// src/hooks.server.ts
import type { Handle } from '@sveltejs/kit';
import { withSveltext } from 'sveltext/server';
import { loadMessageCatalog, matchLocale } from '$lib/i18n';

export const handle: Handle = async ({ event, resolve }) => {
	const locale = matchLocale(
		event.cookies.get('currentLocale') ?? event.request.headers.get('accept-language'),
	);
	const messages = await loadMessageCatalog(locale);
	return withSveltext({ locale, messages }, () => resolve(event));
};
```

Server helpers, load functions, actions, rendering, and asynchronous callbacks invoked inside this scope can import `t` directly. Each scope has its own locale/catalog, including across `await`. The server entry requires a runtime supporting `node:async_hooks` and `AsyncLocalStorage`; keep its import in server-only files. Background work can also use `withSveltext(context, callback)`, or the explicit `_` function below.

Calling imported `t` before browser initialization or outside a server translation scope throws an error. Avoid eagerly translated module-level constants such as `export const label = t\`Active\``: modules load before a user's locale is available, and those strings would not update when the locale changes. Shared schemas are fine when translation occurs inside their validation callbacks.

### Lazy Translations (Module-Level Constants)

Use `msg` for navigation arrays, constants, and other messages that should be translated later. It marks the string for extraction and compiles it to a descriptor, while deferring the dictionary lookup until `t` or `_` is called.

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

For translation with an explicit catalog, use the pure runtime function `_` (see [Using the pure runtime function `_` on the server](#using-the-pure-runtime-function-_-on-the-server)).

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

Use `_` when you want to choose the locale and message catalog for an individual translation. It accepts a message descriptor from `msg` and an explicit `{ locale, messages }` context. This is useful for background jobs or emails whose recipient's locale differs from the current request.

Server code inside a `withSveltext` scope can use `t` directly, with each request's context isolated across asynchronous work. Use `_` when passing the translation context explicitly suits your code.

For example, format a welcome email using the recipient's locale:

```ts
// src/lib/email.ts
import { msg, _ } from 'sveltext';
import type { MessageCatalog } from 'sveltext';

const catalogLoaders = import.meta.glob<MessageCatalog>('../locales/*.po', { import: 'messages' });

export async function createWelcomeEmail(name: string, locale: string) {
	const messages = await catalogLoaders[`../locales/${locale}.po`]();
	const context = { locale, messages };

	return {
		subject: _(msg`Welcome, ${name}!`, context),
		body: _(msg`Hello ${name}, thanks for joining us!`, context),
	};
}
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
