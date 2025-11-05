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

1. Create a config file (`preliquify.config.ts`):

```typescript
import type { PreliquifyConfig } from "@preliquify/cli";

const config: PreliquifyConfig = {
  srcDir: "src/snippets",
  outLiquidDir: "snippets",
  outClientDir: "assets",
};

export default config;
```

2. Write a component (`src/snippets/Hero.tsx`):

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

3. Build:

```bash
npx preliquify build
# or
pnpm preliquify build
```

This generates:
- `snippets/Hero.liquid` - The compiled Liquid template
- `assets/preliquify.runtime.js` - Client-side runtime (if using `Hydrate`)

## Configuration

### Config File

Create a `preliquify.config.ts` (or `.js`/`.mjs`) in your project root:

```typescript
import type { PreliquifyConfig } from "@preliquify/cli";

const config: PreliquifyConfig = {
  srcDir: "src/snippets",        // Source directory
  outLiquidDir: "snippets",       // Output Liquid directory
  outClientDir: "assets",         // Output assets directory
  jsxImportSource: "preact",      // JSX import source
  watch: false,                   // Enable watch mode
  verbose: false,                  // Detailed error output
};

export default config;
```

### Command-Line Flags

Flags override config file values:

```bash
preliquify build --src-dir ./components --out-liquid-dir ./templates
preliquify build --watch --verbose
preliquify build --config ./custom-config.ts
```

Available options:
- `-h, --help` - Show help message
- `-w, --watch` - Watch for changes and rebuild
- `-v, --verbose` - Show detailed error information
- `-c, --config <path>` - Path to config file
- `--src-dir <path>` - Source directory (default: `src/snippets`)
- `--out-liquid-dir <path>` - Output directory for Liquid files (default: `snippets`)
- `--out-client-dir <path>` - Output directory for client assets (default: `assets`)
- `--jsx-import-source <pkg>` - JSX import source (default: `preact`)

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

Preliquify provides components that compile to Liquid:

- **`Conditional`**: Renders `{% if %}` blocks
- **`For`**: Renders `{% for %}` loops
- **`Choose`**: Renders `{% case %}` statements
- **`Hydrate`**: Creates interactive islands for client-side hydration

### Component Structure

Components follow a three-layer pattern:

1. **Default export**: Maps Liquid variables to props
2. **SSR wrapper**: Adds data attributes for hydration
3. **Component**: Business logic

```tsx
/** @jsxImportSource preact */
import { useTarget, rawLiquid } from "@preliquify/preact";

function ProductCard(props: ProductCardProps) {
  return (
    <div className="product-card">
      <h3>{props.product?.title}</h3>
    </div>
  );
}

function ProductCardSSR(props: ProductCardProps) {
  const target = useTarget();
  if (target === "liquid") {
    return (
      <div
        data-preliq-island="ProductCard"
        data-preliq-id="product-card"
        data-preliq-props={rawLiquid(`{{ '{"product":' | append: (product | json | escape) | append: '}' }}`)}
      >
        <ProductCard {...props} />
      </div>
    );
  }
  return null;
}

export default function ProductCardSnippet() {
  return (
    <ProductCardSSR
      product={rawLiquid("{{ product | json | escape }}")}
    />
  );
}
```

### Usage in Shopify

Call the snippet with parameters:

```liquid
{% render 'ProductCard', product: product, collection: collection %}
```

Parameters passed via `{% render %}` become available as Liquid variables inside the snippet scope. Reference them in your default export using `rawLiquid()`.

## Architecture

Preliquify transforms components through three stages:

1. **Build time**: Component receives Liquid expressions as props → compiled to Liquid snippet
2. **Runtime**: Shopify Liquid evaluates expressions → HTML with data attributes containing JSON
3. **Client**: Hydration runtime reads data attributes → parses JSON → renders component with props

The transformation flow:

```
Preact Component (with props)
    ↓
[Build Time: Preliquify]
    ↓
Liquid Snippet (server-rendered HTML + data attributes with Liquid expressions)
    ↓
[Runtime: Shopify Liquid]
    ↓
HTML Output (rendered component + data attributes with JSON)
    ↓
[Client: Hydration Script]
    ↓
Hydrated Component (reads data attributes, parses JSON, renders Preact component)
```

## Props at Build Time

Props are passed through the component tree during rendering. The default export receives empty props `{}`, but you can return JSX with props containing Liquid expressions.

Pattern:

```tsx
export default function MySnippet() {
  return (
    <MyComponentSSR
      prop1={rawLiquid("{{ product.metafields.key.value }}")}
      prop2={rawLiquid("{{ shop.settings }}")}
    />
  );
}

function MyComponentSSR(props) {
  const target = useTarget();
  if (target === "liquid") {
    // Props are available here during build as strings
    // props.prop1 = "{{ product.metafields.key.value }}"
    return (
      <div data-prop1={rawLiquid(props.prop1)}>
        <YourComponent {...props} />
      </div>
    );
  }
  return null;
}
```

What works:
- Props flow through component tree during rendering
- Liquid expressions preserved via `rawLiquid()` and `liquidJson()`
- Props available in child components during `renderToString`

What doesn't happen:
- No automatic prop extraction from TypeScript interfaces
- No static analysis of function signatures
- Props must be explicitly passed in JSX

## Snippet Parameters

Parameters passed via `{% render %}` become Liquid variables inside the snippet scope. Reference them in your component's default export:

```tsx
export default function ProductCardSnippet() {
  return (
    <ProductCardSSR
      product={rawLiquid("{{ product | json | escape }}")}
      collection={rawLiquid("{{ collection | json | escape }}")}
      showPrice={rawLiquid("{{ showPrice | default: true }}")}
    />
  );
}
```

Parameter names must match: `{% render 'Card', product: product %}` → use `{{ product }}` in component.

The hydration runtime automatically reads `data-preliq-props` from the DOM and passes parsed props to your Preact component. Always pipe Liquid variables through `json` and `escape` filters when storing in data attributes.

## SSR Compatibility

Components are rendered server-side during build using `preact-render-to-string`. Code accessing browser APIs needs guards.

### Built-in Protections

Preliquify provides polyfills for common browser APIs:
- `window` - Mock window object
- `document` - Mock document object
- `localStorage` - In-memory Map-based storage
- `HTMLElement` - Mock HTMLElement class
- `Element` - Mock Element class
- `IntersectionObserver` - Mock observer
- `requestIdleCallback` - Fallback to setTimeout

### SSR Detection

Check if running in SSR context:

```typescript
if (typeof globalThis.__PRELIQUIFY_SSR__ !== 'undefined' && 
    globalThis.__PRELIQUIFY_SSR__ === true) {
  // Running during SSR
}
```

### SSR-Safe Utilities

Use utilities from `@preliquify/core`:

```typescript
import { 
  isSSR, 
  isBrowser, 
  getLocalStorage, 
  getWindow, 
  getDocument,
  isHTMLElement,
  parseDataAttribute,
  safeGet
} from '@preliquify/core';
```

Examples:

```typescript
// LocalStorage
const storage = getLocalStorage();
const value = storage.getItem('key');

// Window
const window = getWindow();
if (isBrowser()) {
  window.addEventListener('resize', handler);
}

// HTMLElement
if (isHTMLElement(element)) {
  const attr = element.getAttribute('data-prop');
}

// Safe property access
const type = safeGet(media, 'type', 'unknown');
```

### Context Providers

Provide default values during SSR:

```typescript
const ZoomContext = createContext<ZoomValue>({
  zoom: 1,
  setZoom: () => {},
});

export function ZoomProvider({ children, value }) {
  const defaultValue = isSSR() 
    ? { zoom: 1, setZoom: () => {} }
    : value;
  
  return (
    <ZoomContext.Provider value={defaultValue}>
      {children}
    </ZoomContext.Provider>
  );
}
```

### Common Patterns

Manual guards:

```typescript
// localStorage
if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
  localStorage.setItem('key', 'value');
}

// HTMLElement instanceof
if (typeof HTMLElement !== 'undefined' && element instanceof HTMLElement) {
  // Use HTMLElement APIs
}

// Method existence
if (typeof element?.getAttribute === 'function') {
  const value = element.getAttribute('data-prop');
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

# Lint
pnpm lint

# Format
pnpm format
```

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

## License

MIT
