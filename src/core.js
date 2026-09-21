import { walk } from 'zimmerframe';
import crypto from 'crypto';
import path from 'node:path';

/**
 * @typedef AST
 * @type {import('svelte/compiler').AST.SvelteNode | import('acorn').Program}
 */

/**
 * @typedef ExtractedPluralMessage
 * @property {string} context
 * @property {string} message
 * @property {number} start
 * @property {number} end
 * @property {string[]} expressions
 * @property {'plural'} tagName
 */

/**
 * @typedef ExtractedRegularMessage
 * @property {string} context
 * @property {string} message
 * @property {number} start
 * @property {number} end
 * @property {import('acorn').Expression[]} expressions
 * @property {'t' | 'msg'} tagName
 */

/**
 * @typedef ExtractedMessage
 * @type {ExtractedRegularMessage | ExtractedPluralMessage}
 */

/**
 * @typedef TImport
 * @property {{ start: number; end: number; count: number }} specifier
 * @property {{ start: number; end: number }} declaration
 */

/**
 * @typedef StateError
 * @property {number} start
 * @property {string} message
 */

/**
 * @typedef State
 * @property {TImport | null} tImport
 * @property {ExtractedMessage[]} messages
 * @property {StateError | null} error
 */

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

	return config;
}

const UNIT_SEPARATOR = '\u001F';

/**
 * @param {string} msg
 * @param {string} context
 * @returns {string}
 */
export function generateMessageId(msg, context = '') {
	const handledMsg = msg + UNIT_SEPARATOR + (context || '');

	if (process.env.NODE_ENV === 'development') {
		return handledMsg;
	}

	return crypto.createHash('sha256').update(handledMsg).digest('base64').slice(0, 6);
}

/**
 * @param {import('acorn').Expression} node
 * @param {number} index
 * @returns {string | number}
 */
function inferVariableName(node, index) {
	if (node.type === 'Identifier') {
		return node.name;
	}

	if (node.type === 'MemberExpression' && node.property.type === 'Identifier') {
		return node.property.name;
	}

	return index;
}

/**
 * @param {import('acorn').TaggedTemplateExpression} node
 * @returns {{ message: string; expressions: import('acorn').Expression[] }}
 */
function normalizeTaggedTemplateExpression(node) {
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

/**
 * @param {import('magic-string').default} s
 * @param {ExtractedMessage} message
 * @returns {void}
 */
export function transformTaggedTemplateExpression(
	s,
	{ start, end, message, tagName, context, expressions },
) {
	const id = generateMessageId(message, context);
	const idLiteral = JSON.stringify(id);

	if (tagName === 'plural') {
		const variable = expressions.length === 0 ? '' : `, args: ${expressions[0]}`;
		s.overwrite(start, end, `t({ id: ${idLiteral}${variable} })`);
		return;
	}

	if (expressions.length === 0) {
		let replacement;

		if (tagName === 'msg') {
			replacement = `{ id: ${idLiteral} }`;
		} else {
			replacement = `t({ id: ${idLiteral} })`;
		}

		s.overwrite(start, end, replacement);
	} else {
		let currentIndex = start;
		let prefix;

		if (tagName === 'msg') {
			prefix = `{ id: ${idLiteral}, args: { `;
		} else {
			prefix = `t({ id: ${idLiteral}, args: { `;
		}

		for (let i = 0; i < expressions.length; i++) {
			const expr = expressions[i];
			const varName = inferVariableName(expr, i);
			s.overwrite(currentIndex, expr.start, `${prefix}${JSON.stringify(varName)}: `);
			currentIndex = expr.end;
			prefix = `, `;
		}

		if (tagName === 'msg') {
			s.overwrite(currentIndex, end, ` } }`);
		} else {
			s.overwrite(currentIndex, end, ` } })`);
		}
	}
}

/**
 * @param {AST} ast
 * @param {State} state
 * @param {string} sourceLocale
 */
export function traverse(ast, state, sourceLocale) {
	walk(ast, state, {
		ImportDeclaration(node, { next, state }) {
			if (node.source.value === 'sveltext') {
				const tImport = node.specifiers.find(
					(specifier) =>
						specifier.type === 'ImportSpecifier' &&
						specifier.imported.type === 'Identifier' &&
						specifier.imported.name === 't',
				);

				if (tImport) {
					const { start: tImportStart, end: tImportEnd } = /** @type {any} */ (tImport);
					const { start: nodeStart, end: nodeEnd } = /** @type {any} */ (node);

					state.tImport = {
						specifier: {
							start: tImportStart,
							end: tImportEnd,
							count: node.specifiers.length,
						},
						declaration: {
							start: nodeStart,
							end: nodeEnd,
						},
					};
				}
			}
			next();
		},
		TaggedTemplateExpression(node, { next, state }) {
			if (node.tag.type === 'Identifier' && (node.tag.name === 't' || node.tag.name === 'msg')) {
				const { message, expressions } = normalizeTaggedTemplateExpression(
					/** @type {any} */ (node),
				);
				const { start, end } = /** @type {any} */ (node);
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
					/** @type {any} */ (node),
				);
				const { start, end } = /** @type {any} */ (node);
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
							start: /** @type {any} */ (node).start,
							message: `\nsveltext: Missing required plural category '${category}'.\nThe required plural categories are ${pluralCategories.join(', ')}.`,
						};
						stop();
						return;
					}
				}

				if (node.arguments[0].type === 'Literal' && typeof node.arguments[0].value === 'number') {
					const value = node.arguments[0].value;
					const category = pr.select(value);
					const message = selectors[category].replaceAll('#', value);
					const { start, end } = /** @type {any} */ (node);
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
					const { start, end } = /** @type {any} */ (node);
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
	});
}
