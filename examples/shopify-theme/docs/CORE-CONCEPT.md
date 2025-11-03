# Preliquify Core Concept

## The Transformation

Preliquify transforms a Preact component that uses data into:

1. **Liquid snippet** - Server-side rendering using Shopify metafields/variables
2. **Hydration script** - Client-side JavaScript that reads from DOM data attributes

## Flow Diagram

```
Preact Component (with props)
    ↓
[Build Time: Preliquify]
    ↓
┌─────────────────────────────────────┐
│  Liquid Snippet                     │
│  - Server-rendered HTML             │
│  - Data attributes with Liquid exprs │
└─────────────────────────────────────┘
    ↓
[Runtime: Shopify Liquid]
    ↓
┌─────────────────────────────────────┐
│  HTML Output                        │
│  - Rendered component HTML          │
│  - Data attributes with JSON        │
│  - <div data-prop='{"key":"value"}'>│
└─────────────────────────────────────┘
    ↓
[Client: Hydration Script]
    ↓
┌─────────────────────────────────────┐
│  Hydrated Component                 │
│  - Reads data attributes             │
│  - Parses JSON                       │
│  - Renders Preact component          │
│  - Component is now interactive      │
└─────────────────────────────────────┘
```

## Key Concepts

### 1. Props at Build Time

**Problem**: Preliquify needs to know what props your component expects so it can:
- Generate Liquid expressions for those props
- Create appropriate data attributes
- Build hydration script that reads those attributes

**Solution**: Your component receives props that can be:
- **Liquid expressions** (strings like `"{{ variable }}"`) during build
- **Actual values** during server rendering (after Liquid evaluates)
- **Parsed values** during client hydration (from DOM)

### 2. Data Attributes Pattern

The SSR wrapper component:
```tsx
function ComponentSSR(props) {
  const target = useTarget();
  
  if (target === "liquid") {
    // Build time: props contain Liquid expressions
    return (
      <div 
        data-prop1={rawLiquid("{{ metafield.value }}")}
        data-prop2={rawLiquid(liquidJson(props.prop2))}
      >
        {/* Server-rendered component */}
        <YourComponent {...props} />
      </div>
    );
  }
  
  return null; // Client handles rendering
}
```

### 3. Liquid Expression Mapping

**During Build** (in your `.tsx` file):
```tsx
<ComponentSSR 
  prop1={rawLiquid("{{ product.metafields.key.value }}")}
/>
```

**In Output Liquid**:
```liquid
<div data-prop1="{{ product.metafields.key.value | json | escape }}">
```

**At Runtime** (Shopify evaluates):
```html
<div data-prop1='{"key": "value"}'>
```

**During Hydration** (client reads):
```javascript
const prop1 = JSON.parse(element.getAttribute('data-prop1'));
// prop1 = { key: "value" }
```

### 4. Build Time Props Detection

Preliquify renders your component with empty props during build:
```typescript
renderToString(h(Component, {}))
```

Your component needs to handle this by:
- Accepting props that might be `undefined` during build
- Using `rawLiquid()` or `liquidJson()` to pass Liquid expressions
- The wrapper component (`ComponentSSR`) converts props to Liquid expressions

### 5. Automatic Prop-to-Liquid Mapping

When you pass a prop like:
```tsx
metafieldData={rawLiquid("{{ product.metafields.key.value }}")}
```

Preliquify preserves this as a Liquid expression. The component wrapper then:
1. Converts it to a data attribute: `data-metafield="{{ ... }}"`
2. During build, renders the component with the raw Liquid string
3. Output Liquid file contains the Liquid expression
4. At runtime, Shopify evaluates it to actual data
5. Hydration script reads the evaluated JSON from the DOM

## Component Structure

```
YourComponent.tsx (your actual component)
  ↓ receives props
ComponentSSR.tsx (wrapper - adds data attributes)
  ↓ uses useTarget() to detect liquid/client
ComponentSnippet.tsx (default export - maps Liquid vars to props)
  ↓ Preliquify compiles this
Component.liquid (output - contains Liquid expressions)
```

## Generic Pattern

```tsx
// 1. Your actual component (no changes needed)
function YourComponent(props: YourComponentProps) {
  // Normal component logic
}

// 2. SSR wrapper (adds data attributes)
function YourComponentSSR(props: YourComponentProps) {
  const target = useTarget();
  if (target === "liquid") {
    return (
      <div 
        className="component-ssr-root"
        data-prop1={rawLiquid(liquidJson(props.prop1))}
        data-prop2={rawLiquid(liquidJson(props.prop2))}
      >
        <YourComponent {...props} />
      </div>
    );
  }
  return null;
}

// 3. Default export (maps Liquid variables to props)
export default function YourComponentSnippet() {
  return (
    <YourComponentSSR
      prop1={rawLiquid("{{ metafield.value }}")}
      prop2={rawLiquid("{{ shop.settings }}")}
    />
  );
}
```

## Hydration Script Pattern

```tsx
// Hydration script reads data attributes and hydrates
function hydrateComponent(element: Element) {
  const prop1 = JSON.parse(element.getAttribute('data-prop1'));
  const prop2 = JSON.parse(element.getAttribute('data-prop2'));
  
  const props = { prop1, prop2 };
  preact.render(preact.h(YourComponent, props), element);
}
```

## Summary

1. **Build Time**: Component receives Liquid expressions as props → Preliquify compiles to Liquid
2. **Runtime**: Liquid evaluates expressions → HTML with data attributes containing JSON
3. **Client**: Hydration script reads data attributes → Parses JSON → Renders component with props

The key is that **props flow through all three stages**:
- Build: Liquid expressions (strings)
- Runtime: Actual data (evaluated by Liquid)
- Client: Parsed data (from DOM attributes)

