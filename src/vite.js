import MagicString from 'magic-string';
import { parse } from 'svelte/compiler';
import { Parser } from 'acorn';
import { tsPlugin } from '@sveltejs/acorn-typescript';
import gettextParser from 'gettext-parser';
import {
	resolveConfig,
	traverse,
	generateMessageId,
	transformTaggedTemplateExpression,
} from './core.js';
import { parseMessage } from './po.js';

/**
 * Returns the Vite plugins.
 * @returns {Promise<import('vite').PluginOption>}
 */
export async function sveltext() {
	const TsParser = Parser.extend(tsPlugin());
	const sveltextConfig = await resolveConfig();

	return [
		{
			name: 'vite-plugin-sveltext-transform-ts-js-svelte',
			enforce: 'pre',
			async transform(code, id) {
				if (
					(!id.endsWith('.ts') && !id.endsWith('.js') && !id.endsWith('.svelte')) ||
					!code.includes('sveltext')
				) {
					return;
				}

				const s = new MagicString(code);

				/** @type {import('./core.js').AST} */
				let ast;
				if (id.endsWith('.svelte')) {
					ast = parse(code, { modern: true });
				} else {
					ast = TsParser.parse(code, {
						sourceType: 'module',
						ecmaVersion: 'latest',
						locations: true,
					});
				}

				/** @type {import('./core.js').State} */
				const state = { tImport: null, messages: [], error: null };

				traverse(ast, state, sveltextConfig.sourceLocale);

				if (state.error !== null) {
					this.error(state.error, state.error.start);
				}

				if (id.endsWith('.svelte')) {
					if (state.tImport) {
						const { specifier, declaration } = state.tImport;
						if (specifier.count === 1) {
							s.remove(declaration.start, declaration.end);
						} else {
							s.remove(specifier.start, specifier.end + 1);
						}
					}

					if (
						state.tImport ||
						state.messages.filter(({ tagName }) => tagName !== 'msg').length > 0
					) {
						s.appendRight(
							/** @type {any} */ (ast).instance.content.start,
							`import { createSveltextTFunction } from 'sveltext/internal';
const t = createSveltextTFunction();`,
						);
					}
				}

				for (const message of state.messages) {
					transformTaggedTemplateExpression(s, message);
				}

				return {
					code: s.toString(),
					map: s.generateMap({
						source: id,
						includeContent: true,
						hires: true,
					}),
				};
			},
		},
		{
			name: 'vite-plugin-sveltext-po-loader',
			enforce: 'pre',
			async transform(code, id) {
				if (!id.endsWith('.po')) {
					return;
				}
				const parsedPo = gettextParser.po.parse(code);
				const messages = Object.create(null);

				for (const translations of Object.values(parsedPo.translations)) {
					for (const key in translations) {
						if (key === '') continue;
						const msgid = translations[key]['msgid'];
						const context = translations[key]['msgctxt'] || '';
						const hashedMsgid = generateMessageId(msgid, context);
						const message = (translations[key]['msgstr'][0] || msgid).replace(/\\n/g, '\n');
						messages[hashedMsgid] = parseMessage(message);
					}
				}

				const transformedCode = `export const messages = JSON.parse(${JSON.stringify(JSON.stringify(messages))})`;

				return {
					code: transformedCode,
					map: {
						mappings: '',
					},
				};
			},
		},
	];
}
