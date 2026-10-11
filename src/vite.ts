import MagicString from 'magic-string';
import { parse } from 'svelte/compiler';
import { Parser, type Program } from 'acorn';
import type { PluginOption, ViteDevServer } from 'vite';
import fs from 'node:fs/promises';
import path from 'node:path';
import { tsPlugin } from '@sveltejs/acorn-typescript';
import {
	resolveConfig,
	traverse,
	generateMessageId,
	transformTaggedTemplateExpression,
} from './core.ts';
import type { TraverseState, WithPositions } from './core.ts';
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
	const failedModules = new Set<string>();
	let devServer: ViteDevServer | undefined;

	return [
		{
			name: 'vite-plugin-sveltext-transform-ts-js-svelte',
			enforce: 'pre',
			configureServer(server) {
				devServer = server;
			},
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
				let importPosition: number | undefined = 0;
				if (id.endsWith('.svelte')) {
					ast = parse(code, { modern: true });
					importPosition = ast.module
						? (ast.module.content as WithPositions<Program>).start
						: undefined;
				} else {
					ast = TsParser.parse(code, {
						sourceType: 'module',
						ecmaVersion: 'latest',
						locations: true,
					});
				}

				const state: TraverseState = { messages: [], error: null };

				traverse(ast, state, sveltextConfig.sourceLocale);

				if (state.error !== null) {
					if (devServer) {
						failedModules.add(id);
					}
					this.error(state.error, state.error.start);
				}

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

				let translator = '__sveltext_t';
				while (code.includes(translator)) translator += '_';
				if (state.messages.some(({ tagName }) => tagName !== 'msg')) {
					const runtimeImport = `import { t as ${translator} } from 'sveltext';\n`;
					if (importPosition === undefined) {
						s.prepend(`<script module>${runtimeImport}</script>\n`);
					} else {
						s.appendRight(importPosition, runtimeImport);
					}
				}

				for (const message of state.messages) {
					transformTaggedTemplateExpression(s, message, translator);
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
		{
			name: 'vite-plugin-sveltext-validation-recovery',
			apply: 'serve',
			enforce: 'post',
			transform: {
				order: 'post',
				handler(_code, id) {
					if (devServer && failedModules.delete(id)) {
						devServer.ws.send({ type: 'full-reload' });
					}
				},
			},
		},
	];
}
