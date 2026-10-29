# sveltext

## 0.3.0

### Minor Changes

- [#34](https://github.com/raycnwong/sveltext/pull/34) [`f552ef0`](https://github.com/raycnwong/sveltext/commit/f552ef0b26cdb67ee3a534f905964c0b92b30b88) Thanks [@raycnwong](https://github.com/raycnwong)! - Compile `msg`, `t`, and `plural` calls to string descriptors, and decode them consistently in translations and `<T>`. Messages without arguments use only their message ID; interpolated arguments are encoded as string values with shared separator constants.

  `MessageDescriptor` is now a string instead of an object with `id` and `args`. Rebuild compiled application code when upgrading and update any code that constructs or reads descriptors directly. The `\x1D` character is reserved as the argument separator and must not appear in interpolated values. Message IDs and catalog hashes are unchanged.

- [#26](https://github.com/raycnwong/sveltext/pull/26) [`3cea167`](https://github.com/raycnwong/sveltext/commit/3cea1677748a503aff04ef80a90171486588c9c7) Thanks [@raycnwong](https://github.com/raycnwong)! - enhance: add validations for T component snippets.

- [#28](https://github.com/raycnwong/sveltext/pull/28) [`fab9974`](https://github.com/raycnwong/sveltext/commit/fab9974e833f1ae8caf52ba2889988c3f45d5aea) Thanks [@raycnwong](https://github.com/raycnwong)! - fix: reload the development server page after fixing sveltext validation errors so hot module replacement recovers.

- [#30](https://github.com/raycnwong/sveltext/pull/30) [`23bf2d3`](https://github.com/raycnwong/sveltext/commit/23bf2d36da0d61dcca51a9edd04978763fef1ed1) Thanks [@raycnwong](https://github.com/raycnwong)! - Support importing `t` directly in TypeScript and JavaScript helpers, formatters, and validation callbacks, using the same translation context as Svelte components and `<T>`.

  Add `withSveltext` from `sveltext/server` to isolate server translation contexts per request, including across asynchronous work. SSR applications must now wrap rendering and server translations in this scope, which requires a runtime supporting `node:async_hooks` and `AsyncLocalStorage`.

  In the browser, `SveltextRoot` initializes one app-wide locale and catalog shared by components and helpers. Recreate the root when switching locales and recompute existing translated strings. Use `msg` for module-level constants that should be translated later.

### Patch Changes

- [#31](https://github.com/raycnwong/sveltext/pull/31) [`ad0d01e`](https://github.com/raycnwong/sveltext/commit/ad0d01ea81caae4cd5081f0b5001eb2c974d52cf) Thanks [@raycnwong](https://github.com/raycnwong)! - Warn in development when a msgid is missing from the PO catalog.

## 0.2.0

### Minor Changes

- [#17](https://github.com/raycnwong/sveltext/pull/17) [`a0de30c`](https://github.com/raycnwong/sveltext/commit/a0de30c86c1636105970c47422147c3f1599cf8a) Thanks [@raycnwong](https://github.com/raycnwong)! - enhance: add msgid check to build step

## 0.1.2

### Patch Changes

- [#14](https://github.com/raycnwong/sveltext/pull/14) [`ceae843`](https://github.com/raycnwong/sveltext/commit/ceae843e9e4b1a86186f6466e6f89e80860a1402) Thanks [@raycnwong](https://github.com/raycnwong)! - refactor: migrate to TypeScript

## 0.1.1

### Patch Changes

- [#8](https://github.com/raycnwong/sveltext/pull/8) [`de33c25`](https://github.com/raycnwong/sveltext/commit/de33c250ff597b6db2f32ec85c4bc2667d6f7804) Thanks [@raycnwong](https://github.com/raycnwong)! - fix: avoid crash when `t()` is the only lazy translation call

## 0.1.0

### Minor Changes

- [#5](https://github.com/raycnwong/sveltext/pull/5) [`7700a63`](https://github.com/raycnwong/sveltext/commit/7700a63df80378b22f31d303cfc971893ce9a74b) Thanks [@raycnwong](https://github.com/raycnwong)! - fix(ssr)!: prevent cross-request state pollution
