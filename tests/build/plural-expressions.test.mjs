import assert from 'node:assert/strict';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { compile } from 'svelte/compiler';
import { build } from 'vite';

async function buildFixture() {
	const fixture = fileURLToPath(new URL('./fixtures/plural-expressions/', import.meta.url));
	const originalCwd = process.cwd();
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
		return await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`);
	} finally {
		process.chdir(originalCwd);
	}
}

test('plural count expressions compile in TypeScript and nested Svelte translations', async (t) => {
	const app = await buildFixture();
	const cases = {
		en: [
			[0, '0 items'],
			[1, '1 item'],
			[2, '2 items'],
			[10, '10 items'],
		],
		ja: [
			[0, '0個のアイテム'],
			[1, '1個のアイテム'],
			[2, '2個のアイテム'],
			[10, '10個のアイテム'],
		],
	};

	for (const [locale, countCases] of Object.entries(cases)) {
		const context = { locale, messages: app[locale] };
		const translate = (callback) => app.withSveltext(context, callback);

		await t.test(locale, async (t) => {
			for (const [name, label] of [
				['member access', app.memberLabel],
				['computed access', app.computedLabel],
			]) {
				await t.test(`${name} reads the count once`, () => {
					for (const [count, expected] of countCases) {
						let reads = 0;
						const response = {
							data: {
								item: {
									get count() {
										reads++;
										return count;
									},
								},
							},
						};

						const actual = translate(() => label(response));

						assert.equal(actual, expected);
						assert.equal(reads, 1, 'the count must be read once');
					}
				});
			}

			await t.test('count + 1 uses the computed count', () => {
				for (const [count, expected] of countCases) {
					const actual = translate(() => app.expressionLabel(count - 1));

					assert.equal(actual, expected);
				}
			});

			await t.test('getCount() uses the return value and runs once', () => {
				for (const [count, expected] of countCases) {
					let calls = 0;
					const getCount = () => {
						calls++;
						return count;
					};

					const actual = translate(() => app.callLabel(getCount));

					assert.equal(actual, expected);
					assert.equal(calls, 1, 'getCount() must be called once');
				}
			});

			await t.test('response?.count ?? 0 reads a present count once', () => {
				for (const [count, expected] of countCases) {
					let reads = 0;
					const response = {
						get count() {
							reads++;
							return count;
						},
					};

					const actual = translate(() => app.optionalLabel(response));

					assert.equal(actual, expected);
					assert.equal(reads, 1, 'the optional count must be read once');
				}
			});

			await t.test('response?.count ?? 0 defaults missing or null counts to zero', () => {
				const expected = locale === 'ja' ? '0個のアイテム' : '0 items';
				const responses = [undefined, null, {}, { count: undefined }, { count: null }];

				for (const response of responses) {
					const actual = translate(() => app.optionalLabel(response));

					assert.equal(actual, expected);
				}
			});

			await t.test('renders nested Svelte translations', () => {
				for (const [count, label] of countCases) {
					const response = { data: { item: { count } } };
					const html = translate(() => app.renderSummary(response));
					const actual = html.replace(/<!--[\s\S]*?-->/g, '');
					const expected =
						locale === 'ja'
							? `<p>${label}（${label}）あります。</p>`
							: `<p>You have ${label} (${label}).</p>`;

					assert.equal(actual, expected);
				}
			});
		});
	}
});
