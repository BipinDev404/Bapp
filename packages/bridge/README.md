# @bapp/bridge

The optional website SDK for Bapp native capabilities. Every method is Promise-based and safe to import in a normal browser. Check `Bapp.isApp()` or `Bapp.isAvailable()` before enabling app-only experiences.

```ts
import { Bapp } from '@bapp/bridge';

if (Bapp.isApp()) {
  await Bapp.share.sharePage(location.href);
}
```

The generated shell exposes the same API on Android and iOS. Browser usage remains available for ordinary website behavior; unavailable native calls reject with a descriptive error.
