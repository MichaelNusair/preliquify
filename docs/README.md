# Preliquify Documentation

## Core Concepts

- **createLiquidSnippet** - Wraps components for Liquid compilation and client hydration
- **Liquid Primitives** - Components that compile to native Liquid (`<For>`, `<Conditional>`)
- **Expression Builder** - `$` helper for type-safe Liquid expressions
- **Islands** - Selective client-side hydration with `data-preliq-island`

## Guides

- [Quick Reference](./quick-reference.md) - Cheat sheet
- [Entry Points](./entry-points.md) - Configuration and file organization
- [Client Bundles](./client-bundles.md) - Automatic bundling and registration
- [Primitives](./primitives.md) - Liquid components reference
- [Best Practices](./best-practices.md) - Patterns and anti-patterns

## API Reference

### `createLiquidSnippet`

```typescript
function createLiquidSnippet<P>(
  Component: ComponentType<P>,
  propMapping: Record<keyof P, PropMapping>,
  options?: CreateLiquidSnippetOptions
): ComponentType
```

**PropMapping:**
```typescript
type PropMapping = string | { liquidVar: string; default?: unknown }
```

**Example:**
```tsx
export default createLiquidSnippet(MyComponent, {
  product: 'product',                               // Simple mapping
  showPrice: { liquidVar: 'showPrice', default: true }  // With default
});
```

### Expression Builder (`$`)

```typescript
$.var<T>(path: string): Expr<T>
$.lit<T>(value: T): Expr<T>
$.eq<T>(a: Expr<T>, b: Expr<T>): Expr<boolean>
$.and(a: Expr<boolean>, b: Expr<boolean>): Expr<boolean>
$.or(a: Expr<boolean>, b: Expr<boolean>): Expr<boolean>
$.not(a: Expr<boolean>): Expr<boolean>
$.contains<T>(collection: Expr<T[]>, item: Expr<T>): Expr<boolean>
```

### Primitives

**For:**
```typescript
<For<T> each={Expr<T[]>} as={string}>
  {JSX.Element | ((item: T, index: number) => JSX.Element)}
</For>
```

**Conditional:**
```typescript
<Conditional when={Expr<boolean>}>
  {JSX.Element}
</Conditional>
```

**Hydrate:**
```typescript
<Hydrate id={string} component={string} props={Record<string, unknown>} />
```

**Target:**
```typescript
<Target liquid={JSX.Element} client={JSX.Element} />
```

### Hooks

```typescript
useTarget(): 'liquid' | 'client'
```

Returns current render target. Use for conditional logic.

## Types

```typescript
interface Expr<T> {
  toLiquid(): string;
  toClient(): (ctx: Record<string, unknown>) => T;
}

interface PreliquifyConfig {
  entryPoint: string | string[];
  outLiquidDir: string;
  outClientDir: string;
  generateClientBundles?: boolean;
  minify?: boolean;
  suffixDistFiles?: boolean;
  verbose?: boolean;
  watch?: boolean;
}
```

## Build Process

1. **Scan** - Find files with `createLiquidSnippet`
2. **Compile** - Render with `TargetProvider` set to "liquid"
3. **Generate** - Create `.liquid` and `.bundle.js` files
4. **Bundle** - Auto-registration code included

## Runtime

Global: `window.__PRELIQUIFY__`

```typescript
interface PreliquifyRuntime {
  register(name: string, component: ComponentType): void;
  hydrate(container?: Element): void;
  getComponent(id: string): ComponentType | undefined;
  getErrors(): Error[];
  setDebug(enabled: boolean): void;
}
```

## Examples

See `examples/shopify-theme/` for working examples.
