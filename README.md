# Preliquify

Compile Preact components to Shopify Liquid templates with client-side hydration.

## Install

```bash
pnpm add -D @preliquify/cli @preliquify/preact
```

## Usage

**Config** (`preliquify.config.ts`):

```typescript
import type { PreliquifyConfig } from "@preliquify/cli";

export default {
  entryPoint: "./src/snippets",
  outLiquidDir: "./snippets",
  outClientDir: "./assets",
};
```

**Component** (`src/snippets/ProductCard.tsx`):

```tsx
import { createLiquidSnippet } from "@preliquify/preact";

function ProductCard({ product }) {
  return <div>{product.title}</div>;
}

export default createLiquidSnippet(ProductCard, {
  product: "product",
});
```

**Build:**

```bash
# If installed:
preliquify build

# Or with npx/pnpx (no installation needed):
npx @preliquify/cli build
```

**Theme** (`theme.liquid`):

```liquid
<script src="{{ 'preliquify-prlq.runtime.js' | asset_url }}" defer></script>
<script src="{{ 'ProductCard-prlq.bundle.js' | asset_url }}" defer></script>
```

**Render:**

```liquid
{% render 'ProductCard-prlq', product: product %}
```

## Primitives

```tsx
import { For, Conditional, $ } from '@preliquify/preact';

// Loops
<For each={$.var('products')} as="product">
  {(product, i) => <div key={i}>{product.title}</div>}
</For>

// Conditionals
<Conditional when={$.var('customer.logged_in')}>
  <p>Welcome!</p>
</Conditional>

// Expressions
$.var('product.title')
$.lit('hello')
$.eq(a, b)
$.contains(collection, item)
```

## Docs

- [Quick Reference](./docs/quick-reference.md)
- [API Reference](./docs/README.md)
