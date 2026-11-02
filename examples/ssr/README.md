# Sveltext SvelteKit SSR example

Demonstrates English, Japanese, and Traditional Chinese translations, plurals,
interpolation, message composition, component snippets, and TypeScript helpers.

The server hook selects a locale from the cookie or `Accept-Language` header and
uses `withSveltext` to keep translations scoped to the request. The layout loads
the catalog and provides it to `SveltextRoot` for hydration and client navigation.
Language switching uses a form action.

The home page demonstrates translated form validation with Zod and Superforms on
both the client and server, including submissions without JavaScript. The email
action logs translated subject and body text in the server console.

## Run

From the repository root, using Node.js 22.17+ and the pinned pnpm version:

```sh
pnpm install
pnpm --filter sveltext-ssr-example dev
pnpm --filter sveltext-ssr-example check
pnpm --filter sveltext-ssr-example build
pnpm --filter sveltext-ssr-example preview
```

After adding or changing messages, update the catalogs with:

```sh
pnpm --filter sveltext-ssr-example extract
```

The shared browser suite covers all three examples; run it with `pnpm test` from
the repository root.

## Template

Regenerated from the [Svelte CLI minimal TypeScript template](https://svelte.dev/docs/cli/sv-create) with:

```sh
npx sv@1.2.0 create ssr --template minimal --types ts --no-add-ons --no-install
```

The demo adds the Sveltext Vite plugin, `sveltext.config.js`, locale catalogs,
`SveltextRoot`, Zod, and Superforms. Both SvelteKit examples use the Node
adapter for production builds. SvelteKit configuration lives in `vite.config.ts`,
and local library imports use `#lib/*`.

Starter pages, logos, styles, and optional lint/format tooling are omitted so the
example contains only the app setup and demo code.
