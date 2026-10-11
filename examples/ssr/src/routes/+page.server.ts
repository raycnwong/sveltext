import { t } from 'sveltext';
import type { Actions } from './$types';

export const actions = {
	setLocale: async (event) => {
		const formData = await event.request.formData();
		const nextLocale = formData.get('locale');
		if (typeof nextLocale === 'string') {
			event.cookies.set('currentLocale', nextLocale, { path: '/', httpOnly: false, secure: false });
		}
	},
	sendEmail: async (event) => {
		const {
			locals: { currentLocale }
		} = event;
		// The server hook keeps the translation context active across async work.
		await Promise.resolve();
		const name = 'John';
		const title = t`Test Email to ${name}`;
		const body = t`Hello ${name} from SvelteKit form actions!`;
		console.log(
			`Sending email to the user with ${currentLocale}:\n\nTitle: ${title}\nBody: ${body}`
		);
	}
} satisfies Actions;
