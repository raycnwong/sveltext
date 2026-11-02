import type { LayoutLoad } from './$types';
import { getCurrentLocale, loadMessageCatalog } from '#lib/i18n.ts';

export const ssr = false;

export const load: LayoutLoad = async () => {
	const currentLocale = getCurrentLocale();
	const messages = await loadMessageCatalog(currentLocale);

	return {
		currentLocale,
		messages
	};
};
