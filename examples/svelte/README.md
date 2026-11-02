# Sveltext Svelte + Vite example

Demonstrates English, Japanese, and Traditional Chinese translations, plurals,
interpolation, message composition, component snippets, and TypeScript helpers.

`src/App.svelte` loads the selected locale's catalog and passes it to
`SveltextRoot`. Language switching runs entirely in the browser.

The home page demonstrates translated form validation directly with Zod, without
SvelteKit or Superforms.

## Run

From the repository root, using Node.js 22.17+ and the pinned pnpm version:

```sh
pnpm install
pnpm --filter sveltext-svelte-example dev
pnpm --filter sveltext-svelte-example check
pnpm --filter sveltext-svelte-example build
pnpm --filter sveltext-svelte-example preview
```

After adding or changing messages, update the catalogs with:

```sh
pnpm --filter sveltext-svelte-example extract
```

The shared browser suite covers all three examples; run it with `pnpm test` from
the repository root.

## Template

Regenerated from the [Vite Svelte TypeScript template](https://vite.dev/guide/#scaffolding-your-first-vite-project) with:

```sh
npm create vite@9.3.3 svelte -- --template svelte-ts --no-interactive
```

The demo adds the Sveltext Vite plugin, `sveltext.config.js`, locale catalogs,
`SveltextRoot`, and Zod.

Starter pages, logos, styles, and optional lint/format tooling are omitted so the
example contains only the app setup and demo code.
