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
	let app;
	await t.test(
		'build reuses plural formatters and categories across TypeScript and Svelte',
		async (t) => {
			const pluralRulesLocales = [];
			const numberFormatLocales = [];
			for (const [name, locales] of [
				['PluralRules', pluralRulesLocales],
				['NumberFormat', numberFormatLocales],
			]) {
				t.mock.method(
					Intl,
					name,
					new Proxy(Intl[name], {
						construct(target, args) {
							locales.push(args[0]);
							return Reflect.construct(target, args);
						},
					}),
				);
			}
			const resolvedOptions = t.mock.method(Intl.PluralRules.prototype, 'resolvedOptions');

			app = await buildFixture();

			// Config validation constructs one instance per locale; compilation needs one more.
			assert.deepEqual(pluralRulesLocales, ['en', 'ja', 'en']);
			assert.deepEqual(numberFormatLocales, ['en']);
			assert.equal(resolvedOptions.mock.callCount(), 1);
		},
	);
	const cases = {
		en: [
			[0, '0 items'],
			[1, '1 item'],
			[2, '2 items'],
			[10, '10 items'],
			[999, '999 items'],
			[1000, '1,000 items'],
			[1000000, '1,000,000 items'],
			[1000.5, '1,000.5 items'],
			[-1000, '-1,000 items'],
		],
		ja: [
			[0, '0個のアイテム'],
			[1, '1個のアイテム'],
			[2, '2個のアイテム'],
			[10, '10個のアイテム'],
			[999, '999個のアイテム'],
			[1000, '1,000個のアイテム'],
			[1000000, '1,000,000個のアイテム'],
			[1000.5, '1,000.5個のアイテム'],
			[-1000, '-1,000個のアイテム'],
		],
	};

	await t.test('reuses plural rules and number formats per locale across contexts', (t) => {
		const pluralRulesLocales = [];
		const numberFormatLocales = [];
		for (const [name, locales] of [
			['PluralRules', pluralRulesLocales],
			['NumberFormat', numberFormatLocales],
		]) {
			t.mock.method(
				Intl,
				name,
				new Proxy(Intl[name], {
					construct(target, args) {
						locales.push(args[0]);
						return Reflect.construct(target, args);
					},
				}),
			);
		}

		for (const locale of ['en', 'de', 'ja', 'en', 'ja', 'de']) {
			const context = { locale, messages: app[locale] ?? app.en };
			const translate = (count) => app.withSveltext(context, () => app.callLabel(() => count));
			assert.equal(translate(1), locale === 'ja' ? '1個のアイテム' : '1 item');
			assert.equal(
				translate(1000.5),
				locale === 'ja'
					? '1,000.5個のアイテム'
					: locale === 'de'
						? '1.000,5 items'
						: '1,000.5 items',
			);
		}

		assert.deepEqual(pluralRulesLocales, ['en', 'de', 'ja']);
		assert.deepEqual(numberFormatLocales, ['en', 'de', 'ja']);
	});

	await t.test('formats using the active locale', () => {
		const context = { locale: 'de', messages: app.en };
		assert.equal(
			app.withSveltext(context, () => app.callLabel(() => 1000.5)),
			'1.000,5 items',
		);
	});

	for (const [locale, countCases] of Object.entries(cases)) {
		const context = { locale, messages: app[locale] };
		const translate = (callback) => app.withSveltext(context, callback);

		await t.test(locale, async (t) => {
			await t.test('inlines formatted literal counts into the same messages as t templates', () => {
				const expected =
					locale === 'ja'
						? ['1,000個のアイテム', '1,000.5個のアイテム（合計1,000.5）']
						: ['1,000 items', '1,000.5 items (1,000.5 total)'];

				assert.deepEqual(translate(app.literalLabels), expected);
				assert.deepEqual(translate(app.literalLabels), translate(app.literalTemplateLabels));
			});

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
