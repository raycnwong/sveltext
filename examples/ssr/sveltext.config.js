/** @type {import('sveltext').Config} */
const config = {
	locales: ['en', 'zh-HK', 'ja'],
	sourceLocale: 'en',
	catalog: {
		path: 'src/locales',
		include: ['src']
	}
};

export default config;
