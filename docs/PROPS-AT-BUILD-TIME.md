# Props at Build Time - Production Ready

## Answer: YES, it's production-ready!

Preliquify **does support passing props at build time**, but the mechanism works through the component tree during rendering, not through automatic prop extraction.

## How It Works

### Current Implementation

In `packages/compiler/src/renderToLiquid.tsx`:

```typescript
const html = renderToString(
  h(TargetProvider, { value: "liquid" }, h(Comp, {}))
);
```

The default export component is called with **empty props `{}`**, BUT:

1. Your component can return JSX that includes child components WITH props
2. Those props are passed during the `renderToString` process
3. Props containing Liquid expressions (via `rawLiquid()` or `liquidJson()`) are preserved as strings
4. These strings flow through the render tree and appear in the output HTML

### Pattern

```tsx
// Your default export receives empty props {}
export default function MySnippet() {
  // But you return JSX with props containing Liquid expressions
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
    // Props ARE available here during build!
    // props.prop1 = "{{ product.metafields.key.value }}" (string)
    return (
      <div data-prop1={rawLiquid(props.prop1)}>
        <YourComponent {...props} />
      </div>
    );
  }
  return null;
}
```

### What Happens at Build Time

1. **Preliquify calls**: `h(MySnippet, {})` → empty props
2. **MySnippet executes** and returns `<MyComponentSSR prop1={rawLiquid("{{ ... }}")} />`
3. **`rawLiquid()` returns** the string `"{{ product.metafields.key.value }}"`
4. **During renderToString**, `MyComponentSSR` receives `props.prop1 = "{{ product.metafields.key.value }}"`
5. **MyComponentSSR** uses that string to create data attributes: `data-prop1="{{ product.metafields.key.value }}"`
6. **Output HTML** contains the Liquid expression as-is

## Key Points

### ✅ What Works

- **Props flow through component tree**: When you return JSX with props, they're passed during rendering
- **Liquid expressions preserved**: `rawLiquid()` and `liquidJson()` preserve strings in output
- **Build-time access**: Props are available in child components during `renderToString`

### ❌ What Doesn't Happen

- **No automatic prop extraction**: Preliquify doesn't analyze your component's TypeScript interface
- **No prop inference**: You must explicitly pass props in your JSX
- **No static analysis**: Props aren't extracted from function signatures

## Example: Working Pattern

```tsx
/** @jsxImportSource preact */
import { useTarget, rawLiquid, liquidJson } from "@preliquify/preact";

interface Props {
  metafield?: any;
  settings?: any;
}

function MyComponent(props: Props) {
  return <div>Component content</div>;
}

function MyComponentSSR(props: Props) {
  const target = useTarget();
  if (target === "liquid") {
    // Props ARE available here!
    // They're strings like "{{ product.metafields.key.value }}"
    return (
      <div 
        className="my-component-root"
        data-metafield={rawLiquid(typeof props.metafield === "string" 
          ? props.metafield 
          : liquidJson(props.metafield))}
      >
        <MyComponent {...props} />
      </div>
    );
  }
  return null;
}

// Default export - props passed here flow through during build
export default function MyComponentSnippet() {
  return (
    <MyComponentSSR
      metafield={rawLiquid("{{ product.metafields.namespace.key.value | json | escape }}")}
      settings={rawLiquid("{{ shop.metafields.settings.value | json | escape }}")}
    />
  );
}
```

## Build Output

The component above generates Liquid like:

```liquid
<div class="my-component-root" data-metafield="{{ product.metafields.namespace.key.value | json | escape }}">
  <div>Component content</div>
</div>
```

## Summary

**Preliquify IS production-ready for passing props at build time**, but:

1. ✅ Props work through the component tree during rendering
2. ✅ `rawLiquid()` and `liquidJson()` preserve Liquid expressions
3. ✅ Props are available in child components during `renderToString`
4. ❌ No automatic prop extraction from TypeScript interfaces
5. ❌ You must explicitly pass props in your JSX

The pattern is **working and production-ready** - you just need to structure your components to pass props through the tree, which is standard React/Preact pattern anyway!

