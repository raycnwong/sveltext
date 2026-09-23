import assert from 'node:assert/strict';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { build } from 'vite';

test('build fails when a required plural category is missing', async () => {
	const fixture = fileURLToPath(new URL('./fixtures/missing-plural-category/', import.meta.url));
	const originalCwd = process.cwd();
	try {
		process.chdir(fixture);
		await assert.rejects(
			build({
				root: fixture,
				logLevel: 'silent',
				build: { write: false },
			}),
			(error) => {
				assert.match(error.message, /Missing required plural category 'other'/);
				assert.match(error.message, /The required plural categories are one, other/);
				return true;
			},
		);
	} finally {
		process.chdir(originalCwd);
	}
});
