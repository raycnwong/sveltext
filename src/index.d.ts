declare module 'sveltext' {
	import type { Component, Snippet } from 'svelte';

	export function t(descriptor: TemplateStringsArray, ...args: (string | number)[]): string;
	export function t(descriptor: MessageDescriptor): string;

	export const c: (context: string) => {
		t: (descriptor: TemplateStringsArray, ...args: (string | number)[]) => string;
		msg: typeof msg;
	};

	export type MessageDescriptor = { id: string; args?: Record<string, unknown> };

	export const msg: (
		descriptor: string | TemplateStringsArray,
		...args: (string | number)[]
	) => MessageDescriptor;

	export const plural: (count: number, selectors: Record<string, string>) => string;

	export const T: Component<{ msg: MessageDescriptor; [key: string]: MessageDescriptor | Snippet }>;

	export const SveltextRoot: Component<
		SveltextContext & {
			syncLangAttribute?: boolean;
			onInit?: () => void;
			children: Snippet;
		}
	>;

	export type SveltextContext = {
		messages: MessageCatalog;
		locale: string;
	};

	export const _: (msg: MessageDescriptor, context: SveltextContext) => string;

	export type Config = {
		locales: string[];
		sourceLocale: string;
		catalog: {
			path: string;
			include: string[];
		};
	};

	export type MessageCatalog = Record<string, unknown[]>;
}

declare module 'sveltext/internal' {
	import { t } from 'sveltext';

	export const createSveltextTFunction: () => typeof t;
}

declare module 'sveltext/vite' {
	import type { PluginOption } from 'vite';

	export function sveltext(): PluginOption;
}
