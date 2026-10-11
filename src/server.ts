import { AsyncLocalStorage } from 'node:async_hooks';
import { setServerContextResolver, type SveltextContext } from './runtime.ts';

const requestContext = new AsyncLocalStorage<SveltextContext>();
setServerContextResolver(() => requestContext.getStore());

/** Run server work with a translation context isolated from other requests. */
export function withSveltext<T>(context: SveltextContext, callback: () => T): T {
	return requestContext.run(context, callback);
}
