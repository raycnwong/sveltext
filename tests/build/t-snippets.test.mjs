import assert from 'node:assert/strict';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { compile } from 'svelte/compiler';
import { build } from 'vite';

for (const [scenario, diagnostic] of [
	['missing-snippet', "sveltext: Missing snippet 'refreshFail'."],
	['unexpected-snippet', "sveltext: Unexpected snippet 'refreshFailed'."],
	['unnamed-content', 'sveltext: Unnamed content inside <T>; declare a named snippet.'],
]) {
	test(`build fails for ${scenario}`, async () => {
		const fixture = fileURLToPath(new URL(`./fixtures/${scenario}/`, import.meta.url));
		const originalCwd = process.cwd();
		try {
			process.chdir(fixture);
			await assert.rejects(
				build({ root: fixture, logLevel: 'silent', build: { write: false } }),
				(error) => {
					assert.ok(error.message.includes(diagnostic), error.message);
					return true;
				},
			);
		} finally {
			process.chdir(originalCwd);
		}
	});
}

test('build accepts named snippets, interpolated arguments, context, comments and whitespace', async () => {
	const fixture = fileURLToPath(new URL('./fixtures/valid-snippets/', import.meta.url));
	const originalCwd = process.cwd();
	try {
		process.chdir(fixture);
		await build({
			root: fixture,
			logLevel: 'silent',
			build: { write: false },
			plugins: [
				{
					name: 'compile-svelte-fixture',
					transform(code, id) {
						if (id.endsWith('.svelte')) {
							return compile(code, { filename: id }).js;
						}
					},
				},
			],
		});
	} finally {
		process.chdir(originalCwd);
	}
});
