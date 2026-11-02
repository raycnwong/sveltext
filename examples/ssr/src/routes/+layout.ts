import type { LayoutLoad } from './$types';
import { loadMessageCatalog } from '#lib/i18n.ts';

export const load: LayoutLoad = async ({ data }) => {
	const currentLocale = data.currentLocale;
	const messages = await loadMessageCatalog(currentLocale);
	return {
		currentLocale,
		messages
	};
};
