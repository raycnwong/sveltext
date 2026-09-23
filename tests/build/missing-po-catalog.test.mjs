import assert from 'node:assert/strict';
import { join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { build } from 'vite';

test('build fails when a configured locale has no PO catalog', async () => {
	const fixture = fileURLToPath(new URL('./fixtures/missing-po-catalog/', import.meta.url));
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
				assert.match(error.message, /Missing catalog file for locale "ja"/);
				assert.ok(error.message.includes(`Expected to find it at ${join('locales', 'ja.po')}`));
				assert.match(error.message, /Please ensure a \.po file is created for every configured locale/);
				return true;
			},
		);
	} finally {
		process.chdir(originalCwd);
	}
});
