import { _, type MessageDescriptor, type MessageCatalog } from './runtime.ts';
export type { MessageCatalog, MessageDescriptor };
export { _ };
export { default as T } from './T.svelte';
export { default as SveltextRoot } from './SveltextRoot.svelte';
export function t(descriptor: TemplateStringsArray, ...args: (string | number)[]): string;
export function t(descriptor: MessageDescriptor): string;
export function t(...args: any[]): string {
	throw new Error(
		'sveltext: `t()` can only be used inside a Svelte component.\n\nUse `msg` for lazy translation, or `_` for server-side usage.',
	);
}
export function msg(
	descriptor: TemplateStringsArray,
	...args: (string | number)[]
): MessageDescriptor;
export function msg(): MessageDescriptor {
	throw new Error('sveltext: Unexpected `msg` function call on runtime.');
}
export const c = (context: string): { t: typeof t; msg: typeof msg } => {
	throw new Error('sveltext: Unexpected `c` function call on runtime.');
};
export function plural(count: number, selectors: Record<string, string>): string;
export function plural(): string {
	throw new Error('sveltext: Unexpected `plural` function call on runtime.');
}
