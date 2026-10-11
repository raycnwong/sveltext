import { t } from 'sveltext';

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
