import { render } from 'svelte/server';
import type { SveltextContext } from 'sveltext';
import App from './App.svelte';

export { withSveltext } from 'sveltext/server';
export { formatStatus, validate, shadowedTranslation } from './helpers';
export { messages as en } from '../locales/en.po';
export { messages as ja } from '../locales/ja.po';

export function renderTranslations(context: SveltextContext) {
	return render(App, { props: context }).body;
}
