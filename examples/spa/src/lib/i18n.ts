import type { MessageCatalog } from 'sveltext';

const supportedLocales = ['en', 'ja', 'zh-HK'];

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

export async function setCurrentLocale(locale: string) {
	localStorage.setItem('currentLocale', locale);
}

export function getCurrentLocale() {
	const localStorageLocale = localStorage.getItem('currentLocale');

	if (localStorageLocale) {
		return matchLocale(localStorageLocale);
	}

	const preferredLocale = navigator.languages.find((language) =>
		supportedLocales.find((l) => language.toLowerCase().startsWith(l.toLowerCase()))
	);

	if (preferredLocale) {
		return matchLocale(preferredLocale);
	}

	return 'en';
}
