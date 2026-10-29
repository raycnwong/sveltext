import { walk, type Visitors } from 'zimmerframe';
import type { default as MagicString } from 'magic-string';
import type { Expression, Program, TaggedTemplateExpression } from 'acorn';
import type { AST as SvelteAST } from 'svelte/compiler';
import { parse as icuParse, isArgumentElement } from '@formatjs/icu-messageformat-parser';
import crypto from 'crypto';
import path from 'node:path';
import {
	MESSAGE_CONTEXT_SEPARATOR,
	MESSAGE_ARGUMENTS_SEPARATOR,
	ARGUMENT_SEPARATOR,
	ARGUMENT_VALUE_SEPARATOR,
} from './descriptor.ts';

export type WithPositions<T> = T extends { type: string }
	? T & { start: number; end: number }
	: never;

export type AST = WithPositions<SvelteAST.SvelteNode | Program>;

interface ExtractedMessageBase {
	context: string;
	message: string;
	start: number;
	end: number;
}

interface ExtractedRegularMessage extends ExtractedMessageBase {
	expressions: Expression[];
	tagName: 't' | 'msg';
}

interface ExtractedPluralMessage extends ExtractedMessageBase {
	expressions: string[];
	tagName: 'plural';
}

type ExtractedMessage = ExtractedRegularMessage | ExtractedPluralMessage;

interface TraverseStateError {
	start: number;
	message: string;
}

export interface TraverseState {
	messages: ExtractedMessage[];
	error: TraverseStateError | null;
}

interface Config {
	locales: string[];
	sourceLocale: string;
	catalog: {
		path: string;
		include: string[];
	};
}

export async function resolveConfig() {
	const { default: config } = await import(path.join(process.cwd(), 'sveltext.config.js'));

	const { locales, sourceLocale, catalog } = config;

	if (!(sourceLocale && locales.includes(sourceLocale))) {
		throw new Error('sourceLocale not found in locales');
	}

	for (const locale of locales) {
		try {
			new Intl.PluralRules(locale);
		} catch (err) {
			throw new Error(
				'Unsupported locale tag found.\nPlease make sure all locale tags are BCP 47 language tags.\nRef: https://developer.mozilla.org/docs/Glossary/BCP_47_language_tag',
			);
		}
	}

	if (!(catalog && catalog.path && Array.isArray(catalog.include))) {
		throw new Error('Malformed catalog config');
	}

	return config as Config;
}

export function generateMessageId(msg: string, context: string = '') {
	const handledMsg = msg + MESSAGE_CONTEXT_SEPARATOR + (context || '');

	if (process.env.NODE_ENV === 'development') {
		return handledMsg;
	}

	return crypto.createHash('sha256').update(handledMsg).digest('base64').slice(0, 6);
}

function inferVariableName(node: Expression, index: number) {
	if (node.type === 'Identifier') {
		return node.name;
	}

	if (node.type === 'MemberExpression' && node.property.type === 'Identifier') {
		return node.property.name;
	}

	return index;
}

function normalizeTaggedTemplateExpression(node: TaggedTemplateExpression) {
	let message = '';
	const { quasis, expressions } = node.quasi;

	for (let i = 0; i < quasis.length; i++) {
		message += quasis[i].value.raw;

		if (i < expressions.length) {
			const expr = expressions[i];
			const varName = inferVariableName(expr, i);
			message += `{${varName}}`;
		}
	}
	return { message, expressions };
}

export function transformTaggedTemplateExpression(
	s: MagicString,
	{ start, end, message, tagName, context, expressions }: ExtractedMessage,
	translator: string,
) {
	const id = generateMessageId(message, context);
	const idLiteral = JSON.stringify(id);

	if (tagName === 'plural') {
		const descriptor =
			expressions.length === 0
				? idLiteral
				: `${JSON.stringify(`${id}${MESSAGE_ARGUMENTS_SEPARATOR}${expressions[0]}${ARGUMENT_VALUE_SEPARATOR}`)} + (${expressions[0]})`;
		s.overwrite(start, end, `${translator}(${descriptor})`);
		return;
	}

	if (expressions.length === 0) {
		let replacement;

		if (tagName === 'msg') {
			replacement = idLiteral;
		} else {
			replacement = `${translator}(${idLiteral})`;
		}

		s.overwrite(start, end, replacement);
	} else {
		let currentIndex = start;
		let prefix;

		if (tagName === 'msg') {
			prefix = '(';
		} else {
			prefix = `${translator}(`;
		}

		for (let i = 0; i < expressions.length; i++) {
			const expr = expressions[i];
			const varName = inferVariableName(expr, i);
			const field = `${i === 0 ? `${id}${MESSAGE_ARGUMENTS_SEPARATOR}` : ARGUMENT_SEPARATOR}${varName}${ARGUMENT_VALUE_SEPARATOR}`;
			s.overwrite(currentIndex, expr.start, `${prefix}${JSON.stringify(field)} + (`);
			currentIndex = expr.end;
			prefix = ') + ';
		}

		s.overwrite(currentIndex, end, '))');
	}
}

export function traverse(ast: AST, state: TraverseState, sourceLocale: string) {
	const visitors: Visitors<AST, TraverseState> = {
		Component(node, { next, stop }) {
			if (node.name !== 'T') {
				next();
				return;
			}

			const snippets = new Map<string, number>();
			for (const child of node.fragment.nodes) {
				if (child.type === 'SnippetBlock') {
					snippets.set(child.expression.name, child.start);
				} else if (child.type !== 'Comment' && !(child.type === 'Text' && !child.data.trim())) {
					state.error = {
						start: child.start,
						message: 'sveltext: Unnamed content inside <T>; declare a named snippet.',
					};
					stop();
					return;
				}
			}
			for (const attribute of node.attributes) {
				if (attribute.type === 'Attribute' && attribute.name !== 'msg') {
					snippets.set(attribute.name, attribute.start);
				}
			}

			next();
			if (state.error) return;

			const attribute = node.attributes.find(
				(attribute) => attribute.type === 'Attribute' && attribute.name === 'msg',
			);
			if (!attribute || attribute.type !== 'Attribute' || attribute.value === true) return;
			const value = Array.isArray(attribute.value) ? attribute.value[0] : attribute.value;
			if (value?.type !== 'ExpressionTag') return;
			const message = state.messages.find(
				(message) =>
					message.tagName === 'msg' &&
					message.start === (value.expression as WithPositions<Expression>).start,
			);
			if (!message || message.tagName !== 'msg') return;

			let elements: ReturnType<typeof icuParse>;
			try {
				elements = icuParse(message.message);
			} catch {
				return;
			}
			const placeholders = new Set(
				elements.filter(isArgumentElement).map((element) => element.value),
			);
			const args = new Set(message.expressions.map(inferVariableName).map(String));
			for (const name of placeholders) {
				if (!snippets.has(name) && !args.has(name)) {
					state.error = { start: message.start, message: `sveltext: Missing snippet '${name}'.` };
					stop();
					return;
				}
			}
			for (const [name, start] of snippets) {
				if (!placeholders.has(name)) {
					state.error = { start, message: `sveltext: Unexpected snippet '${name}'.` };
					stop();
					return;
				}
			}
		},
		TaggedTemplateExpression(node, { next, state }) {
			if (node.tag.type === 'Identifier' && (node.tag.name === 't' || node.tag.name === 'msg')) {
				const { message, expressions } = normalizeTaggedTemplateExpression(
					node as TaggedTemplateExpression,
				);
				const { start, end } = node;
				state.messages.push({
					context: '',
					message,
					start,
					end,
					expressions,
					tagName: node.tag.name,
				});
			}

			if (
				node.tag.type === 'MemberExpression' &&
				node.tag.property.type === 'Identifier' &&
				(node.tag.property.name === 't' || node.tag.property.name === 'msg') &&
				node.tag.object.type === 'CallExpression' &&
				node.tag.object.callee.type === 'Identifier' &&
				node.tag.object.callee.name === 'c' &&
				node.tag.object.arguments.length === 1 &&
				node.tag.object.arguments[0].type === 'Literal'
			) {
				const contextArg = node.tag.object.arguments[0];
				const context = contextArg.value ? contextArg.value.toString() : '';

				const { message, expressions } = normalizeTaggedTemplateExpression(
					node as TaggedTemplateExpression,
				);
				const { start, end } = node;
				state.messages.push({
					context,
					message,
					start,
					end,
					expressions,
					tagName: node.tag.property.name,
				});
			}

			next();
		},
		CallExpression(node, { next, stop }) {
			if (
				node.callee.type === 'Identifier' &&
				node.callee.name === 'plural' &&
				node.arguments.length === 2 &&
				node.arguments[1].type === 'ObjectExpression'
			) {
				const pr = new Intl.PluralRules(sourceLocale);
				const { pluralCategories } = pr.resolvedOptions();
				const selectors = Object.create(null);

				for (const property of node.arguments[1].properties) {
					if (
						property.type === 'Property' &&
						property.key.type === 'Identifier' &&
						property.value.type === 'Literal'
					) {
						selectors[property.key.name] = property.value.value;
					}
				}

				for (const category of pluralCategories) {
					if (!selectors[category]) {
						state.error = {
							start: node.start,
							message: `sveltext: Missing required plural category '${category}'.\nThe required plural categories are ${pluralCategories.join(', ')}.`,
						};
						stop();
						return;
					}
				}

				if (node.arguments[0].type === 'Literal' && typeof node.arguments[0].value === 'number') {
					const value = node.arguments[0].value;
					const category = pr.select(value);
					const message = selectors[category].replaceAll('#', value);
					const { start, end } = node;
					state.messages.push({
						context: '',
						message,
						start,
						end,
						expressions: [],
						tagName: 'plural',
					});
				}

				if (node.arguments[0].type === 'Identifier') {
					const variable = node.arguments[0].name;
					const message = `{${variable}, plural, ${Object.entries(selectors)
						.map(([selectorName, selectorValue]) => `${selectorName} {${selectorValue}}`)
						.join(' ')}}`;
					const { start, end } = node;
					state.messages.push({
						context: '',
						message,
						start,
						end,
						expressions: [variable],
						tagName: 'plural',
					});
				}
			}

			next();
		},
	};

	walk(ast, state, visitors);
}
