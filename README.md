# Preliquify

Build Shopify Liquid snippets using React/Preact components. Write your theme snippets in TypeScript/JSX and compile them to Liquid template files.

## Features

- 🎨 **Write in JSX**: Build Shopify snippets using familiar React/Preact syntax
- 🔄 **Compile to Liquid**: Automatically transforms TSX components to `.liquid` files
- 🏝️ **Islands Architecture**: Selective hydration for interactive components
- 📦 **Type-Safe**: Full TypeScript support with proper types
- ⚡ **Fast Builds**: Powered by esbuild for quick compilation

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
export default {
  srcDir: "src/snippets",
  outLiquidDir: "snippets",
  outClientDir: "assets",
};
```

2. **Write a component** (`src/snippets/Hero.tsx`):

```tsx
/** @jsxImportSource preact */
import { Conditional, For, Hydrate } from "@preliquify/preact";
import { $ } from "@preliquify/core";

const isVip = $.contains($.var("customer.tags"), $.lit("vip"));

export default function Hero() {
  return (
    <section>
      <Conditional when={isVip}>
        <p>{{ "Welcome back, VIP!" }}</p>
      </Conditional>

      <For each={$.var("collections.frontpage.products")} as="p">
        <div>
          <strong>{{ p.title }}</strong>
        </div>
      </For>

      <Hydrate
        id="cart"
        component="CartDrawer"
        props={{ currency: "{{ shop.currency }}" }}
      />
    </section>
  );
}
```

3. **Build**:

```bash
preliquify build
```

This generates:
- `snippets/Hero.liquid` - The compiled Liquid template
- `assets/preliquify.runtime.js` - Client-side runtime (if using `Hydrate`)

## Configuration

Configuration options in `preliquify.config.ts`:

```typescript
export default {
  srcDir?: string;           // Source directory (default: "src/snippets")
  outLiquidDir?: string;     // Output Liquid directory (default: "snippets")
  outClientDir?: string;     // Output assets directory (default: "assets")
  jsxImportSource?: string;  // JSX import source (default: "preact")
  watch?: boolean;           // Enable watch mode (default: false)
};
```

## Core Concepts

### Liquid Expressions

Use the `$` helper to build Liquid expressions:

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

Preliquify provides special components that understand Liquid:

- **`Conditional`**: Liquid `{% if %}` blocks
- **`For`**: Liquid `{% for %}` loops
- **`Choose`**: Liquid `{% case %}` statements
- **`Hydrate`**: Client-side interactive islands

### Hydration

For components that need interactivity, use `Hydrate`:

```tsx
<Hydrate
  id="unique-id"
  component="MyComponent"
  props={{ name: "{{ customer.name }}" }}
/>
```

This creates a server-rendered placeholder that your client-side JavaScript can hydrate.

## Project Structure

```
preliquify/
├── packages/
│   ├── cli/         # CLI tool
│   ├── compiler/     # Build system
│   ├── core/         # Core primitives and utilities
│   └── preact/       # Preact-specific exports
└── examples/
    └── shopify-theme/  # Example theme
```

## Development

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run linting
pnpm lint

# Format code
pnpm format
```

## License

MIT

## Links

- [Homepage](https://preliquify.com)
- [GitHub](https://github.com/preliquify/preliquify)
- [Issues](https://github.com/preliquify/preliquify/issues)
