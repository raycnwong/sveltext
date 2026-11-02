import { render } from 'svelte/server';
import { plural, t } from 'sveltext';
import App from './App.svelte';

export { withSveltext } from 'sveltext/server';
export { messages as en } from '../locales/en.po';
export { messages as ja } from '../locales/ja.po';

type Response = { data: { item: { count: number } } };

export function literalLabels() {
	return [
		plural(1000, { one: '# item', other: '# items' }),
		plural(1000.5, { one: '# item (# total)', other: '# items (# total)' }),
	];
}

export function literalTemplateLabels() {
	return [t`1,000 items`, t`1,000.5 items (1,000.5 total)`];
}

export function memberLabel(response: Response) {
	return plural(response.data.item.count, { one: '# item', other: '# items' });
}

export function computedLabel(response: Response) {
	return plural(response['data']['item']['count'], { one: '# item', other: '# items' });
}

export function expressionLabel(count: number) {
	return plural(count + 1, { one: '# item', other: '# items' });
}

export function callLabel(getCount: () => number) {
	return plural(getCount(), { one: '# item', other: '# items' });
}

export function optionalLabel(response: { count?: number | null } | null | undefined) {
	return plural(response?.count ?? 0, { one: '# item', other: '# items' });
}

export function renderSummary(response: Response) {
	return render(App, { props: { response } }).body;
}
