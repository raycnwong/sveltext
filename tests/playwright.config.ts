import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
	testDir: './e2e',
	fullyParallel: true,
	webServer: [
		{
			command: 'pnpm --filter sveltext-ssr-example dev --port 5173',
			url: 'http://localhost:5173',
			reuseExistingServer: !process.env.CI,
		},
		{
			command: 'pnpm --filter sveltext-spa-example dev --port 5174',
			url: 'http://localhost:5174',
			reuseExistingServer: !process.env.CI,
		},
		{
			command: 'pnpm --filter sveltext-svelte-example dev --port 5175',
			url: 'http://localhost:5175',
			reuseExistingServer: !process.env.CI,
		},
	],
	projects: [
		{ name: 'ssr', use: { ...devices['Desktop Chrome'], baseURL: 'http://localhost:5173' } },
		{ name: 'spa', use: { ...devices['Desktop Chrome'], baseURL: 'http://localhost:5174' } },
		{ name: 'svelte', use: { ...devices['Desktop Chrome'], baseURL: 'http://localhost:5175' } },
	],
});
