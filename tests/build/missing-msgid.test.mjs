import assert from 'node:assert/strict';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { build } from 'vite';

test('build fails when a message is missing from the catalog', async () => {
	const fixture = fileURLToPath(new URL('./fixtures/missing-msgid/', import.meta.url));
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
				assert.match(error.message, /Message "Missing from catalog" is missing from en\.po/);
				assert.match(error.message, /Please run the extraction script before building/);
				return true;
			},
		);
	} finally {
		process.chdir(originalCwd);
	}
});
