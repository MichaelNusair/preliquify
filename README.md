# Preliquify

Build Shopify Liquid snippets using React/Preact components. Write your theme snippets in TypeScript/JSX and compile them to Liquid template files.

## Installation

```bash
npm install -D @preliquify/cli
# or
pnpm add -D @preliquify/cli
# or
yarn add -D @preliquify/cli
```

## Quick Start

1. **Create a config file** (`preliquify.config.ts`):

```typescript
import type { PreliquifyConfig } from "@preliquify/cli";

const config: PreliquifyConfig = {
  srcDir: "src/snippets",
  outLiquidDir: "snippets",
  outClientDir: "assets",
};

export default config;
```

2. **Write a component** (`src/snippets/ProductCard.tsx`):

```tsx
/** @jsxImportSource preact */
import { createLiquidSnippet } from "@preliquify/preact";

interface ProductCardProps {
  product: any;
  showPrice?: boolean;
}

function ProductCard({ product, showPrice = true }: ProductCardProps) {
  return (
    <div className="product-card">
      <h3>{product.title}</h3>
      {showPrice && <div className="price">${product.price}</div>}
    </div>
  );
}

export default createLiquidSnippet(ProductCard, {
  product: "product",
  showPrice: { liquidVar: "showPrice", default: true }
});
```

3. **Build**:

```bash
npx preliquify build
```

This generates `snippets/ProductCard.liquid` that you can use in Shopify:

```liquid
{% render 'ProductCard', product: product, showPrice: true %}
```

## How It Works

1. **Write your component once** with normal props
2. **Use `createLiquidSnippet`** to map props to Liquid variables
3. **Preliquify compiles** your component to a Liquid snippet
4. **Shopify evaluates** the Liquid at runtime
5. **Hydration runtime** automatically hydrates your component with props

## Component Patterns

### Components with Props (Recommended)

Use `createLiquidSnippet` - just write your component once:

```tsx
import { createLiquidSnippet } from "@preliquify/preact";

function MyComponent({ product, collection }: Props) {
  return <div>{product.title}</div>;
}

export default createLiquidSnippet(MyComponent, {
  product: "product",  // prop name → Liquid variable name
  collection: "collection",
  showPrice: { liquidVar: "showPrice", default: true }  // with default
});
```

### Components with Liquid Expressions

For components that use Liquid expressions directly:

```tsx
/** @jsxImportSource preact */
import { Conditional, For } from "@preliquify/preact";
import { $ } from "@preliquify/core";

export default function Hero() {
  return (
    <section>
      <Conditional when={$.var("customer.email")}>
        <p>Welcome back!</p>
      </Conditional>
      
      <For each={$.var("collections.frontpage.products")} as="p">
        <div>{p.title}</div>
      </For>
    </section>
  );
}
```

## Configuration

### Config File

```typescript
import type { PreliquifyConfig } from "@preliquify/cli";

const config: PreliquifyConfig = {
  srcDir: "src/snippets",        // Source directory
  outLiquidDir: "snippets",       // Output Liquid directory
  outClientDir: "assets",         // Output assets directory
  jsxImportSource: "preact",      // JSX import source
  watch: false,                  // Enable watch mode
  verbose: false,                 // Detailed error output
};

export default config;
```

### Command-Line Options

```bash
preliquify build --watch              # Watch for changes
preliquify build --verbose             # Show detailed errors
preliquify build --src-dir ./src      # Override source directory
preliquify build --config ./custom.ts # Custom config file
```

## Core Features

### Liquid Expressions

Build Liquid expressions using the `$` helper:

```tsx
import { $ } from "@preliquify/core";

// Variables
$.var("product.title")
$.var("customer.email")

// Literals
$.lit("hello")
$.lit(42)
$.lit(true)

// Operators
$.contains($.var("tags"), $.lit("sale"))
$.equals($.var("count"), $.lit(0))
```

### Primitives

Components that compile to Liquid:

- **`Conditional`**: Renders `{% if %}` blocks
- **`For`**: Renders `{% for %}` loops
- **`Choose`**: Renders `{% case %}` statements
- **`Hydrate`**: Creates interactive islands for client-side hydration

### createLiquidSnippet Options

```tsx
export default createLiquidSnippet(Component, propMapping, {
  componentName: "MyComponent",  // Component name for hydration
  id: "my-component",           // ID for hydration island
  placeholder: <div>Loading...</div>  // Placeholder shown at build time
});
```

## Usage in Shopify

Pass parameters when rendering the snippet:

```liquid
{% render 'ProductCard', 
   product: product, 
   collection: collection,
   showPrice: true 
%}
```

The parameter names must match the Liquid variable names in your `createLiquidSnippet` mapping.

## SSR Compatibility

Components are rendered server-side during build. Code accessing browser APIs is automatically polyfilled:

- `window`, `document`, `localStorage`
- `HTMLElement`, `Element`
- `IntersectionObserver`, `requestIdleCallback`

For manual guards:

```typescript
if (typeof window !== 'undefined') {
  // Browser-only code
}
```

## Development

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run tests
pnpm test
```

## License

MIT
