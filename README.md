# Preliquify

Compile Preact components to Shopify Liquid templates with automatic client-side hydration.

## Features

- **SSR + Hydration** - Server-render Liquid templates, hydrate with Preact on client
- **Liquid Primitives** - `<For>`, `<Conditional>` compile to native Liquid loops/conditionals
- **Auto-Bundling** - Generates component bundles with registration automatically
- **Smart Compilation** - Only compiles files using `createLiquidSnippet`
- **Type-Safe** - Full TypeScript support

## Installation

```bash
pnpm add -D @preliquify/cli @preliquify/preact
```

## Quick Start

**1. Config** (`preliquify.config.ts`):

```typescript
import type { PreliquifyConfig } from '@preliquify/cli';

export default {
  entryPoint: './src/snippets',
  outLiquidDir: './snippets',
  outClientDir: './assets',
};
```

**2. Component** (`src/snippets/ProductCard.tsx`):

```tsx
import { createLiquidSnippet } from '@preliquify/preact';

function ProductCard({ product }) {
  return (
    <div className="card">
      <h3>{product.title}</h3>
      <p>${product.price}</p>
    </div>
  );
}

export default createLiquidSnippet(ProductCard, {
  product: 'product'
});
```

**3. Build:**

```bash
pnpm preliquify build
```

**Generates:**
- `snippets/ProductCard-prlq.liquid`
- `assets/ProductCard-prlq.bundle.js`
- `assets/preliquify-prlq.runtime.js`

**4. Theme setup** (one-time):

```liquid
<!-- theme.liquid -->
<script src="{{ 'preliquify-prlq.runtime.js' | asset_url }}" defer></script>
<script src="{{ 'ProductCard-prlq.bundle.js' | asset_url }}" defer></script>
```

**5. Use:**

```liquid
{% render 'ProductCard-prlq', product: product %}
```

## Liquid Primitives

### For Loops

```tsx
import { For, $ } from '@preliquify/preact';

<For each={$.var('products')} as="product">
  {(product, i) => (
    <div key={i}>
      <img src={product.image} />
      <h3>{product.title}</h3>
    </div>
  )}
</For>
```

Compiles to:

```liquid
{% for product in products %}
  <div>
    <img src="{{ product.image }}" />
    <h3>{{ product.title }}</h3>
  </div>
{% endfor %}
```

### Conditionals

```tsx
import { Conditional, $ } from '@preliquify/preact';

<Conditional when={$.var('customer.logged_in')}>
  <p>Welcome, {{ customer.name }}!</p>
</Conditional>
```

Compiles to:

```liquid
{% if customer.logged_in %}
  <p>Welcome, {{ customer.name }}!</p>
{% endif %}
```

### Expressions

```tsx
import { $ } from '@preliquify/preact';

// Variables
$.var('product.title')

// Literals
$.lit('hello')

// Comparisons
$.eq($.var('type'), $.lit('shirt'))

// Logical
$.and($.var('a'), $.var('b'))
$.or($.var('a'), $.var('b'))
$.not($.var('hidden'))

// Contains
$.contains($.var('tags'), $.lit('sale'))
```

## Configuration

```typescript
export default {
  entryPoint: './src/snippets',      // Required: where to scan
  outLiquidDir: './snippets',        // Required: Liquid output
  outClientDir: './assets',          // Required: JS output
  
  generateClientBundles: true,       // Default: true
  minify: true,                      // Default: true
  suffixDistFiles: true,             // Default: true (adds -prlq)
  verbose: false,                    // Default: false
  watch: false,                      // Default: false
};
```

### Entry Point Options

```typescript
// Single directory
entryPoint: './src/snippets'

// Multiple directories
entryPoint: ['./src/snippets', './src/blocks']

// Specific files
entryPoint: ['./src/ProductCard.tsx', './src/Hero.tsx']

// Glob pattern
entryPoint: './src/**/*.snippet.tsx'
```

## File Organization

```
src/
  snippets/              # createLiquidSnippet files → compiled
    ProductCard.tsx
    MediaGallery.tsx
    
  components/            # Regular components → bundled
    ProductImage.tsx
    Gallery.tsx
```

Only `snippets/` files with `createLiquidSnippet` are compiled. Components are auto-bundled.

## CLI

```bash
preliquify build              # Build once
preliquify build --watch      # Watch mode
preliquify build --verbose    # Detailed output
```

## How It Works

1. Scans `entryPoint` for files with `createLiquidSnippet`
2. Renders components with `TargetProvider` set to "liquid"
3. Generates `.liquid` templates with hydration metadata
4. Bundles components to `.bundle.js` with auto-registration
5. Generates shared `preliquify-prlq.runtime.js`

At runtime:
1. Liquid renders SSR content
2. Runtime discovers `[data-preliq-island]` elements
3. Bundles register components
4. Runtime hydrates islands with props from `data-preliq-props`

## Documentation

- [Quick Reference](./docs/quick-reference.md) - Common patterns
- [Entry Points](./docs/entry-points.md) - File organization
- [Client Bundles](./docs/client-bundles.md) - Bundling & hydration
- [Primitives](./docs/primitives.md) - Liquid components
- [Best Practices](./docs/best-practices.md) - Patterns

## Development

```bash
pnpm install
pnpm build
pnpm test
```

## License

MIT
