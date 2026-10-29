---
'sveltext': minor
---

Compile `msg`, `t`, and `plural` calls to string descriptors, and decode them consistently in translations and `<T>`. Messages without arguments use only their message ID; interpolated arguments are encoded as string values with shared separator constants.

`MessageDescriptor` is now a string instead of an object with `id` and `args`. Rebuild compiled application code when upgrading and update any code that constructs or reads descriptors directly. The `\x1D` character is reserved as the argument separator and must not appear in interpolated values. Message IDs and catalog hashes are unchanged.
