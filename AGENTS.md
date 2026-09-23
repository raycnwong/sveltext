# Testing rules

- The shared Playwright suite runs against the SvelteKit SSR, SvelteKit SPA, and Vite standalone environments simultaneously through `tests/playwright.config.ts`.
- Use the Page Object Model (POM) for all DOM interactions in tests.
- Use `data-testid` for every DOM locator.
- Never write environment-specific test files. When an environment needs different handling, keep it in the shared test block and use `test.skip(test.info().project.name === 'spa')` as needed.

## Build tests

- Test build-time plugin behavior in `tests/build/*.test.mjs` with `node:test` and Vite's `build()` API. Run these tests with `pnpm test:build`; `pnpm test` runs them before Playwright.
- Keep each build scenario's minimal Vite app and catalogs in `tests/build/fixtures/<scenario>/`. Run the build with that fixture as both the working directory and Vite root so `sveltext.config.js` and its catalog paths resolve correctly.
- Use `build: { write: false }` when checking build failures, and assert the specific diagnostic so unrelated build errors cannot pass the test.
