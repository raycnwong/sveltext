import { c, msg, plural, t } from 'sveltext';

export const statusMessage = msg`Active`;
export const badgeMessage = c('badge').msg`New`;

export function greetingMessage(name: string | number) {
	return msg`Hello ${name}!`;
}

export function composedMessage(name: string, count: number) {
	return msg`Hello ${name}: ${count} ${1 + 2}!`;
}

export function translateComposed(name: string, count: number) {
	return t`Hello ${name}: ${count} ${1 + 2}!`;
}

export function itemLabel(count: number) {
	return plural(count, { one: '# item', other: '# items' });
}

export function formatStatus() {
	return t`Active`;
}

// Like a shared schema's superRefine callback, translation happens at validation time.
export async function validate(value: string, wait: Promise<void>) {
	await wait;
	return value ? undefined : t`Required`;
}

export function shadowedTranslation(__sveltext_t: string) {
	return `${__sveltext_t}: ${t`Active`}`;
}
