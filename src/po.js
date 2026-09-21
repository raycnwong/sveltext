import {
	parse as icuParse,
	isPluralElement,
	isLiteralElement,
	isPoundElement,
	isArgumentElement,
} from '@formatjs/icu-messageformat-parser';

/**
 * @param {string} message
 */
export function parseMessage(message) {
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
			/** @type {Record<string, string[]>} */
			const selectors = {};
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
