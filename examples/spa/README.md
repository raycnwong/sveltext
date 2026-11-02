# Sveltext SvelteKit SPA example

Demonstrates English, Japanese, and Traditional Chinese translations, plurals,
interpolation, message composition, component snippets, and TypeScript helpers.

The root layout disables SSR with `ssr = false`. The browser chooses a locale
from local storage or its preferred languages, loads the catalog, and passes it
to `SveltextRoot`. Language switching stores the selection and refreshes the layout.

The home page demonstrates translated Zod validation with Superforms in SPA mode.
Validation runs entirely in the browser without server actions.

## Run

From the repository root, using Node.js 22.17+ and the pinned pnpm version:

```sh
pnpm install
pnpm --filter sveltext-spa-example dev
pnpm --filter sveltext-spa-example check
pnpm --filter sveltext-spa-example build
pnpm --filter sveltext-spa-example preview
```

After adding or changing messages, update the catalogs with:

```sh
pnpm --filter sveltext-spa-example extract
```

The shared browser suite covers all three examples; run it with `pnpm test` from
the repository root.

## Template

Regenerated from the [Svelte CLI minimal TypeScript template](https://svelte.dev/docs/cli/sv-create) with:

```sh
npx sv@1.2.0 create spa --template minimal --types ts --no-add-ons --no-install
```

The demo adds the Sveltext Vite plugin, `sveltext.config.js`, locale catalogs,
`SveltextRoot`, Zod, and Superforms. Both SvelteKit examples use the Node
adapter for production builds. SvelteKit configuration lives in `vite.config.ts`,
and local library imports use `#lib/*`.

Starter pages, logos, styles, and optional lint/format tooling are omitted so the
example contains only the app setup and demo code.
