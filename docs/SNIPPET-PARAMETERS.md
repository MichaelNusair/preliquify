# Passing Parameters to Liquid Snippets

This guide explains how to pass data when calling a compiled Liquid snippet in your Shopify store, and how those parameters are automatically passed to the Preact component during client-side hydration.

## How It Works

### 1. Call the Snippet with Parameters

In your Shopify Liquid templates, you can pass parameters when rendering a snippet:

```liquid
{% render 'ProductCard', product: product, collection: collection, showPrice: true %}
```

### 2. Parameters Become Liquid Variables

When you call `{% render %}`, the parameters you pass become available as Liquid variables **inside the snippet scope**. For example:
- `{% render 'ProductCard', product: product %}` makes `{{ product }}` available in the snippet
- `{% render 'ProductCard', collection: collection %}` makes `{{ collection }}` available

### 3. Reference Parameters in Your Component

In your component's default export, reference these Liquid variables using `rawLiquid()`:

```tsx
export default function ProductCardSnippet() {
  return (
    <ProductCardSSR
      // Reference the parameter passed via {% render %}
      product={rawLiquid("{{ product | json | escape }}")}
      collection={rawLiquid("{{ collection | json | escape }}")}
    />
  );
}
```

### 4. Props Are Automatically Passed to Preact Component

The SSR wrapper stores props in `data-preliq-props`, and the hydration runtime automatically:
1. Reads `data-preliq-props` from the DOM
2. Parses the JSON
3. Passes the props to your Preact component

## Complete Example

### Component Definition (`ProductCard.tsx`)

```tsx
/** @jsxImportSource preact */
import { h } from "preact";
import { useTarget, rawLiquid } from "@preliquify/preact";

interface ProductCardProps {
  product?: any;
  collection?: any;
  showPrice?: boolean;
}

// Your actual component
function ProductCard(props: ProductCardProps) {
  return (
    <div className="product-card">
      <h3>{props.product?.title}</h3>
      {props.showPrice && <div className="price">${props.product?.price}</div>}
    </div>
  );
}

// SSR wrapper - stores props for hydration
function ProductCardSSR(props: ProductCardProps) {
  const target = useTarget();
  
  if (target === "liquid") {
    // Store all props in data-preliq-props
    // The hydration runtime will automatically read this and pass to ProductCard
    return (
      <div
        data-preliq-island="ProductCard"
        data-preliq-id="product-card"
        data-preliq-props={rawLiquid(`{{ '{"product":' | append: (product | json | escape) | append: ',"collection":' | append: (collection | json | escape) | append: ',"showPrice":' | append: (showPrice | default: true) | append: '}' }}`)}
      >
        {/* Server-rendered HTML - will be replaced by hydrated component */}
        <ProductCard {...props} />
      </div>
    );
  }
  
  return null;
}

// Default export - references Liquid variables from {% render %} parameters
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

### Usage in Shopify Liquid

```liquid
{% render 'ProductCard', product: product, collection: collection, showPrice: true %}
```

### What Happens

1. **Build Time**: Preliquify compiles your component to a Liquid snippet
2. **Runtime (Shopify)**: When `{% render %}` is called:
   - Shopify evaluates `{{ product }}`, `{{ collection }}`, etc.
   - The `data-preliq-props` attribute contains actual JSON data
3. **Client Hydration**: The hydration runtime:
   - Finds elements with `data-preliq-props`
   - Parses the JSON
   - Renders `ProductCard` with the parsed props

## Key Points

✅ **Parameter names must match**: The parameter name in `{% render %}` must match the Liquid variable name in your component
- `{% render 'Card', product: product %}` → use `{{ product }}` in component
- `{% render 'Card', myProduct: product %}` → use `{{ myProduct }}` in component

✅ **Props are automatically passed**: The hydration runtime automatically reads `data-preliq-props` and passes props to your Preact component - no manual hydration code needed!

✅ **Use `| json | escape`**: Always pipe Liquid variables through `json` and `escape` filters when storing in data attributes to ensure valid JSON

## Using the Built-in Hydration Runtime

The Preliquify runtime automatically handles hydration for components with `data-preliq-props`. No custom hydration script needed!

The runtime:
- Finds all elements with `data-preliq-props`
- Parses the JSON
- Renders your Preact component with the props

To use it, make sure:
1. Your component is registered with `Preliquify.register('ProductCard', ProductCard)`
2. The element has `data-preliq-props` attribute
3. The Preact runtime is loaded

## Alternative: Using Hydrate Component

For components that are "islands" (only certain parts need hydration), you can use the `Hydrate` component:

```tsx
<Hydrate
  id="product-card-1"
  component="ProductCard"
  props={{
    product: rawLiquid("{{ product | json | escape }}"),
    collection: rawLiquid("{{ collection | json | escape }}")
  }}
/>
```

This automatically creates `data-preliq-island` and `data-preliq-props` attributes, and the runtime handles hydration automatically.

