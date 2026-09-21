import { program, Command } from 'commander';
import { parse } from 'svelte/compiler';
import gettextParser from 'gettext-parser';
import { Parser } from 'acorn';
import { tsPlugin } from '@sveltejs/acorn-typescript';
import fs from 'node:fs/promises';
import { styleText } from 'node:util';
import path from 'node:path';
import { resolveConfig, traverse } from './core.js';

export async function runExtract() {
	const TsParser = Parser.extend(tsPlugin());

	const state = {
		startTime: Date.now(),
		messageCount: 0,
		contextualMessageCount: 0,
		scannedFiles: 0,
		catalogs: [],
		messages: new Map(),
	};

	const config = await resolveConfig();

	for await (const entry of fs.glob(
		config.catalog.include.map((include) => path.join(include, '**/*.{js,ts,svelte}')),
	)) {
		const code = (await fs.readFile(entry)).toString('utf-8');
		if (code.includes('sveltext')) {
			/** @type {import('./core.js').State} */
			let _state = { messages: [], error: null, tImport: null };
			/** @type {import('./core.js').AST} */
			let ast;

			if (entry.endsWith('.svelte')) {
				ast = parse(code, { modern: true });
			} else {
				ast = TsParser.parse(code, {
					sourceType: 'module',
					ecmaVersion: 'latest',
					locations: true,
				});
			}

			traverse(ast, _state, config.sourceLocale);

			if (_state.error !== null) {
				program.error(`Error in ${entry} ${_state.error.message}`);
			}

			for (const message of _state.messages) {
				if (!state.messages.has(message.context)) {
					state.messages.set(message.context, new Set());
				}
				state.messages.get(message.context).add(message.message);
				state.messageCount += 1;
				if (message.context !== '') state.contextualMessageCount += 1;
			}
		}
		state.scannedFiles += 1;
	}

	for await (const entry of fs.glob(
		config.locales.map((locale) => path.join(config.catalog.path, `${locale}.po`)),
	)) {
		state.catalogs.push(path.basename(entry));
		const code = (await fs.readFile(entry)).toString('utf-8');
		const parsedPo = gettextParser.po.parse(code);
		let pr;
		try {
			pr = new Intl.PluralRules(parsedPo.headers.Language);
		} catch (err) {
			throw new Error(
				`Language header of the following po file is invalid.\n${entry}\nPlease make sure it is a BCP 47 language tag.\nRef: https://developer.mozilla.org/docs/Glossary/BCP_47_language_tag`,
			);
		}

		if (!parsedPo.obsolete) {
			parsedPo.obsolete = Object.create(null);
		}

		if (!parsedPo.translations) {
			parsedPo.translations = Object.create(null);
		}

		/**
		 * Promote obsolete -> translations if now in use
		 */
		for (const context in parsedPo.obsolete) {
			for (const msgid in parsedPo.obsolete[context]) {
				if (state.messages.has(context) && state.messages.get(context).has(msgid)) {
					if (!parsedPo.translations[context]) {
						parsedPo.translations[context] = Object.create(null);
					}
					parsedPo.translations[context][msgid] = parsedPo.obsolete[context][msgid];
					delete parsedPo.obsolete[context][msgid];
				}
			}
		}

		/**
		 * Demote translations -> obsolete if no longer in use
		 */
		for (const context in parsedPo.translations) {
			if (!state.messages.has(context)) {
				/**
				 * The entire context is no longer in use
				 */
				if (context in parsedPo.obsolete) {
					parsedPo.obsolete[context] = {
						...parsedPo.obsolete[context],
						...parsedPo.translations[context],
					};
				} else {
					parsedPo.obsolete[context] = parsedPo.translations[context];
				}
				delete parsedPo.translations[context];
				continue;
			}

			for (const msgid in parsedPo.translations[context]) {
				if (!state.messages.get(context).has(msgid)) {
					if (!parsedPo.obsolete[context]) {
						parsedPo.obsolete[context] = Object.create(null);
					}
					parsedPo.obsolete[context][msgid] = parsedPo.translations[context][msgid];
					delete parsedPo.translations[context][msgid];
				}
			}
		}

		/**
		 * Add any new in-use messages not present anywhere
		 */
		for (const [context, messages] of state.messages) {
			if (!parsedPo.translations[context]) {
				parsedPo.translations[context] = Object.create(null);
			}
			for (const message of messages) {
				if (!parsedPo.translations[context][message]) {
					let msgstr;
					if (
						parsedPo.headers.Language !== config.sourceLocale &&
						message.startsWith('{') &&
						message.includes(', plural, ') &&
						message.endsWith('}')
					) {
						const tokens = message.slice(1, message.length - 1).split(', ');
						tokens[2] = pr.resolvedOptions().pluralCategories.map((category) => `${category} {#}`);
						msgstr = [`{${tokens.join(', ')}}`];
					} else {
						msgstr = [''];
					}
					parsedPo.translations[context][message] = {
						msgid: message,
						msgstr,
						...(context && {
							msgctxt: context,
						}),
					};
				}
			}
		}

		await fs.writeFile(
			entry,
			gettextParser.po.compile(parsedPo, {
				foldLength: 0,
				sort,
			}),
		);
	}

	const { startTime, scannedFiles, messageCount, contextualMessageCount, catalogs } = state;
	const duration = Date.now() - startTime;
	console.log(`
✓ Scanned ${bold(scannedFiles)} files
✓ Extracted ${bold(messageCount)} messages ${contextualMessageCount > 0 ? `(${bold(contextualMessageCount)} with context)` : ''}
✓ ${bold(catalogs.length)} catalogs written
${catalogs.map((catalog) => `  • ${catalog}`).join('\n')}

Done in ${bold(`${duration}ms`)}
`);
}

function bold(text) {
	return styleText(['bold'], text.toString());
}

function sort({ msgid: left }, { msgid: right }) {
	const lowerLeft = left.toLowerCase();
	const lowerRight = right.toLowerCase();

	if (lowerLeft < lowerRight) {
		return -1;
	}

	if (lowerLeft > lowerRight) {
		return 1;
	}

	return 0;
}

export const extract = new Command('extract')
	.description('Extract messages from source code files')
	.action(async () => {
		await runExtract();
	});
