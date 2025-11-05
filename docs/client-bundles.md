# Client Bundle Generation

## Overview

Preliquify automatically generates client-side component bundles with auto-registration.

## Build Output

```bash
$ preliquify build

✅ Generated client runtime: assets/preliquify-prlq.runtime.js
📦 Generated 3 client bundle(s)
```

**Files:**
- `preliquify-prlq.runtime.js` - Shared hydration framework (~4 KB)
- `{ComponentName}-prlq.bundle.js` - Per-component bundles with auto-registration (~1-2 KB each)

## Usage

### Theme Setup

```liquid
<!-- theme.liquid -->
<script src="https://unpkg.com/preact@10/dist/preact.umd.js"></script>
<script>window.preact = { h: preactUmd.h, render: preactUmd.render };</script>
<script src="{{ 'preliquify-prlq.runtime.js' | asset_url }}" defer></script>
<script src="{{ 'MediaGalleryWidget-prlq.bundle.js' | asset_url }}" defer></script>
```

### Render Snippet

```liquid
{% render 'MediaGalleryWidget-prlq', media: product.media %}
```

Component auto-registers and hydrates.

## Configuration

```typescript
// preliquify.config.ts
export default {
  generateClientBundles: true,  // Default: true
  minify: true,                 // Default: true
};
```

Set `generateClientBundles: false` for SSR-only builds.

## Auto-Registration

Each bundle includes registration code:

```javascript
// Auto-generated in each bundle
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

Handles race conditions automatically - works with `defer`, `async`, or normal script tags.

## Performance

- SSR content displays immediately (0 ms)
- Hydration completes in 10-50 ms
- Total JS: ~12 KB (4 KB runtime + 4 KB Preact + 1-2 KB per component)
- All files minified and tree-shaken

## Conditional Loading

```liquid
{% if template contains 'product' %}
  <script src="{{ 'MediaGalleryWidget-prlq.bundle.js' | asset_url }}" defer></script>
{% endif %}
```

## Troubleshooting

**Bundle not loading:**
```javascript
console.log(window.__PRELIQUIFY__); // Should exist
```

**Component not registered:**
```javascript
window.__PRELIQUIFY__.getComponent('ComponentName'); // Should return component
```

**Hydration errors:**
```javascript
window.__PRELIQUIFY__.getErrors(); // Check for errors
```
