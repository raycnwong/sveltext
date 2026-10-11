import type { Handle } from '@sveltejs/kit';
import { matchLocale, loadMessageCatalog } from '$lib/i18n';
import { withSveltext } from 'sveltext/server';

export const handle: Handle = async ({ event, resolve }) => {
	let currentLocale = event.cookies.get('currentLocale');

	if (currentLocale) {
		// Ensure the locale in cookie is supported
		currentLocale = matchLocale(currentLocale);
	} else {
		// Match again with Accept-Language header
		currentLocale = matchLocale(event.request.headers.get('accept-language'));
	}

	event.locals.currentLocale = currentLocale;
	event.cookies.set('currentLocale', currentLocale, {
		path: '/',
		httpOnly: false,
		secure: false
	});

	const messages = await loadMessageCatalog(currentLocale);
	return withSveltext({ locale: currentLocale, messages }, () =>
		resolve(event, {
			transformPageChunk: ({ html }) => html.replace('%lang%', currentLocale)
		})
	);
};
