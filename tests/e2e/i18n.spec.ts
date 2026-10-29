import { expect, test } from '@playwright/test';
import { HomePage } from '../pages/Home.page';

test('validates text length with messages defined in the Zod schema', async ({ page }) => {
	const home = new HomePage(page);
	await home.goto();
	await expect(home.validationErrors).toBeHidden();
	await expect(home.validationSuccess).toBeHidden();

	await home.validateText('');
	await expect(home.validationErrors).toHaveText('Enter at least 1 character.');
	await expect(home.validationText).toHaveAttribute('aria-invalid', 'true');
	await expect(home.validationSuccess).toBeHidden();

	await home.validateText('a');
	await expect(home.validationErrors).toBeHidden();
	await expect(home.validationSuccess).toHaveText('Text accepted.');

	await home.validateText('abcdef');
	await expect(home.validationErrors).toBeHidden();
	await expect(home.validationSuccess).toHaveText('Text accepted.');

	await home.validateText('abcdefg');
	await expect(home.validationErrors).toHaveText('Enter no more than 6 characters.');
	await expect(home.validationSuccess).toBeHidden();
});

test('interpolates Zod validation messages after switching locales', async ({ page }) => {
	const duplicateFormWarnings: string[] = [];
	page.on('console', (message) => {
		if (message.type() === 'warning' && message.text().includes('Duplicate form id')) {
			duplicateFormWarnings.push(message.text());
		}
	});
	const home = new HomePage(page);
	await home.goto();

	for (const [locale, required, tooLong, accepted] of [
		[
			'ja',
			'1文字以上入力してください。',
			'6文字以内で入力してください。',
			'テキストを受け付けました。',
		],
		['zh-HK', '請輸入至少 1 個字元。', '請輸入不多於 6 個字元。', '文字已接受。'],
		['en', 'Enter at least 1 character.', 'Enter no more than 6 characters.', 'Text accepted.'],
	]) {
		await home.switchLocale(locale);
		await home.validateText('');
		await expect(home.validationErrors).toHaveText(required);
		await home.validateText('abcdefg');
		await expect(home.validationErrors).toHaveText(tooLong);
		await home.validateText('abcdef');
		await expect(home.validationErrors).toBeHidden();
		await expect(home.validationSuccess).toHaveText(accepted);
	}
	expect(duplicateFormWarnings).toEqual([]);
});

test('SSR validates and translates text without JavaScript', async ({ browser, baseURL }) => {
	test.skip(test.info().project.name !== 'ssr', 'Requires server form actions');
	const context = await browser.newContext({ baseURL, javaScriptEnabled: false, locale: 'ja' });
	try {
		const home = new HomePage(await context.newPage());
		await home.goto();
		await home.validateText('');
		await expect(home.validationErrors).toHaveText('1文字以上入力してください。');
		await home.validateText('abcdefg');
		await expect(home.validationErrors).toHaveText('6文字以内で入力してください。');
		await home.validateText('abcdef');
		await expect(home.validationErrors).toBeHidden();
		await expect(home.validationSuccess).toHaveText('テキストを受け付けました。');
	} finally {
		await context.close();
	}
});

test('renders English translations and interpolated content', async ({ page }) => {
	const home = new HomePage(page);
	await home.goto();

	await expect(home.greeting).toHaveText('Hello John Doe!');
	await expect(home.itemLabel).toHaveText('1 item');
	await expect(home.countSummary).toHaveText('You have 1 (1 item).');
	await expect(home.contextMessage).toHaveText('Interpolated context message: New');
	await expect(home.summary).toHaveText('Hello John Doe. You have 1 item.');
	await expect(home.multiline).toHaveText('Line 1\nLine 2');
	await expect(home.tsStatus).toHaveText('Refreshed');
});

test('updates plurals and composed messages, with a zero floor', async ({ page }) => {
	const home = new HomePage(page);
	await home.goto();

	await home.increment();
	await expect(home.itemLabel).toHaveText('2 items');
	await expect(home.countSummary).toHaveText('You have 2 (2 items).');
	await expect(home.summary).toHaveText('Hello John Doe. You have 2 items.');

	await home.decrement();
	await home.decrement();
	await home.decrement();
	await expect(home.itemLabel).toHaveText('0 items');
	await expect(home.countSummary).toHaveText('You have 0 (0 items).');
	await expect(home.summary).toHaveText('Hello John Doe. You have 0 items.');
});

test('switches translations to Japanese and back', async ({ page }) => {
	const home = new HomePage(page);
	await home.goto();

	await expect(home.switchLocaleButton('ja')).toHaveText('ja');
	await home.switchLocale('ja');
	await expect(home.greeting).toHaveText('こんにちは、John Doeさん！');
	await expect(home.itemLabel).toHaveText('1個のアイテム');
	await expect(home.countSummary).toHaveText('1（1個のアイテム）あります。');
	await expect(home.contextMessage).toHaveText('補間されたコンテキストメッセージ: 新着');
	await expect(home.summary).toHaveText('こんにちは、John Doeさん。1個のアイテム あります。');
	await expect(home.multiline).toHaveText('1行目\n2行目');
	await expect(home.tsStatus).toHaveText('更新しました');

	await home.increment();
	await expect(home.itemLabel).toHaveText('2個のアイテム');
	await expect(home.summary).toHaveText('こんにちは、John Doeさん。2個のアイテム あります。');

	await expect(home.switchLocaleButton('en')).toHaveText('en');
	await home.switchLocale('en');
	await expect(home.greeting).toHaveText('Hello John Doe!');
	await expect(home.itemLabel).toHaveText('1 item');
	await expect(home.tsStatus).toHaveText('Refreshed');
});

test('switches translations to Chinese and back', async ({ page }) => {
	const home = new HomePage(page);
	await home.goto();

	await home.switchLocale('zh-HK');
	await expect(home.greeting).toHaveText('你好 John Doe！');
	await expect(home.itemLabel).toHaveText('1 個項目');
	await expect(home.countSummary).toHaveText('你有 1（1 個項目）。');
	await expect(home.contextMessage).toHaveText('插值情境訊息: 新');
	await expect(home.summary).toHaveText('你好 John Doe。你有 1 個項目 。');
	await expect(home.multiline).toHaveText('第 1 行\n第 2 行目');
	await expect(home.tsStatus).toHaveText('更新成功');

	await home.increment();
	await expect(home.itemLabel).toHaveText('2 個項目');
	await expect(home.summary).toHaveText('你好 John Doe。你有 2 個項目 。');
	expect(await home.refreshFail()).toBe('同步項目時發生錯誤');
	await expect(home.itemLabel).toHaveText('2 個項目');
	expect(await home.refresh()).toBe('更新成功');
	await expect(home.itemLabel).toHaveText('1 個項目');

	await home.switchLocale('en');
	await expect(home.greeting).toHaveText('Hello John Doe!');
	await expect(home.tsStatus).toHaveText('Refreshed');
});

test('SSR TypeScript helpers isolate simultaneous requests in different locales', async ({
	browser,
	baseURL,
}) => {
	test.skip(test.info().project.name !== 'ssr', 'Requires server rendering');
	const contexts = await Promise.all(
		['en', 'ja', 'zh-HK'].map((locale) =>
			browser.newContext({
				baseURL,
				javaScriptEnabled: false,
				locale,
			}),
		),
	);
	try {
		const homes = await Promise.all(
			contexts.map(async (context) => new HomePage(await context.newPage())),
		);
		await Promise.all(homes.map((home) => home.goto()));
		await expect(homes[0].greeting).toHaveText('Hello John Doe!');
		await expect(homes[1].greeting).toHaveText('こんにちは、John Doeさん！');
		await expect(homes[2].greeting).toHaveText('你好 John Doe！');
		await expect(homes[0].tsStatus).toHaveText('Refreshed');
		await expect(homes[1].tsStatus).toHaveText('更新しました');
		await expect(homes[2].tsStatus).toHaveText('更新成功');
		await expect(homes[0].refreshButton).toHaveText('Refresh');
		await expect(homes[1].refreshButton).toHaveText('更新');
		await expect(homes[2].refreshButton).toHaveText('重新整理');
		await Promise.all(homes.map((home) => home.goto()));
		await expect(homes[0].tsStatus).toHaveText('Refreshed');
		await expect(homes[1].tsStatus).toHaveText('更新しました');
		await expect(homes[2].tsStatus).toHaveText('更新成功');
	} finally {
		await Promise.all(contexts.map((context) => context.close()));
	}
});

test('refresh shows a translated alert and resets the count', async ({ page }) => {
	const home = new HomePage(page);
	await home.goto();

	await home.increment();
	await expect(home.itemLabel).toHaveText('2 items');
	await expect(home.refreshButton).toHaveText('Refresh');
	expect(await home.refresh()).toBe('Refreshed');
	await expect(home.itemLabel).toHaveText('1 item');

	await home.switchLocale('ja');
	await expect(home.refreshButton).toHaveText('更新');
	await home.increment();
	expect(await home.refresh()).toBe('更新しました');
	await expect(home.itemLabel).toHaveText('1個のアイテム');
});

test('failed refresh reports the localized error without changing the count', async ({ page }) => {
	const home = new HomePage(page);
	await home.goto();

	await home.increment();
	await expect(home.refreshFailButton).toHaveText('Refresh (fail)');
	expect(await home.refreshFail()).toBe('Error while syncing items');
	await expect(home.itemLabel).toHaveText('2 items');

	await home.switchLocale('ja');
	await expect(home.refreshFailButton).toHaveText('更新（失敗）');
	await home.increment();
	expect(await home.refreshFail()).toBe('アイテムの同期中にエラーが発生しました');
	await expect(home.itemLabel).toHaveText('2個のアイテム');
});

test('SSR home page submits the email form', async ({ page }) => {
	test.skip(test.info().project.name !== 'ssr', 'The email form is only on the SSR home page');
	const home = new HomePage(page);
	await home.goto();

	await expect(home.sendEmailButton).toHaveText('Send Email');
	expect(await home.sendEmail()).toBe(
		'The translated email has been logged in the server console.',
	);
	await expect(home.greeting).toHaveText('Hello John Doe!');
});
