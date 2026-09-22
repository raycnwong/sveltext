import { po } from 'gettext-parser';
import { parseMessage } from './message.ts';
import { generateMessageId } from './core.ts';

export function parsePo(code: string) {
	const parsedPo = po.parse(code);
	const messages = Object.create(null);

	for (const translations of Object.values(parsedPo.translations)) {
		for (const key in translations) {
			if (key === '') continue;
			const msgid = translations[key]['msgid'];
			const context = translations[key]['msgctxt'] || '';
			const hashedMsgid = generateMessageId(msgid, context);
			const message = (translations[key]['msgstr'][0] || msgid).replace(/\\n/g, '\n');
			messages[hashedMsgid] = parseMessage(message);
		}
	}

	return messages;
}
