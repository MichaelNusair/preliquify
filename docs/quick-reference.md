# Quick Reference

## Single Command Workflow

```bash
# Everything in one command!
$ pnpm preliquify build

🔍 Scanning for Liquid snippets...
✅ Found 3 snippet(s) to compile

✅ Generated client runtime: assets/preliquify-prlq.runtime.js
📦 Generating client component bundles...
  ✓ MediaGalleryWidget-prlq.bundle.js
  ✓ ProductCard-prlq.bundle.js
  ✓ Hero-prlq.bundle.js
✅ Generated 3 client bundle(s)
```

## What Gets Generated

```
Output:
  snippets/
    MediaGalleryWidget-prlq.liquid    ← SSR template with {% for %} loops
    ProductCard-prlq.liquid
    Hero-prlq.liquid
    
  assets/
    preliquify-prlq.runtime.js        ← Hydration framework (shared)
    MediaGalleryWidget-prlq.bundle.js ← Component + auto-registration
    ProductCard-prlq.bundle.js
    Hero-prlq.bundle.js
```

## Minimal Config

```typescript
// preliquify.config.ts
import type { PreliquifyConfig } from '@preliquify/cli';

export default {
  entryPoint: './src/snippets',
  outLiquidDir: './snippets',
  outClientDir: './assets',
};
```

## Minimal Component

```tsx
// src/snippets/ProductCard.tsx
import { createLiquidSnippet } from '@preliquify/preact';

function ProductCard({ product }) {
  return <div className="card">{product.title}</div>;
}

export default createLiquidSnippet(ProductCard, {
  product: 'product'
});
```

## Theme Setup (One Time)

```liquid
<!-- theme.liquid -->
<body>
  {{ content_for_layout }}
  
  <script src="https://unpkg.com/preact@10/dist/preact.umd.js"></script>
  <script>window.preact = { h: preactUmd.h, render: preactUmd.render };</script>
  <script src="{{ 'preliquify-prlq.runtime.js' | asset_url }}" defer></script>
  <script src="{{ 'ProductCard-prlq.bundle.js' | asset_url }}" defer></script>
</body>
```

## Use Snippets

```liquid
{% render 'ProductCard-prlq', product: product %}
```

That's it! Component renders server-side and auto-hydrates on client.

## Common Patterns

### Loop with Liquid Primitives

```tsx
import { For, $ } from '@preliquify/preact';

<For each={$.var('products')} as="product">
  {(product, i) => (
    <div key={i}>
      <h3>{product.title}</h3>
      <img src={product.image} />
    </div>
  )}
</For>
```

Generates:
```liquid
{% for product in products %}
  <div>
    <h3>{{ product.title }}</h3>
    <img src="{{ product.image }}" />
  </div>
{% endfor %}
```

### Conditional Rendering

```tsx
import { Conditional, $ } from '@preliquify/preact';

<Conditional when={$.var('customer.logged_in')}>
  <p>Welcome back, {{ customer.name }}!</p>
</Conditional>
```

Generates:
```liquid
{% if customer.logged_in %}
  <p>Welcome back, {{ customer.name }}!</p>
{% endif %}
```

### Interactive Component

```tsx
import { useState } from 'preact/hooks';
import { createLiquidSnippet } from '@preliquify/preact';

function Counter({ initialCount }) {
  const [count, setCount] = useState(initialCount);
  
  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(c => c + 1)}>Increment</button>
    </div>
  );
}

export default createLiquidSnippet(Counter, {
  initialCount: { liquidVar: 'count', default: 0 }
});
```

Server renders the initial state, then hydrates with full interactivity!

## Configuration Options

```typescript
export default {
  // Required
  entryPoint: './src/snippets',     // Where to scan
  outLiquidDir: './snippets',       // Liquid output
  outClientDir: './assets',         // JS output
  
  // Optional
  generateClientBundles: true,      // Generate .bundle.js files (default: true)
  minify: true,                     // Minify bundles (default: true)
  suffixDistFiles: true,            // Add -prlq suffix (default: true)
  watch: false,                     // Watch mode (default: false)
  verbose: false,                   // Detailed logging (default: false)
  jsxImportSource: 'preact',        // JSX pragma (default: 'preact')
};
```

## CLI Commands

```bash
# Build once
$ pnpm preliquify build

# Watch mode
$ pnpm preliquify build --watch

# Verbose output
$ pnpm preliquify build --verbose

# Custom config file
$ pnpm preliquify build --config ./my-config.ts
```

## File Organization

```
src/
  snippets/              # Entry points with createLiquidSnippet
    MediaGallery.tsx     → Compiled to .liquid + .bundle.js
    ProductCard.tsx      → Compiled to .liquid + .bundle.js
    Hero.tsx             → Compiled to .liquid + .bundle.js
    
  components/            # Library components
    Gallery.tsx          → Bundled into snippets (not compiled separately)
    Slider.tsx           → Bundled into snippets
    ProductImage.tsx     → Bundled into snippets
    
  hooks/                 # Custom hooks
    useMediaQuery.ts     → Bundled as needed
```

Only `snippets/` is scanned. Components are automatically bundled when imported.

## What You Don't Need

- ❌ Vite configuration
- ❌ Rollup configuration
- ❌ Manual registration code
- ❌ Multiple build commands
- ❌ Script tags in every component

## What You Do Need

- ✅ `createLiquidSnippet` in entry point files
- ✅ Include scripts in theme layout (one time)
- ✅ Render snippets in Liquid templates

That's it!

