import type { Locator, Page } from '@playwright/test';

export class HomePage {
	readonly greeting: Locator;
	readonly itemLabel: Locator;
	readonly countSummary: Locator;
	readonly contextMessage: Locator;
	readonly summary: Locator;
	readonly multiline: Locator;
	readonly switchLocaleButton: Locator;
	readonly refreshButton: Locator;
	readonly refreshFailButton: Locator;
	readonly sendEmailButton: Locator;
	private readonly incrementButton: Locator;
	private readonly decrementButton: Locator;

	constructor(private readonly page: Page) {
		this.greeting = page.getByTestId('greeting');
		this.itemLabel = page.getByTestId('item-label');
		this.countSummary = page.getByTestId('count-summary');
		this.contextMessage = page.getByTestId('context-message');
		this.summary = page.getByTestId('summary');
		this.multiline = page.getByTestId('multiline');
		this.switchLocaleButton = page.getByTestId('switch-locale');
		this.refreshButton = page.getByTestId('refresh');
		this.refreshFailButton = page.getByTestId('refresh-fail');
		this.sendEmailButton = page.getByTestId('send-email');
		this.incrementButton = page.getByTestId('increment');
		this.decrementButton = page.getByTestId('decrement');
	}

	async goto(): Promise<void> {
		await this.page.goto('/', { waitUntil: 'networkidle' });
	}

	async increment(): Promise<void> {
		await this.incrementButton.click();
	}

	async decrement(): Promise<void> {
		await this.decrementButton.click();
	}

	async switchLocale(): Promise<void> {
		await this.switchLocaleButton.click();
	}

	async refresh(): Promise<string> {
		return this.clickAndReadDialog(this.refreshButton);
	}

	async refreshFail(): Promise<string> {
		return this.clickAndReadDialog(this.refreshFailButton);
	}

	async sendEmail(): Promise<string> {
		return this.clickAndReadDialog(this.sendEmailButton);
	}

	private async clickAndReadDialog(button: Locator): Promise<string> {
		const message = new Promise<string>((resolve, reject) => {
			this.page.once('dialog', async (dialog) => {
				try {
					const text = dialog.message();
					await dialog.accept();
					resolve(text);
				} catch (error) {
					reject(error);
				}
			});
		});
		await button.click();
		return message;
	}
}
