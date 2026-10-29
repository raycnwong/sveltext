import { parseMessage } from './message.ts';
import {
	MESSAGE_ARGUMENTS_SEPARATOR,
	ARGUMENT_SEPARATOR,
	ARGUMENT_VALUE_SEPARATOR,
} from './descriptor.ts';

export interface SveltextContext {
	messages: MessageCatalog;
	locale: string;
}

export type MessageCatalog = Record<string, unknown[]>;

export type MessageDescriptor = string;

export function parseDescriptor(descriptor: MessageDescriptor) {
	const separator = descriptor.indexOf(MESSAGE_ARGUMENTS_SEPARATOR);
	const id = separator === -1 ? descriptor : descriptor.slice(0, separator);
	const args: Record<string, string> = Object.create(null);
	if (separator !== -1) {
		for (const field of descriptor.slice(separator + 1).split(ARGUMENT_SEPARATOR)) {
			const separator = field.indexOf(ARGUMENT_VALUE_SEPARATOR);
			args[field.slice(0, separator)] = field.slice(separator + 1);
		}
	}
	return { id, args };
}

let browserContext: SveltextContext | undefined;
let resolveServerContext: (() => SveltextContext | undefined) | undefined;

export function setServerContextResolver(resolve: () => SveltextContext | undefined) {
	resolveServerContext = resolve;
}

export function getTranslationContext(): SveltextContext {
	const context = typeof window !== 'undefined' ? browserContext : resolveServerContext?.();
	if (!context) {
		throw new Error(
			'sveltext: No translation context for `t()`. Render SveltextRoot in the browser, or wrap server work with withSveltext() from sveltext/server. Use `msg` for module-level constants.',
		);
	}
	return context;
}

export function translate(messageDescriptor: MessageDescriptor) {
	return _(messageDescriptor, getTranslationContext());
}

export function getMessage(id: string, messages: MessageCatalog) {
	let message = messages[id];

	if (!message) {
		// @ts-ignore
		if (import.meta.env.DEV) {
			console.warn(`sveltext: msgid ${JSON.stringify(id)} is missing from the PO file.`);
			return parseMessage(id);
		}

		return [id];
	}

	return message;
}

export function _(descriptor: MessageDescriptor, { messages, locale }: SveltextContext) {
	if (!descriptor.includes(MESSAGE_ARGUMENTS_SEPARATOR)) {
		const tokens = getMessage(descriptor, messages);
		return tokens.join('');
	}

	const { id, args } = parseDescriptor(descriptor);
	const tokens = getMessage(id, messages);

	if (Array.isArray(tokens[0]) && tokens[0][1] === 'plural' && tokens[0][0] in args) {
		const count = Number(args[tokens[0][0]]);
		const pr = new Intl.PluralRules(locale);
		const selectors = tokens[0][2];
		const category = pr.select(count);
		const selectorTokens: string[] =
			category in selectors ? selectors[category] : selectors['other'];
		return selectorTokens.map((token) => (token === '#' ? count : token)).join('');
	}

	return tokens
		.map((token) => {
			if (typeof token !== 'string') return token;
			return typeof args[token] !== 'undefined' ? args[token] : token;
		})
		.join('');
}

export function setBrowserContext(context: SveltextContext) {
	browserContext = context;
}
