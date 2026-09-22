import MagicString from 'magic-string';
import { parse } from 'svelte/compiler';
import { Parser } from 'acorn';
import type { PluginOption } from 'vite';
import fs from 'node:fs/promises';
import path from 'node:path';
import { tsPlugin } from '@sveltejs/acorn-typescript';
import {
	resolveConfig,
	traverse,
	generateMessageId,
	transformTaggedTemplateExpression,
} from './core.ts';
import type { TraverseState } from './core.ts';
import { parsePo } from './po.ts';
import { isNodeError } from './utils.ts';

/**
 * Returns the Vite plugins.
 */
export async function sveltext(): Promise<PluginOption[]> {
	const TsParser = Parser.extend(tsPlugin());
	const sveltextConfig = await resolveConfig();
	let isBuild = false;
	const catalogs = Object.create(null);

	return [
		{
			name: 'vite-plugin-sveltext-transform-ts-js-svelte',
			enforce: 'pre',
			async configResolved({ command }) {
				if (command === 'build') {
					isBuild = true;

					for (const locale of sveltextConfig.locales) {
						const poPath = path.join(sveltextConfig.catalog.path, `${locale}.po`);
						try {
							const poCode = await fs.readFile(poPath, 'utf-8');
							catalogs[locale] = parsePo(poCode);
						} catch (err) {
							if (isNodeError(err) && err.code === 'ENOENT') {
								throw new Error(
									`sveltext: Missing catalog file for locale ${JSON.stringify(locale)}. Expected to find it at ${poPath}.\nPlease ensure a .po file is created for every configured locale.`,
								);
							}
							throw err;
						}
					}
				}
			},
			async transform(code, id) {
				if (
					(!id.endsWith('.ts') && !id.endsWith('.js') && !id.endsWith('.svelte')) ||
					!code.includes('sveltext')
				) {
					return;
				}

				const s = new MagicString(code);

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

				const state: TraverseState = { tImport: null, messages: [], error: null };

				traverse(ast, state, sveltextConfig.sourceLocale);

				if (isBuild) {
					for (const { start, message, context } of state.messages) {
						const hashedMsgid = generateMessageId(message, context);
						for (const locale in catalogs) {
							if (!(hashedMsgid in catalogs[locale])) {
								this.error(
									`sveltext: Message ${JSON.stringify(message)}${context ? ` (context: ${JSON.stringify(context)})` : ''} is missing from ${locale}.po.\nPlease run the extraction script before building. This is required even for untranslated strings, as the build process will convert the original messages to hashes.`,
									start,
								);
							}
						}
					}
				}

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
							// FIXME: Remove `any` type cast
							(ast as any).instance.content.start,
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

				const messages = parsePo(code);
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
