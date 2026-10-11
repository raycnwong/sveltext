---
'sveltext': minor
---

Support importing `t` directly in TypeScript and JavaScript helpers, formatters, and validation callbacks, using the same translation context as Svelte components and `<T>`.

Add `withSveltext` from `sveltext/server` to isolate server translation contexts per request, including across asynchronous work. SSR applications must now wrap rendering and server translations in this scope, which requires a runtime supporting `node:async_hooks` and `AsyncLocalStorage`.

In the browser, `SveltextRoot` initializes one app-wide locale and catalog shared by components and helpers. Recreate the root when switching locales and recompute existing translated strings. Use `msg` for module-level constants that should be translated later.
