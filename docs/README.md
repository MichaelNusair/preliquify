# API Reference

## `createLiquidSnippet`

```typescript
createLiquidSnippet<P>(
  Component: ComponentType<P>,
  propMapping: Record<keyof P, PropMapping>,
  options?: { componentName?, id? }
): ComponentType
```

**PropMapping:** `string | { liquidVar: string; default?: any }`

## Expression Builder (`$`)

```typescript
$.var<T>(path: string): Expr<T>
$.lit<T>(value: T): Expr<T>
$.eq<T>(a: Expr<T>, b: Expr<T>): Expr<boolean>
$.and(a: Expr<boolean>, b: Expr<boolean>): Expr<boolean>
$.or(a: Expr<boolean>, b: Expr<boolean>): Expr<boolean>
$.not(a: Expr<boolean>): Expr<boolean>
$.contains<T>(collection: Expr<T[]>, item: Expr<T>): Expr<boolean>
```

## Primitives

```typescript
<For<T> each={Expr<T[]>} as={string}>
  {JSX.Element | ((item: T, index: number) => JSX.Element)}
</For>

<Conditional when={Expr<boolean>}>
  {JSX.Element}
</Conditional>

<Hydrate id={string} component={string} props={Record<string, unknown>} />

<Target liquid={JSX.Element} client={JSX.Element} />
```

## Hooks

```typescript
useTarget(): 'liquid' | 'client'
```

## Runtime

**Global:** `window.__PRELIQUIFY__`

```typescript
register(name: string, component: ComponentType): void
hydrate(container?: Element): void
getComponent(id: string): ComponentType | undefined
getErrors(): Error[]
setDebug(enabled: boolean): void
unmount(id: string): boolean
update(id: string, newProps: Record<string, unknown>): boolean
```

## Config

```typescript
interface PreliquifyConfig {
  entryPoint: string | string[];
  outLiquidDir: string;
  outClientDir: string;
  generateClientBundles?: boolean; // Default: true
  minify?: boolean; // Default: true
  suffixDistFiles?: boolean; // Default: true
  verbose?: boolean;
  watch?: boolean;
}
```
