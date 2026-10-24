import type { MessageCatalog } from 'sveltext';

const catalogLoaders = import.meta.glob<MessageCatalog>('../locales/*.po', { import: 'messages' });

export function loadMessageCatalog(locale: string) {
	const loader = catalogLoaders[`../locales/${locale}.po`];
	return loader();
}

export function matchLocale(hint: string | null) {
	if (hint) {
		if (hint.startsWith('en')) {
			return 'en';
		}

		if (hint.startsWith('ja')) {
			return 'ja';
		}

		if (hint.toLowerCase().startsWith('zh-hk')) {
			return 'zh-HK';
		}
	}

	return 'en';
}
