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
import type { PreliquifyConfig } from "@preliquify/cli";

const config: PreliquifyConfig = {
  srcDir: "src/snippets",
  outLiquidDir: "snippets",
  outClientDir: "assets",
};

export default config;
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

After installing the package, you can run PreLiquify in several ways:

```bash
# Using npx (recommended for one-time use)
npx preliquify build

# Or if installed locally, use your package manager
pnpm preliquify build
npm run preliquify build
yarn preliquify build

# Or add a script to your package.json
# "scripts": { "build:snippets": "preliquify build" }
# Then run: pnpm build:snippets
```

This generates:
- `snippets/Hero.liquid` - The compiled Liquid template
- `assets/preliquify.runtime.js` - Client-side runtime (if using `Hydrate`)

## Configuration

You can configure PreLiquify in two ways:

### 1. Config File (Recommended)

Create a `preliquify.config.ts` (or `.js`/`.mjs`) in your project root:

```typescript
import type { PreliquifyConfig } from "@preliquify/cli";

const config: PreliquifyConfig = {
  srcDir: "src/snippets",        // Source directory
  outLiquidDir: "snippets",       // Output Liquid directory
  outClientDir: "assets",         // Output assets directory
  jsxImportSource: "preact",      // JSX import source
  watch: false,                   // Enable watch mode
};

export default config;
```

**Note:** Importing the `PreliquifyConfig` type provides TypeScript autocomplete and validation for your configuration.

### 2. Command-Line Flags

You can also pass configuration via command-line flags. Flags override config file values:

```bash
preliquify build --src-dir ./components --out-liquid-dir ./templates
preliquify build --watch --verbose
preliquify build --config ./custom-config.ts
```

**Available options:**
- `-h, --help` - Show help message
- `-w, --watch` - Watch for changes and rebuild
- `-v, --verbose` - Show detailed error information
- `-c, --config <path>` - Path to config file
- `--src-dir <path>` - Source directory (default: `src/snippets`)
- `--out-liquid-dir <path>` - Output directory for Liquid files (default: `snippets`)
- `--out-client-dir <path>` - Output directory for client assets (default: `assets`)
- `--jsx-import-source <pkg>` - JSX import source (default: `preact`)

Run `preliquify build --help` to see all available options.

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
