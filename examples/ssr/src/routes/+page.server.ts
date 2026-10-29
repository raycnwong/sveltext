import { msg, t } from 'sveltext';
import { fail } from '@sveltejs/kit';
import { message, superValidate } from 'sveltekit-superforms/server';
import { zod } from 'sveltekit-superforms/adapters/zod4';
import { textSchema } from '$lib/schema';
import type { Actions, PageServerLoad } from './$types';

export const load = (async () => ({
	form: await superValidate(zod(textSchema))
})) satisfies PageServerLoad;

export const actions = {
	validateText: async ({ request }) => {
		const form = await superValidate(request, zod(textSchema));
		if (!form.valid) return fail(400, { form });
		return message(form, msg`Text accepted.`);
	},

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
