---
'sveltext': patch
---

Update runtime and development dependencies and preserve Vite source-map compatibility with magic-string 1.x.

**Breaking compatibility change:** `sveltext` now requires Node.js 22.12.0 or newer for its CLI and build tooling, matching Commander 15. This minimum is declared in `engines.node`. Upgrade Node.js before installing this version if you use an older release.
