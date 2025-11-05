# Preliquify Documentation

Welcome to the Preliquify documentation! This guide will help you build Shopify Liquid templates using React/Preact components with TypeScript.

## Table of Contents

### Getting Started

- [Getting Started Guide](./getting-started.md) - Installation and quick start
- [Basic Concepts](./getting-started.md#basic-concepts) - Core concepts and patterns

### Core Features

- [Primitives](./primitives.md) - `<Conditional>`, `<For>`, `<Choose>`, `<Hydrate>`
- [Expressions](./expressions.md) - Building Liquid expressions with the `$` helper
- [Hydration](./hydration.md) - Client-side interactivity
- [Configuration](./configuration.md) - Configure Preliquify for your project

### Advanced Topics

- [Best Practices](./best-practices.md) - Guidelines for maintainable code
- [API Reference](./api-reference.md) - Complete API documentation
- [Troubleshooting](./troubleshooting.md) - Common issues and solutions

### Additional Resources

- [Examples](../examples/) - Example projects and components
- [Contributing](../CONTRIBUTING.md) - How to contribute to Preliquify
- [Changelog](../CHANGELOG.md) - Version history

## Quick Links

- **GitHub**: [https://github.com/MichaelNusair/preliquify](https://github.com/MichaelNusair/preliquify)
- **Issues**: [Report bugs and request features](https://github.com/MichaelNusair/preliquify/issues)
- **npm**: [@preliquify/cli](https://www.npmjs.com/package/@preliquify/cli)

## What is Preliquify?

Preliquify is a compiler that transforms React/Preact components written in TypeScript/JSX into Shopify Liquid templates. It enables you to:

- ✅ Write type-safe Shopify themes
- ✅ Use modern JSX syntax
- ✅ Build reusable components
- ✅ Get full IDE autocomplete
- ✅ Catch errors at compile time
- ✅ Add client-side interactivity with hydration

## How It Works

```
TypeScript/JSX → Preliquify Compiler → Liquid Templates
     ↓
  Your IDE                                Shopify Theme
```

1. Write components in TypeScript/JSX
2. Preliquify compiles them to Liquid at build time
3. Shopify renders the Liquid at runtime
4. Optional: Hydrate interactive components on the client

## Quick Example

Write this in `src/snippets/ProductCard.tsx`:

```tsx
/** @jsxImportSource preact */
import { createLiquidSnippet } from "@preliquify/preact";

interface ProductCardProps {
  product: any;
  showPrice: boolean;
}

function ProductCard({ product, showPrice }: ProductCardProps) {
  return (
    <div className="product-card">
      <h3>{product.title}</h3>
      {showPrice && <p className="price">${product.price}</p>}
    </div>
  );
}

export default createLiquidSnippet(ProductCard, {
  product: "product",
  showPrice: { liquidVar: "show_price", default: true },
});
```

Get this in `snippets/ProductCard-prlq.liquid`:

```liquid
<div class="product-card">
  <h3>{{ product.title }}</h3>
  {% if show_price %}
    <p class="price">${{ product.price }}</p>
  {% endif %}
</div>
```

Use it in Shopify:

```liquid
{% render 'ProductCard-prlq', product: product, show_price: true %}
```

## Key Features

### Type Safety

Catch errors before deployment:

```tsx
// TypeScript catches this error at build time
<ProductCard product={null} /> // Error: product is required
```

### Liquid Primitives

Use JSX components that compile to Liquid:

```tsx
<Conditional when={$.var("customer.email")}>
  <p>Welcome back!</p>
</Conditional>

<For each={$.var("products")} as="product">
  <ProductCard product={product} />
</For>
```

### Client-Side Hydration

Add interactivity where needed:

```tsx
<Hydrate id="cart" component="ShoppingCart" props={{}}>
  <div>Loading cart...</div>
</Hydrate>
```

### Watch Mode

Develop with instant feedback:

```bash
preliquify build --watch
```

## Architecture

```
┌─────────────────────────────────────┐
│   TypeScript/JSX Components         │
│   (src/snippets/*.tsx)              │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│   Preliquify Compiler               │
│   - Parse JSX                       │
│   - Detect Liquid primitives        │
│   - Generate Liquid syntax          │
│   - Bundle client runtime           │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│   Liquid Templates + Client JS      │
│   (snippets/*.liquid)               │
│   (assets/preliquify.runtime.js)    │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│   Shopify Theme                     │
│   - Renders Liquid server-side      │
│   - Hydrates islands client-side    │
└─────────────────────────────────────┘
```

## Packages

Preliquify is organized as a monorepo with multiple packages:

- **`@preliquify/cli`**: Command-line interface for building
- **`@preliquify/compiler`**: Core compilation logic
- **`@preliquify/core`**: Primitives, expressions, and utilities
- **`@preliquify/preact`**: Preact-specific bindings (re-exports core)

## Community

- **GitHub Discussions**: Ask questions and share ideas
- **Issues**: Report bugs and request features
- **Pull Requests**: Contribute improvements

## License

Preliquify is [MIT licensed](../LICENSE).

## Next Steps

Ready to get started? Check out the [Getting Started Guide](./getting-started.md)!

