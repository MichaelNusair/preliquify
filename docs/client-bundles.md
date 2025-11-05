# Client Bundles

## Overview

Preliquify generates client bundles automatically with auto-registration.

## Build Output

```bash
$ preliquify build

✅ Generated client runtime: assets/preliquify-prlq.runtime.js
📦 Generated 3 client bundle(s)
```

**Files:**
- `preliquify-prlq.runtime.js` - Shared hydration runtime (~4 KB)
- `{ComponentName}-prlq.bundle.js` - Component + registration (~1-2 KB each)

## Usage

```liquid
<!-- theme.liquid -->
<script src="https://unpkg.com/preact@10/dist/preact.umd.js"></script>
<script>window.preact = { h: preactUmd.h, render: preactUmd.render };</script>
<script src="{{ 'preliquify-prlq.runtime.js' | asset_url }}" defer></script>
<script src="{{ 'MediaGallery-prlq.bundle.js' | asset_url }}" defer></script>
```

## Auto-Registration

Each bundle auto-registers on load:

```javascript
// Auto-generated
(function() {
  function registerComponent() {
    if (window.__PRELIQUIFY__?.register) {
      window.__PRELIQUIFY__.register('ComponentName', Component);
      return;
    }
    setTimeout(registerComponent, 10);
  }
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', registerComponent);
  } else {
    registerComponent();
  }
})();
```

Handles race conditions. Works with `defer`, `async`, or normal script tags.

## Configuration

```typescript
export default {
  generateClientBundles: true,  // Default: true
  minify: true,                 // Default: true
};
```

Set `generateClientBundles: false` for SSR-only.

## Conditional Loading

```liquid
{% if template contains 'product' %}
  <script src="{{ 'MediaGallery-prlq.bundle.js' | asset_url }}" defer></script>
{% endif %}
```

## Bundle Sizes

- Runtime: ~4 KB (shared)
- Per component: ~1-2 KB
- Preact: ~4 KB (CDN)

Total: ~10-15 KB for typical page with 3 components.

## Debugging

```javascript
// Check runtime loaded
window.__PRELIQUIFY__

// Check component registered
window.__PRELIQUIFY__.getComponent('ComponentName')

// Check errors
window.__PRELIQUIFY__.getErrors()
```
