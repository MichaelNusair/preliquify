# Preliquify

Compile Preact components to Shopify Liquid templates with client-side hydration.

## Install

```bash
pnpm add -D @preliquify/cli @preliquify/preact
```

## Quick Start

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
import { createLiquidSnippet, For, Conditional, $ } from "@preliquify/preact";

function ProductCard({ product, showPrice }) {
  return (
    <div className="product-card">
      <h3>{product.title}</h3>
      <Conditional when={showPrice}>
        <p className="price">${product.price}</p>
      </Conditional>
    </div>
  );
}

export default createLiquidSnippet(ProductCard, {
  product: "product",
  showPrice: "showPrice",
});
```

**Build:**

```bash
preliquify build
# Or with npx:
npx @preliquify/cli build
```

**Theme** (`theme.liquid`):

```liquid
<script src="{{ 'preliquify-prlq.runtime.js' | asset_url }}" defer></script>
<script src="{{ 'ProductCard-prlq.bundle.js' | asset_url }}" defer></script>
```

**Render:**

```liquid
{% render 'ProductCard-prlq', product: product, showPrice: true %}
```

## Core Concepts

Preliquify components compile to work in **two targets**:

1. **Liquid** (build time) - Generates Shopify Liquid template code
2. **Client** (runtime) - Hydrates with actual data in the browser

Your components should work in **both targets** without duplicating code. Use Preliquify primitives and expressions to write code once that works everywhere.

## Primitives

### Loops: `<For>`

Use `<For>` instead of JavaScript `.map()` for Liquid collections. It works in both targets.

```tsx
import { For, $ } from '@preliquify/preact';

// Simple loop
<For each={$.var('products')} as="product">
  <div>
    <h3>{{ product.title }}</h3>
    <p>{{ product.price }}</p>
  </div>
</For>

// Loop with render function
<For each={$.var('products')} as="product">
  {(product, index) => (
    <div key={index}>
      <img src={"{{ product.image }}"} alt={"{{ product.title }}"} />
      <h3>{{ product.title }}</h3>
    </div>
  )}
</For>
```

**Why not `.map()`?** JavaScript `.map()` only works at runtime. Liquid collections are strings at build time. `<For>` generates Liquid `{% for %}` loops and works with runtime arrays.

### Conditionals: `<Conditional>`

Use `<Conditional>` instead of JavaScript `&&` or ternary operators for Liquid data.

```tsx
import { Conditional, $ } from '@preliquify/preact';

<Conditional when={$.var('customer.logged_in')}>
  <p>Welcome back, {{ customer.name }}!</p>
</Conditional>

// Multiple conditions
<Conditional when={$.and($.var('customer.logged_in'), $.var('cart.item_count'))}>
  <p>You have items in your cart!</p>
</Conditional>
```

**Why not `&&`?** JavaScript conditionals only work at runtime. `<Conditional>` generates Liquid `{% if %}` blocks and evaluates at runtime.

### Multi-way Branching: `<Choose>`

For 3+ branches, use `<Choose>` instead of multiple `<Conditional>` components.

```tsx
import { Choose, $ } from '@preliquify/preact';

<Choose
  value={$.var('product.type')}
  cases={{
    shirt: <ShirtComponent />,
    pants: <PantsComponent />,
    shoes: <ShoesComponent />,
  }}
  default={<OtherComponent />}
/>
```

Compiles to Liquid `{% case %}` statements, which is cleaner than multiple `{% if %}` blocks.

## Expression Builder: `$`

The `$` helper creates expressions that work in both Liquid and client contexts.

### Basic Expressions

```tsx
import { $ } from '@preliquify/preact';

// Variables
$.var('product.title')           // Access Liquid variables
$.var('customer.email')          // Nested paths work

// Literals
$.lit('hello')                   // String literal
$.lit(42)                        // Number literal
$.lit(true)                      // Boolean literal

// Comparisons
$.eq($.var('product.type'), $.lit('shirt'))    // ==
$.contains($.var('product.tags'), $.lit('sale')) // contains

// Logic
$.and(expr1, expr2)              // and
$.or(expr1, expr2)               // or
$.not(expr1)                     // not
```

### Property Access: `$.prop()`

Access nested properties on expressions:

```tsx
const settings = $.var('designSettings.desktopSettings');
const layoutType = $.prop(settings, 'layoutType');
// Equivalent to: $.var('designSettings.desktopSettings.layoutType')
```

### Passing Props to Children: `$.from()`

When passing data from parent to child, use `$.from()` to preserve the Liquid path:

```tsx
// Parent component
function MediaGallery({ storeMetafield }) {
  return (
    <MediaSettings
      designSettings={$.from(
        'storeMetafield.designSettings',
        storeMetafield.designSettings
      )}
    />
  );
}

// Child component
function MediaSettings({ designSettings }) {
  // Convert to Expr if needed
  const settings = $.asExpr(designSettings);
  // Now can access nested properties
  const mobileLayout = $.prop(settings, 'mobileSettings');
  const layoutType = $.prop(mobileLayout, 'layoutType');
  // Liquid: storeMetafield.designSettings.mobileSettings.layoutType
}
```

### Conditional Paths: `$.when()`

Select different Liquid paths based on conditions:

```tsx
const settings = $.when(
  isMobile,
  $.var('designSettings.mobileSettings'),
  $.var('designSettings.desktopSettings')
);
const layoutType = $.prop(settings, 'layoutType');
```

### Array Operations: `$.map()` and `$.filter()`

Transform and filter arrays safely for both targets:

```tsx
// Map - extract properties or transform
const titles = $.map($.var('products'), (item) => item.var('title'));
// Generates: products | map: 'title'

// Filter - filter by condition
const videos = $.filter($.var('media'), (item) =>
  $.eq(item.var('type'), $.lit('video'))
);
```

## Enhanced Expressions: `$enhanced`

For advanced Liquid filters, use `$enhanced`:

```tsx
import { $enhanced } from '@preliquify/preact';

// String operations
$enhanced.append($.var('product.title'), $.lit(' - Sale'))
$enhanced.upcase($.var('product.title'))
$enhanced.truncate($.var('description'), $.lit(100))

// Number operations
$enhanced.plus($.var('price'), $.lit(10))
$enhanced.times($.var('quantity'), $.var('price'))

// Array operations
$enhanced.size($.var('products'))
$enhanced.first($.var('products'))
$enhanced.sort($.var('products'), $.lit('price'))

// Shopify-specific
$enhanced.money($.var('product.price'))
$enhanced.handle($.var('product.title'))
```

See the full API in the codebase for all available filters.

## Processing Data in Parent Components

**Key Principle:** Process data in parent components using Preliquify expressions, then pass processed data to children. This avoids using `<Target>` and keeps code working in both targets.

### ✅ Good: Process with Expressions

```tsx
function ProductGrid({ products }) {
  // Process data using Preliquify expressions - works in both targets
  const productsExpr = $.var('products');
  const filteredProducts = $.filter(productsExpr, (item) =>
    $.contains(item.var('tags'), $.lit('featured'))
  );
  const sortedProducts = $enhanced.sort(filteredProducts, $.lit('price'));

  return (
    <div className="grid">
      <For each={sortedProducts} as="product">
        <ProductCard product={product} />
      </For>
    </div>
  );
}
```

### ❌ Bad: Using JavaScript Methods

```tsx
function ProductGrid({ products }) {
  // ❌ This only works at runtime, fails at build time
  const filtered = products.filter(p => p.tags.includes('featured'));
  
  return (
    <div className="grid">
      {filtered.map(product => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
```

### ✅ Good: Transform Data with $.map()

```tsx
function MediaGallery({ media }) {
  // Transform using $.map() - works in both targets
  const processedMedia = $.map($.var('media'), (item) => ({
    src: $enhanced.append(item.var('src'), $.lit('?height=800')),
    alt: item.var('alt'),
    type: item.var('type'),
  }));

  return (
    <For each={processedMedia} as="item">
      <MediaItem item={item} />
    </For>
  );
}
```

### ✅ Good: Conditional Data Selection

```tsx
function ResponsiveComponent({ designSettings, isMobile }) {
  // Select the right settings based on condition
  const settings = $.when(
    isMobile,
    $.var('designSettings.mobileSettings'),
    $.var('designSettings.desktopSettings')
  );

  // Pass to child with $.from() to preserve Liquid path
  return (
    <LayoutComponent
      settings={$.from(
        isMobile 
          ? 'designSettings.mobileSettings'
          : 'designSettings.desktopSettings',
        isMobile 
          ? designSettings.mobileSettings
          : designSettings.desktopSettings
      )}
    />
  );
}
```

## When to Use `<Target>`

**Rule:** Only use `<Target>` on **small edge components** when you absolutely need different rendering logic for Liquid vs client. Avoid it in parent components.

### ✅ Acceptable: Small Edge Component

```tsx
// Small component that needs different rendering
function ImageWithLazyLoad({ src, alt }) {
  return (
    <Target
      liquid={
        // Build time: simple img tag
        <img src={"{{ src }}"} alt={"{{ alt }}"} />
      }
      client={
        // Runtime: lazy loading component
        <LazyImage src={src} alt={alt} />
      }
    />
  );
}
```

### ❌ Avoid: Parent Component

```tsx
// ❌ Don't do this - process data instead
function ProductGrid({ products }) {
  return (
    <Target
      liquid={
        <For each={$.var('products')} as="product">
          <ProductCard product={product} />
        </For>
      }
      client={
        <div>
          {products.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      }
    />
  );
}

// ✅ Do this instead - use expressions
function ProductGrid({ products }) {
  return (
    <For each={$.var('products')} as="product">
      <ProductCard product={product} />
    </For>
  );
}
```

### ✅ Acceptable: Hooks in Client-Only Path

If you need React hooks, isolate them in a client-only component:

```tsx
function InteractiveComponent({ data }) {
  return (
    <Target
      liquid={
        <div>Loading...</div>
      }
      client={
        <ComponentWithHooks data={data} />
      }
    />
  );
}

function ComponentWithHooks({ data }) {
  const [state, setState] = useState(0); // ✅ Safe - only called in client
  return <div>{data.title}</div>;
}
```

## Avoiding Code That Only Works in One Target

### ❌ Don't: Use JavaScript Array Methods on Liquid Data

```tsx
// ❌ This fails at build time
function ProductList({ products }) {
  return (
    <div>
      {products.map(p => <ProductCard key={p.id} product={p} />)}
    </div>
  );
}
```

### ✅ Do: Use `<For>` Component

```tsx
// ✅ Works in both targets
function ProductList({ products }) {
  return (
    <For each={$.var('products')} as="product">
      <ProductCard product={product} />
    </For>
  );
}
```

### ❌ Don't: Use JavaScript Conditionals on Liquid Data

```tsx
// ❌ This fails at build time
function WelcomeMessage({ customer }) {
  return customer && <p>Welcome, {customer.name}!</p>;
}
```

### ✅ Do: Use `<Conditional>` Component

```tsx
// ✅ Works in both targets
function WelcomeMessage({ customer }) {
  return (
    <Conditional when={$.var('customer.logged_in')}>
      <p>Welcome, {{ customer.name }}!</p>
    </Conditional>
  );
}
```

### ❌ Don't: Access Properties Directly on Liquid Props

```tsx
// ❌ This fails at build time
function ProductCard({ product }) {
  return <div>{product.title}</div>; // product is a string at build time
}
```

### ✅ Do: Use Expressions or Pass Processed Data

```tsx
// Option 1: Use expressions in component
function ProductCard({ product }) {
  return (
    <div>
      <h3>{{ product.title }}</h3>
      <p>{{ product.price }}</p>
    </div>
  );
}

// Option 2: Process in parent, pass processed data
function ProductGrid({ products }) {
  const titles = $.map($.var('products'), (item) => item.var('title'));
  // titles is now an Expr that works in both targets
  return <For each={titles} as="title">...</For>;
}
```

## Best Practices Summary

1. **Use Preliquify primitives** (`<For>`, `<Conditional>`, `<Choose>`) instead of JavaScript methods
2. **Process data in parent components** using `$` expressions (`$.map()`, `$.filter()`, `$.when()`, etc.)
3. **Pass processed data to children** using `$.from()` to preserve Liquid paths
4. **Avoid `<Target>` in parent components** - only use it for small edge cases
5. **Use expressions for all Liquid data** - never access properties directly on Liquid props
6. **Use `$enhanced` for advanced operations** - string manipulation, math, Shopify filters
7. **Write code once** - if you're duplicating logic for Liquid vs client, you're doing it wrong

## Configuration

See `packages/cli/src/types.ts` for all configuration options:

```typescript
export interface PreliquifyConfig {
  entryPoint?: string | string[];      // Entry point(s) for compilation
  outLiquidDir?: string;                // Output directory for Liquid templates
  outClientDir?: string;                 // Output directory for client assets
  jsxImportSource?: string;              // JSX import source (default: "preact")
  suffixDistFiles?: boolean;            // Suffix dist files with -prlq (default: true)
  generateClientBundles?: boolean;      // Generate client bundles (default: true)
  minify?: boolean;                     // Minify client bundles (default: true)
  tailwind?: boolean | {                // Enable Tailwind CSS processing
    config?: string;
    postcssConfig?: string;
  };
}
```

## Examples

See `examples/shopify-theme/` for complete working examples.
