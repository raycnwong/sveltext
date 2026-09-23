# Testing rules

- The shared Playwright suite runs against the SvelteKit SSR, SvelteKit SPA, and Vite standalone environments simultaneously through `tests/playwright.config.ts`.
- Use the Page Object Model (POM) for all DOM interactions in tests.
- Use `data-testid` for every DOM locator.
- Never write environment-specific test files. When an environment needs different handling, keep it in the shared test block and use `test.skip(test.info().project.name === 'spa')` as needed.
