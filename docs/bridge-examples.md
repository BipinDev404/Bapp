# Bapp Bridge Examples

## TypeScript / React

```ts
import { Bapp } from '@bapp/bridge';

export async function shareCurrentPage() {
  if (!Bapp.isApp()) return;
  await Bapp.share.sharePage(window.location.href);
}
```

## Vue

```ts
import { Bapp } from '@bapp/bridge';

export async function requestLocation() {
  return Bapp.isApp()
    ? Bapp.location.getCurrentPosition()
    : navigator.geolocation.getCurrentPosition;
}
```

## Vanilla JavaScript

```js
if (window.bapp && window.bapp.isApp()) {
  window.bapp.haptics.trigger('light');
}
```

The browser path remains the responsibility of the website. Native bridge calls should always have a browser fallback or an intentional unavailable state.
