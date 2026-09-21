import { setContext, getContext } from 'svelte';
import { parseMessage } from './po.js';

/**
 * @typedef {Record<string, unknown[]>} MessageCatalog
 */

/**
 * @typedef SveltextContext
 * @property {MessageCatalog} messages
 * @property {string} locale
 */

export function getMessage(id, messages) {
	let message = messages[id];

	if (!message) {
		if (import.meta.env.DEV) {
			return parseMessage(id);
		}

		return [id];
	}

	return message;
}

export function _({ id, args }, { messages, locale }) {
	const tokens = getMessage(id, messages);

	if (typeof args === 'object') {
		return tokens
			.map((token) => (typeof args?.[token] !== 'undefined' ? args[token] : token))
			.join('');
	}

	if (tokens[0][1] === 'plural' && typeof args === 'number') {
		const pr = new Intl.PluralRules(locale);
		const selectors = tokens[0][2];
		const category = pr.select(args);
		const selectorTokens = category in selectors ? selectors[category] : selectors['other'];
		return selectorTokens.map((token) => (token === '#' ? args : token)).join('');
	}

	return tokens.join('');
}

export function createSveltextTFunction() {
	const context = getSveltextContext();

	return function t(messageDescriptor) {
		return _(messageDescriptor, context);
	};
}

const contextId = Symbol('sveltext');

/**
 * @returns {SveltextContext}
 */
export function getSveltextContext() {
	return getContext(contextId);
}

export function setLocale(locale, messages) {
	setContext(contextId, {
		locale,
		messages,
	});
}
