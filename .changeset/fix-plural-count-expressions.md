---
'sveltext': patch
---

Fix `plural()` with member access and other count expressions, including calls nested in translated Svelte templates. Evaluate each count expression only once.
