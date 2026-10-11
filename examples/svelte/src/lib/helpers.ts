import { msg, t } from 'sveltext';

export const errors = {
	sync: msg`Error while syncing items`
};

export function formatStatus(status: 'ready' | 'failed') {
	return status === 'ready' ? t`Refreshed` : t`Error while syncing items`;
}

export async function validateItems(valid: boolean) {
	await Promise.resolve();
	return valid ? undefined : t`Error while syncing items`;
}
