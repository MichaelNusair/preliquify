# Quick Reference

## Build

```bash
# If installed:
preliquify build
preliquify build --watch
preliquify build --verbose

# Or with npx (no installation needed):
npx @preliquify/cli build
npx @preliquify/cli build --watch
npx @preliquify/cli build --verbose
```

## Config

```typescript
// preliquify.config.ts
export default {
  entryPoint: "./src/snippets",
  outLiquidDir: "./snippets",
  outClientDir: "./assets",
};
```

## Component

```tsx
import { createLiquidSnippet } from "@preliquify/preact";

function MyComponent({ product }) {
  return <div>{product.title}</div>;
}

export default createLiquidSnippet(MyComponent, {
  product: "product",
});
```

## For Loop

```tsx
import { For, $ } from "@preliquify/preact";

<For each={$.var("products")} as="product">
  {(product, i) => <div key={i}>{product.title}</div>}
</For>;
```

## Conditional

```tsx
import { Conditional, $ } from "@preliquify/preact";

<Conditional when={$.var("customer.logged_in")}>
  <p>Welcome!</p>
</Conditional>;
```

## Expressions

```tsx
$.var("product.title"); // Variable
$.lit("hello"); // Literal
$.eq($.var("type"), $.lit("shirt")); // Equal
$.contains($.var("tags"), $.lit("sale")); // Contains
```

## Theme

```liquid
<!-- theme.liquid -->
<script src="{{ 'preliquify-prlq.runtime.js' | asset_url }}" defer></script>
<script src="{{ 'MyComponent-prlq.bundle.js' | asset_url }}" defer></script>
```

## Render

```liquid
{% render 'MyComponent-prlq', product: product %}
```
