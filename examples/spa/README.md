# sv

Everything you need to build a Svelte project, powered by [`sv`](https://github.com/sveltejs/cli).

## Creating a project

If you're seeing this, you've probably already done this step. Congrats!

```sh
# create a new project
npx sv create my-app
```

To recreate this project with the same configuration:

```sh
# recreate this project
pnpm dlx sv create --template minimal --types ts --add eslint prettier --install pnpm basic
```

## Developing

Once you've created a project and installed dependencies with `npm install` (or `pnpm install` or `yarn`), start a development server:

```sh
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

## Building

To create a production version of your app:

```sh
npm run build
```

You can preview the production build with `npm run preview`.

> To deploy your app, you may need to install an [adapter](https://svelte.dev/docs/kit/adapters) for your target environment.

## Translated validation example

The home page includes a text field that accepts 1–6 characters. Superforms runs in SPA mode and validates the form in the browser without a server action.

`src/lib/schema.ts` defines the validation errors with `msg` inside the Zod schema. The form renders them with `t(error)`, translating the stored message descriptors in the active locale. English, Japanese, and Traditional Chinese catalogs include the form labels and validation messages.
