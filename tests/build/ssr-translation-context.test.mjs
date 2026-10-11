import assert from 'node:assert/strict';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { compile } from 'svelte/compiler';
import { build } from 'vite';

test('compiled component and TypeScript translations share isolated server contexts', async () => {
	const fixture = fileURLToPath(new URL('./fixtures/ts-translations/', import.meta.url));
	const originalCwd = process.cwd();
	let app;
	try {
		process.chdir(fixture);
		const result = await build({
			root: fixture,
			logLevel: 'silent',
			ssr: { noExternal: true },
			build: { write: false, ssr: 'src/main.ts' },
			plugins: [
				{
					name: 'compile-svelte-fixture',
					transform(code, id) {
						if (id.endsWith('.svelte')) {
							return compile(code, { filename: id, generate: 'server' }).js;
						}
					},
				},
			],
		});
		const output = (Array.isArray(result) ? result[0] : result).output;
		const code = output.find((item) => item.type === 'chunk' && item.isEntry).code;
		app = await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`);
	} finally {
		process.chdir(originalCwd);
	}

	const en = { locale: 'en', messages: app.en };
	const ja = { locale: 'ja', messages: app.ja };
	const noContext = /sveltext: No translation context for `t\(\)`/;
	assert.throws(() => app.formatStatus(), noContext);
	assert.throws(() => app.renderTranslations(en), noContext);

	// Browser roots do not override the request's translation scope during SSR.
	const englishHtml = app.withSveltext(en, () => app.renderTranslations(ja));
	assert.match(englishHtml, /<p>Active<\/p>/);
	assert.match(englishHtml, /Hello .*<b>Ray<\/b>.*!/);
	assert.match(englishHtml, /<span>New<\/span>/);
	assert.match(englishHtml, /<span>2 items<\/span>/);
	const japaneseHtml = app.withSveltext(ja, () => app.renderTranslations(en));
	assert.match(japaneseHtml, /<p>有効<\/p>/);
	assert.match(japaneseHtml, /こんにちは、.*<b>Ray<\/b>.*さん！/);
	assert.match(japaneseHtml, /<span>新着<\/span>/);
	assert.match(japaneseHtml, /<span>2個のアイテム<\/span>/);

	assert.equal(
		app.withSveltext(ja, () => app.shadowedTranslation('Status')),
		'Status: 有効',
	);

	let release;
	const wait = new Promise((resolve) => {
		release = resolve;
	});
	const english = app.withSveltext(en, () => app.validate('', wait));
	const japanese = app.withSveltext(ja, () => app.validate('', wait));
	const renders = [en, ja].map((context) =>
		app.withSveltext(context, async () => {
			await wait;
			return app.renderTranslations(context);
		}),
	);
	assert.throws(() => app.formatStatus(), noContext);
	release();
	assert.deepEqual(await Promise.all([english, japanese]), ['Required', '必須']);
	assert.deepEqual(await Promise.all(renders), [englishHtml, japaneseHtml]);

	await app.withSveltext(en, async () => {
		await app.withSveltext(ja, async () => {
			await Promise.resolve();
			assert.equal(app.formatStatus(), '有効');
		});
		assert.equal(app.formatStatus(), 'Active');
		assert.throws(
			() =>
				app.withSveltext(ja, () => {
					throw new Error('failed');
				}),
			/failed/,
		);
		assert.equal(app.formatStatus(), 'Active');
	});
	await assert.rejects(
		app.withSveltext(ja, async () => {
			await Promise.resolve();
			throw new Error('async failure');
		}),
		/async failure/,
	);
	assert.throws(() => app.formatStatus(), noContext);
});
