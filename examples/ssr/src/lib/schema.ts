import { msg } from 'sveltext';
import { z } from 'zod';

const MIN_LENGTH = 1;

export const textSchema = z.object({
	text: z
		.string()
		.min(MIN_LENGTH, msg`Enter at least ${MIN_LENGTH} character.`)
		.max(6, msg`Enter no more than 6 characters.`)
});
