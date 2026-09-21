export { _ } from './runtime.js';
export { default as T } from './T.svelte';
export { default as SveltextRoot } from './SveltextRoot.svelte';
export function t() {
	throw new Error(
		'sveltext: `t()` can only be used inside a Svelte component.\n\nUse `msg` for lazy translation, or `_` for server-side usage.',
	);
}
export const msg = () => {
	throw new Error('sveltext: Unexpected `msg` function call on runtime.');
};
export const c = () => {
	throw new Error('sveltext: Unexpected `c` function call on runtime.');
};
export const plural = () => {
	throw new Error('sveltext: Unexpected `plural` function call on runtime.');
};
