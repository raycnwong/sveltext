import { setContext, getContext } from 'svelte';
import { parseMessage } from './message.ts';

interface SveltextContext {
	messages: MessageCatalog;
	locale: string;
}

export type MessageCatalog = Record<string, unknown[]>;

export type MessageDescriptor = { id: string; args?: Record<string, unknown> };

export function getMessage(id: string, messages: MessageCatalog) {
	let message = messages[id];

	if (!message) {
		// @ts-ignore
		if (import.meta.env.DEV) {
			return parseMessage(id);
		}

		return [id];
	}

	return message;
}

export function _({ id, args }: MessageDescriptor, { messages, locale }: SveltextContext) {
	const tokens = getMessage(id, messages);

	if (typeof args === 'object' && args !== null) {
		return tokens
			.map((token) => {
				if (typeof token !== 'string') return token;

				return typeof args[token] !== 'undefined' ? args[token] : token;
			})
			.join('');
	}

	if (Array.isArray(tokens[0]) && tokens[0][1] === 'plural' && typeof args === 'number') {
		const pr = new Intl.PluralRules(locale);
		const selectors = tokens[0][2];
		const category = pr.select(args);
		const selectorTokens: string[] =
			category in selectors ? selectors[category] : selectors['other'];
		return selectorTokens.map((token) => (token === '#' ? args : token)).join('');
	}

	return tokens.join('');
}

export function createSveltextTFunction() {
	const context = getSveltextContext();

	return function t(messageDescriptor: MessageDescriptor) {
		return _(messageDescriptor, context);
	};
}

const contextId = Symbol('sveltext');

export function getSveltextContext(): SveltextContext {
	return getContext(contextId);
}

export function setLocale(locale: string, messages: MessageCatalog) {
	setContext(contextId, {
		locale,
		messages,
	});
}
