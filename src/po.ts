import {
	parse as icuParse,
	isPluralElement,
	isLiteralElement,
	isPoundElement,
	isArgumentElement,
} from '@formatjs/icu-messageformat-parser';

export function parseMessage(message: string) {
	const result = [];
	let parsedIcu;
	try {
		parsedIcu = icuParse(message);
	} catch {
		return [message];
	}
	for (const element of parsedIcu) {
		if (isLiteralElement(element)) {
			result.push(element.value);
		}
		if (isArgumentElement(element)) {
			result.push(element.value);
		}
		if (isPluralElement(element)) {
			const selectors: Record<string, string[]> = {};
			for (const option in element.options) {
				const selector = element.options[option].value.map((optionElement) => {
					if (isPoundElement(optionElement)) return '#';
					return optionElement.value;
				});
				selectors[option] = selector;
			}
			result.push([element.value, 'plural', selectors]);
		}
	}
	return result;
}
