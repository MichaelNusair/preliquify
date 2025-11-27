# Getting Started with Preliquify

Preliquify allows you to build Shopify Liquid templates using React/Preact components with full TypeScript support.

## Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [Basic Concepts](#basic-concepts)
- [Your First Component](#your-first-component)
- [Building](#building)
- [Next Steps](#next-steps)

## Installation

### Prerequisites

- Node.js >= 18.0.0
- A Shopify theme project

### Install Preliquify

Using npm:
```bash
npm install -D @preliquify/cli @preliquify/preact preact
```

Using pnpm:
```bash
pnpm add -D @preliquify/cli @preliquify/preact preact
```

Using yarn:
```bash
yarn add -D @preliquify/cli @preliquify/preact preact
```

## Quick Start

### 1. Create a Configuration File

Create `preliquify.config.ts` in your project root:

```typescript
import type { PreliquifyConfig } from "@preliquify/cli";

const config: PreliquifyConfig = {
  srcDir: "src/snippets",      // Where your TSX components are
  outLiquidDir: "snippets",     // Where to output Liquid files
  outClientDir: "assets",       // Where to output client JS
};

export default config;
```

### 2. Create Your Component Directory

```bash
mkdir -p src/snippets
```

### 3. Write Your First Component

Create `src/snippets/WelcomeMessage.tsx`:

```tsx
/** @jsxImportSource preact */
import { createLiquidSnippet, Conditional, $ } from "@preliquify/preact";

interface WelcomeMessageProps {
  customerName: string;
}

function WelcomeMessage({ customerName }: WelcomeMessageProps) {
  return (
    <div className="welcome-message">
      <Conditional when={$.var("customer")}>
        <h2>Welcome back, {customerName}!</h2>
      </Conditional>
    </div>
  );
}

export default createLiquidSnippet(WelcomeMessage, {
  customerName: "customer.first_name",
});
```

### 4. Build Your Components

Add a script to your `package.json`:

```json
{
  "scripts": {
    "build:liquid": "preliquify build"
  }
}
```

Run the build:

```bash
npm run build:liquid
```

This generates `snippets/WelcomeMessage-prlq.liquid`.

### 5. Use in Shopify

In your Shopify theme templates (e.g., `sections/header.liquid`):

```liquid
{% render 'WelcomeMessage-prlq' %}
```

## Basic Concepts

### Component Types

Preliquify supports two main patterns:

#### 1. Components with `createLiquidSnippet` (Recommended)

Best for components that need props from Liquid:

```tsx
function ProductCard({ product }) {
  return <div>{product.title}</div>;
}

export default createLiquidSnippet(ProductCard, {
  product: "product",
});
```

#### 2. Direct Liquid Expressions

Best for components that work directly with Liquid syntax:

```tsx
export default function Hero() {
  return (
    <Conditional when={$.var("section.settings.show_banner")}>
      <div className="hero">...</div>
    </Conditional>
  );
}
```

### Primitives

Preliquify provides primitives that compile to Liquid:

- **`<Conditional>`**: Renders `{% if %}` blocks
- **`<For>`**: Renders `{% for %}` loops
- **`<Choose>`**: Renders `{% case %}` statements
- **`<Hydrate>`**: Creates interactive islands

### Expression Builder (`$`)

Build type-safe Liquid expressions:

```tsx
import { $ } from "@preliquify/preact";

// Variables
$.var("product.title")
$.var("customer.email")

// Literals
$.lit("hello")
$.lit(42)

// Operators
$.and($.var("a"), $.var("b"))
$.eq($.var("count"), $.lit(0))
$.contains($.var("tags"), $.lit("sale"))
```

## Your First Component

Let's build a product card step by step:

### Step 1: Define Props

```tsx
interface ProductCardProps {
  product: any;  // Shopify product object
  showPrice: boolean;
  showVendor: boolean;
}
```

### Step 2: Create the Component

```tsx
function ProductCard({ product, showPrice, showVendor }: ProductCardProps) {
  return (
    <div className="product-card">
      <img src={product.featured_image} alt={product.title} />
      <h3>{product.title}</h3>
      
      {showVendor && <p className="vendor">{product.vendor}</p>}
      
      {showPrice && (
        <p className="price">${product.price}</p>
      )}
      
      <a href={product.url}>View Product</a>
    </div>
  );
}
```

### Step 3: Wrap with `createLiquidSnippet`

```tsx
export default createLiquidSnippet(ProductCard, {
  product: "product",
  showPrice: {
    liquidVar: "show_price",
    default: true,
  },
  showVendor: {
    liquidVar: "show_vendor",
    default: false,
  },
});
```

### Step 4: Build and Use

Build:
```bash
npm run build:liquid
```

Use in Liquid:
```liquid
{% for product in collection.products %}
  {% render 'ProductCard-prlq',
    product: product,
    show_price: true,
    show_vendor: false
  %}
{% endfor %}
```

## Building

### Development Mode

Watch for changes and rebuild automatically:

```bash
preliquify build --watch
```

### Production Build

```bash
preliquify build
```

### Verbose Output

See detailed error messages:

```bash
preliquify build --verbose
```

## Next Steps

- [Learn about Primitives](./primitives.md)
- [Working with Liquid Expressions](./expressions.md)
- [Client-Side Hydration](./hydration.md)
- [Best Practices](./best-practices.md)
- [API Reference](./api-reference.md)

## Common Patterns

### Conditional Rendering

```tsx
<Conditional when={$.var("product.available")}>
  <button>Add to Cart</button>
</Conditional>
```

### Looping Over Collections

```tsx
<For each={$.var("products")} as="product">
  <ProductCard product={product} />
</For>
```

### Working with Settings

```tsx
<Conditional when={$.var("section.settings.show_header")}>
  <header>...</header>
</Conditional>
```

## Troubleshooting

### "No .tsx files found"

Make sure your `srcDir` in the config points to the correct directory containing your components.

### Build Errors with `.map()`, `.filter()`, etc.

These JavaScript array methods don't work at build time. Use Preliquify primitives instead:

❌ Don't:
```tsx
{products.map(p => <div>{p.title}</div>)}
```

✅ Do:
```tsx
<For each={$.var("products")} as="p">
  <div>{{ p.title }}</div>
</For>
```

### Component Not Rendering

Make sure you're exporting a default export:

```tsx
export default createLiquidSnippet(MyComponent, mapping);
// or
export default function MyComponent() { ... }
```

## Need Help?

- [GitHub Issues](https://github.com/MichaelNusair/preliquify/issues)
- [Contributing Guide](../CONTRIBUTING.md)

