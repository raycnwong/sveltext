# Getting started

This guide adds `sveltext` to an existing Svelte 5 app using Vite. It covers SvelteKit with server-side rendering (SSR), SvelteKit in SPA mode, and standalone Svelte.

Use Node.js 22.12 or newer to run the commands in this guide. The extractor uses `fs.promises.glob`, which requires Node.js 22 or newer; your app's Vite version also determines its minimum Node.js version.

The setup has two parts: the Vite plugin compiles translation calls and PO catalogs, and your app chooses a locale, loads its catalog, and initializes the translation context.

The examples show minimal files. When a file already exists, merge the new imports, fields, and wrappers into it, preserving your app's logic, settings, and exports. In particular, keep existing load return values and layout content when adding translations.

## 1. Install and configure sveltext

From your app's root directory, install the package:

```sh
npm install -D sveltext
```

Create `sveltext.config.js` alongside `package.json`:

```js
export default {
	locales: ['en', 'zh-HK'],
	sourceLocale: 'en',
	catalog: {
		path: 'src/locales',
		include: ['src'],
	},
};
```

`locales` lists the supported language tags, and `sourceLocale` is the language used in your source messages. It must appear in `locales`. `catalog.path` is the directory containing your PO files; `catalog.include` lists the source directories to scan for messages. Paths resolve from the app's root directory, where you run Vite and the extraction command.

## 2. Create the catalogs

Create `src/locales/en.po` and `src/locales/zh-HK.po`. Every configured locale needs a file, including the source locale.

Start `src/locales/en.po` with:

```po
msgid ""
msgstr ""
"Content-Type: text/plain; charset=utf-8\n"
"Language: en\n"
```

Use the same header in `src/locales/zh-HK.po`, changing `Language: en` to `Language: zh-HK`.

Each PO entry has a `msgid` containing the source message and a `msgstr` containing its translation. An empty `msgstr` falls back to `msgid`.

The extractor updates existing catalogs; it does not create missing files. You'll add messages and run extraction in [step 5](#5-write-and-extract-your-first-message).

## 3. Add the Vite plugin

For either SvelteKit rendering mode, add `sveltext()` to your existing `vite.config.ts`:

```ts
import { sveltekit } from '@sveltejs/kit/vite';
import { sveltext } from 'sveltext/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit(), sveltext()],
});
```

For standalone Svelte, use the Svelte Vite plugin instead:

```ts
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { sveltext } from 'sveltext/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [svelte(), sveltext()],
});
```

Keep any other plugins and settings your app already uses.

## 4. Initialize translations for your rendering mode

First, create `src/lib/i18n.ts`. All three setups below use this catalog loader. Locale detection belongs to the rendering mode you choose:

```ts
import type { MessageCatalog } from 'sveltext';

const catalogLoaders = import.meta.glob<MessageCatalog>('../locales/*.po', {
	import: 'messages',
});

export function loadMessageCatalog(locale: string) {
	return catalogLoaders[`../locales/${locale}.po`]();
}
```

Choose one setup:

- [SvelteKit with SSR](#sveltekit-with-ssr)
- [SvelteKit in SPA mode](#sveltekit-in-spa-mode)
- [Standalone Svelte](#standalone-svelte)

### SvelteKit with SSR

SSR needs a translation scope for each request, plus a browser catalog for hydration. The server entry uses `node:async_hooks` and `AsyncLocalStorage`, so your deployment runtime must support them. Keep imports from `sveltext/server` in server-only files.

**Declare the request locale in `src/app.d.ts`.** Add `currentLocale` to your existing `App.Locals` interface:

```ts
declare global {
	namespace App {
		interface Locals {
			currentLocale: string;
		}
	}
}

export {};
```

**Initialize the server scope in `src/hooks.server.ts`.** The server can read the request's `Accept-Language` header. This example uses the `currentLocale` cookie when present, otherwise the header:

```ts
import type { Handle } from '@sveltejs/kit';
import { withSveltext } from 'sveltext/server';
import { loadMessageCatalog } from '$lib/i18n';

const supportedLocales = ['en', 'zh-HK'];

function matchLocale(hint: string | null) {
	const language = hint?.split(',')[0].split(';')[0].trim().toLowerCase();

	return (
		supportedLocales.find((locale) => locale.toLowerCase() === language) ??
		supportedLocales.find((locale) => locale === language?.split('-')[0]) ??
		'en'
	);
}

export const handle: Handle = async ({ event, resolve }) => {
	const currentLocale = matchLocale(
		event.cookies.get('currentLocale') ?? event.request.headers.get('accept-language'),
	);
	const messages = await loadMessageCatalog(currentLocale);

	event.locals.currentLocale = currentLocale;

	return withSveltext({ locale: currentLocale, messages }, () =>
		resolve(event, {
			transformPageChunk: ({ html }) => html.replace('%lang%', currentLocale),
		}),
	);
};
```

Keep `supportedLocales` in sync with your config. This simple matcher matches `zh-HK` case-insensitively, maps regional English tags such as `en-US` to `en`, and falls back to English for unsupported values. For an `Accept-Language` header, it checks only the first language; it does not rank the full list by quality values.

If you already have a server hook, add locale detection and catalog loading to it, then wrap its request resolution in `withSveltext`. Preserve existing hook logic and `resolve` options; if you already use `transformPageChunk`, add the `%lang%` replacement to that transform. The scope lets components, server load functions, actions, and TypeScript helpers use `t` with the request's locale, including after `await`.

In `src/app.html`, change only the opening HTML tag to match the placeholder used by the hook, keeping its existing attributes and the rest of the template:

```diff
-<html lang="en">
+<html lang="%lang%">
```

**Return the locale from `src/routes/+layout.server.ts`:**

```ts
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = ({ locals }) => ({
	currentLocale: locals.currentLocale,
});
```

**Load the catalog in `src/routes/+layout.ts`:**

```ts
import type { LayoutLoad } from './$types';
import { loadMessageCatalog } from '$lib/i18n';

export const load: LayoutLoad = async ({ data }) => ({
	currentLocale: data.currentLocale,
	messages: await loadMessageCatalog(data.currentLocale),
});
```

In this example, the server load returns only the locale. The universal load imports the catalog on both the server and the browser, keeping the catalog out of SvelteKit's serialized server load data. If either file already has a `load` function, add these fields to its existing return value: `currentLocale` in the server load, and `currentLocale` plus `messages` in the universal load. Preserve other exports, such as `prerender` or `trailingSlash`, according to your app's needs.

Continue with the [shared SvelteKit root layout](#shared-sveltekit-root-layout).

### SvelteKit in SPA mode

In SPA mode, detect the locale from `localStorage` and `navigator.language`. The browser does not expose the outgoing `Accept-Language` request header to your app. Append these browser helpers to `src/lib/i18n.ts`:

```ts
const supportedLocales = ['en', 'zh-HK'];

function matchLocale(locale: string) {
	const language = locale.trim().toLowerCase();

	return (
		supportedLocales.find((supported) => supported.toLowerCase() === language) ??
		supportedLocales.find((supported) => supported === language.split('-')[0]) ??
		'en'
	);
}

export function getCurrentLocale() {
	return matchLocale(localStorage.getItem('currentLocale') ?? navigator.language);
}

export function setCurrentLocale(locale: string) {
	localStorage.setItem('currentLocale', matchLocale(locale));
}
```

They use the saved preference when available, otherwise the browser's preferred language. Keep `supportedLocales` in sync with your config. The matcher matches `zh-HK` case-insensitively, maps regional English tags such as `en-US` to `en`, and falls back to English for unsupported values.

In `src/routes/+layout.ts`, disable SSR and load the selected catalog:

```ts
import type { LayoutLoad } from './$types';
import { getCurrentLocale, loadMessageCatalog } from '$lib/i18n';

export const ssr = false;

export const load: LayoutLoad = async () => {
	const currentLocale = getCurrentLocale();

	return {
		currentLocale,
		messages: await loadMessageCatalog(currentLocale),
	};
};
```

Disabling SSR allows the load function to use browser APIs such as `localStorage` and `navigator`. If this file already has a `load` function, add locale detection and catalog loading to it, and include `currentLocale` and `messages` alongside its existing return values. Keep the file's other exports.

Continue with the shared root layout below.

### Shared SvelteKit root layout

Both SvelteKit setups use the same `src/routes/+layout.svelte`:

```svelte
<script lang="ts">
	import { SveltextRoot } from 'sveltext';

	let { data, children } = $props();
</script>

{#key data.currentLocale}
	<SveltextRoot locale={data.currentLocale} messages={data.messages}>
		{@render children()}
	</SveltextRoot>
{/key}
```

For an existing layout, keep its script logic, styles, and markup. Add the `SveltextRoot` import and use the `{#key}` block and root to wrap your existing content, including `{@render children()}`. Place shared UI components, such as your header and footer, inside `SveltextRoot` too. The `{#key}` block recreates the root and its children when the locale changes, so their initial translated values are recomputed. It also resets local component state.

`SveltextRoot` initializes the browser catalog and updates the document's `lang` attribute. Server rendering uses the scope established by `withSveltext`; the root does not initialize server state.

Continue with [your first message](#5-write-and-extract-your-first-message).

### Standalone Svelte

In `src/App.svelte`, load a catalog before rendering your app inside `SveltextRoot`:

```svelte
<script lang="ts">
	import { SveltextRoot } from 'sveltext';
	import { loadMessageCatalog } from './lib/i18n';
	import Greeting from './Greeting.svelte';

	let currentLocale = $state('en');
</script>

{#key currentLocale}
	{#await loadMessageCatalog(currentLocale) then messages}
		<SveltextRoot locale={currentLocale} {messages}>
			<button onclick={() => (currentLocale = currentLocale === 'en' ? 'zh-HK' : 'en')}>
				{currentLocale === 'en' ? '繁體中文（香港）' : 'English'}
			</button>
			<Greeting />
		</SveltextRoot>
	{/await}
{/key}
```

This starts in English and loads the Chinese catalog when the button is clicked. The `{#key}` block recreates the app's children for the new locale and resets their local state. `SveltextRoot` also updates the document's `lang` attribute.

For an existing app, preserve its script logic and styles, and wrap its existing child components inside `SveltextRoot` as shown above. Create `Greeting.svelte` in the next step.

## 5. Write and extract your first message

Use `t` in a component rendered beneath `SveltextRoot`. For SvelteKit, add the import and heading below to `src/routes/+page.svelte`, keeping its existing content; for standalone Svelte, create `src/Greeting.svelte`:

```svelte
<script lang="ts">
	import { t } from 'sveltext';
</script>

<h1>{t`Welcome`}</h1>
```

Run extraction from the app's root directory:

```sh
npx sveltext extract
```

The extractor scans `.svelte`, `.ts`, and `.js` files in the configured source directories and merges messages into your catalogs. It preserves existing translations and marks unused messages as obsolete.

In `src/locales/zh-HK.po`, translate the new entry:

```po
msgid "Welcome"
msgstr "歡迎"
```

Leave `msgstr` empty in `en.po` to use the source text. Empty translations in other catalogs also fall back to their `msgid`.

Run your app's development command and select Chinese to see `歡迎`. See [step 6](#6-change-locales-and-use-translations-elsewhere) for changing locales in SvelteKit; the standalone example includes a switch button.

Rerun extraction whenever you add or change messages, and before a production build. Builds require every source message to appear in every configured catalog, even if its translation is empty.

<details>
<summary>How sveltext uses PO files: placeholders, plurals, and headers</summary>

Sveltext uses PO as a minimal container for source messages and translations. An optional `msgctxt` distinguishes messages with the same source text but different translation contexts.

Message contents use ICU syntax for placeholders and plurals. For example, a Chinese catalog can contain:

```po
msgid "Hello {name}!"
msgstr "哈佬 {name}！"

msgid "{count, plural, one {# item} other {# items}}"
msgstr "{count, plural, other {# 個項目}}"
```

Plural translations live in a single `msgstr`. Sveltext does not use Gettext's `msgid_plural`, indexed `msgstr[n]` entries, or the `Plural-Forms` header to select plural forms. It uses `Intl.PluralRules` with the active locale to select a category from the ICU message.

Headers such as `Plural-Forms`, project information, and translator details do not control Sveltext's translation runtime. Keep the `Content-Type` header for UTF-8 parsing and the `Language` header set to the catalog's language tag: the extractor uses `Language` to generate ICU plural categories for new entries. At runtime, the locale comes from your app's translation context, and the PO headers are not included in the compiled message catalog.

</details>

## 6. Change locales and use translations elsewhere

In SvelteKit, persist the new locale and rerun the root layout load so `data.currentLocale` and `data.messages` update together:

- **SSR:** Save a supported locale in the `currentLocale` cookie through a server action, then reload or invalidate the page data. The [SSR example](../examples/ssr/src/routes/Header.svelte) shows an enhanced form, with the cookie update in its [page action](../examples/ssr/src/routes/+page.server.ts).
- **SPA:** Call `setCurrentLocale(locale)`, then `await invalidateAll()` from `$app/navigation`. See the [SPA example](../examples/spa/src/routes/Header.svelte).
- **Standalone Svelte:** Update `currentLocale`, as shown in `App.svelte` above.

Components, `<T>`, and TypeScript helpers share the active translation context. In the browser, this is one app-wide catalog; nested roots use the most recently initialized catalog rather than providing separate locales.

Call `t` only after initialization. A layout's `<script>` runs before its `SveltextRoot` initializes the browser catalog, so put initial translated values in child components. For helpers, translate inside functions or validation callbacks. Use `msg` for module-level messages that need to be translated later. See [Translation in TypeScript Helpers and Schemas](../README.md#translation-in-typescript-helpers-and-schemas) and [Lazy Translations](../README.md#lazy-translations-module-level-constants).

For interpolation, plurals, context, and rich text, continue with the [usage guide](../README.md#-usage). Complete apps are available in [SvelteKit SSR](../examples/ssr), [SvelteKit SPA](../examples/spa), and [standalone Svelte](../examples/svelte).
