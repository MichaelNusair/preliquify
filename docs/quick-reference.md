# Quick Reference

## Build Command

```bash
preliquify build              # Build once
preliquify build --watch      # Watch mode
preliquify build --verbose    # Detailed output
```

## Config

```typescript
// preliquify.config.ts
import type { PreliquifyConfig } from '@preliquify/cli';

export default {
  entryPoint: './src/snippets',      // Required
  outLiquidDir: './snippets',        // Required
  outClientDir: './assets',          // Required
  generateClientBundles: true,       // Default: true
  minify: true,                      // Default: true
  suffixDistFiles: true,             // Default: true
  verbose: false,                    // Default: false
  watch: false,                      // Default: false
};
```

## Component

```tsx
import { createLiquidSnippet } from '@preliquify/preact';

function MyComponent({ product }) {
  return <div>{product.title}</div>;
}

export default createLiquidSnippet(MyComponent, {
  product: 'product'
});
```

## For Loops

```tsx
import { For, $ } from '@preliquify/preact';

<For each={$.var('products')} as="product">
  {(product, i) => <div key={i}>{product.title}</div>}
</For>
```

Generates: `{% for product in products %}...{% endfor %}`

## Conditionals

```tsx
import { Conditional, $ } from '@preliquify/preact';

<Conditional when={$.var('customer.logged_in')}>
  <p>Welcome back!</p>
</Conditional>
```

Generates: `{% if customer.logged_in %}...{% endif %}`

## Theme Integration

```liquid
<!-- theme.liquid -->
<script src="https://unpkg.com/preact@10/dist/preact.umd.js"></script>
<script>window.preact = { h: preactUmd.h, render: preactUmd.render };</script>
<script src="{{ 'preliquify-prlq.runtime.js' | asset_url }}" defer></script>
<script src="{{ 'MyComponent-prlq.bundle.js' | asset_url }}" defer></script>
```

## Render Snippet

```liquid
{% render 'MyComponent-prlq', product: product %}
```

## Expression Builder

```tsx
import { $ } from '@preliquify/preact';

$.var('product.title')                              // Variable
$.lit('hello')                                      // Literal
$.eq($.var('type'), $.lit('shirt'))                // Comparison
$.and($.var('a'), $.var('b'))                      // Logical
$.contains($.var('tags'), $.lit('sale'))           // Contains
```

## File Organization

```
src/
  snippets/           # createLiquidSnippet → compiled
  components/         # Regular components → bundled
  hooks/              # Custom hooks → bundled
```

## Build Output

```
snippets/
  MyComponent-prlq.liquid
  
assets/
  preliquify-prlq.runtime.js           # Shared runtime
  MyComponent-prlq.bundle.js           # Component bundle
```
