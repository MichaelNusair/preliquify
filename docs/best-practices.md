# Best Practices

Guidelines for building maintainable and performant Shopify themes with Preliquify.

## Component Design

### Keep Components Focused

Each component should have a single responsibility:

✅ Good:
```tsx
function ProductTitle({ title }) {
  return <h2 className="product-title">{title}</h2>;
}

function ProductPrice({ price, compareAtPrice }) {
  return (
    <div className="product-price">
      <span className="price">${price}</span>
      {compareAtPrice && <span className="compare-at">${compareAtPrice}</span>}
    </div>
  );
}
```

❌ Avoid:
```tsx
function ProductEverything({ product }) {
  // Huge component with 500 lines handling everything
}
```

### Type Your Props

Always use TypeScript interfaces for props:

```tsx
interface ProductCardProps {
  product: {
    id: string;
    title: string;
    price: number;
    available: boolean;
    images: Array<{ src: string; alt: string }>;
  };
  showVendor?: boolean;
  showComparePrice?: boolean;
}

function ProductCard({ product, showVendor, showComparePrice }: ProductCardProps) {
  // TypeScript provides autocomplete and catches errors
}
```

### Provide Default Values

Use defaults in `createLiquidSnippet` for optional props:

```tsx
export default createLiquidSnippet(ProductCard, {
  product: "product",
  showVendor: {
    liquidVar: "show_vendor",
    default: false,
  },
  showComparePrice: {
    liquidVar: "show_compare_price",
    default: true,
  },
});
```

## Working with Liquid

### Use Primitives for Liquid Data

Always use Preliquify primitives when working with Liquid collections:

❌ Don't use JavaScript methods:
```tsx
{products.map(p => <ProductCard product={p} />)}
{products.filter(p => p.available).length}
{products.sort((a, b) => a.price - b.price)}
```

✅ Use Preliquify primitives:
```tsx
<For each={$.var("products")} as="p">
  <ProductCard product={p} />
</For>

<Conditional when={$.var("product.available")}>
  <button>Add to Cart</button>
</Conditional>
```

### Access Liquid Variables Correctly

In loops and conditionals, access Liquid variables as strings:

```tsx
<For each={$.var("products")} as="product">
  <div>
    {/* Correct - Liquid will replace this */}
    <h3>{{ product.title }}</h3>
    <p>${{ product.price }}</p>
    
    {/* Incorrect - won't work */}
    <h3>{product.title}</h3>
  </div>
</For>
```

### Combine Liquid and Client-Side Rendering

Use `useTarget()` to differentiate between build time and runtime:

```tsx
import { useTarget } from "@preliquify/preact";

function ProductList({ products }) {
  const target = useTarget();
  
  if (target === "liquid") {
    // Build time - use Liquid primitives
    return (
      <For each={$.var("products")} as="p">
        <ProductCard product={p} />
      </For>
    );
  }
  
  // Runtime - use JavaScript
  return (
    <div>
      {products.map((p, i) => (
        <ProductCard key={i} product={p} />
      ))}
    </div>
  );
}
```

## Performance

### Minimize Client-Side JavaScript

Only hydrate components that need interactivity:

✅ Good - static component, no hydration needed:
```tsx
function ProductCard({ product }) {
  return (
    <div className="product-card">
      <h3>{product.title}</h3>
      <p>${product.price}</p>
      <a href={product.url}>View</a>
    </div>
  );
}
```

❌ Unnecessary hydration:
```tsx
// Don't hydrate if the component is purely static
<Hydrate id="card" component="ProductCard" props={{...}}>
  <div>Loading...</div>
</Hydrate>
```

### Lazy Load Interactive Components

Use `<Hydrate>` only for components that need client-side state:

```tsx
// Shopping cart needs interactivity
<Hydrate id="cart" component="ShoppingCart" props={{...}}>
  <div className="cart-placeholder">Cart ({{ cart.item_count }})</div>
</Hydrate>

// Product gallery needs interactivity
<Hydrate id="gallery" component="ProductGallery" props={{...}}>
  <img src="{{ product.featured_image }}" />
</Hydrate>

// But simple product cards don't
<For each={$.var("products")} as="p">
  <ProductCard product={p} />
</For>
```

### Keep Bundle Size Small

- Import only what you need
- Avoid large dependencies in hydrated components
- Use code splitting for large interactive features

```tsx
// ✅ Good - small bundle
import { useState } from "preact/hooks";

// ❌ Avoid - unnecessarily large
import _ from "lodash";
import moment from "moment";
```

## Code Organization

### File Structure

Organize components by feature:

```
src/
├── snippets/
│   ├── ProductCard.tsx
│   ├── ProductGallery.tsx
│   ├── ProductBadge.tsx
│   ├── ShoppingCart.tsx
│   └── WishlistButton.tsx
├── components/
│   ├── shared/
│   │   ├── Button.tsx
│   │   └── Icon.tsx
│   └── layout/
│       ├── Header.tsx
│       └── Footer.tsx
└── utils/
    ├── formatting.ts
    └── api.ts
```

### Naming Conventions

- Use PascalCase for components: `ProductCard`, `ShoppingCart`
- Use camelCase for utilities: `formatPrice`, `fetchProduct`
- Use descriptive names that reflect the component's purpose

### Extract Reusable Logic

Create custom hooks for reusable logic:

```tsx
// hooks/useCart.ts
export function useCart() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const addItem = async (variantId: string) => {
    setLoading(true);
    const res = await fetch('/cart/add.js', {
      method: 'POST',
      body: JSON.stringify({ id: variantId, quantity: 1 }),
    });
    const cart = await res.json();
    setItems(cart.items);
    setLoading(false);
  };
  
  return { items, loading, addItem };
}

// Usage
function AddToCartButton({ variantId }) {
  const { loading, addItem } = useCart();
  
  return (
    <button onClick={() => addItem(variantId)} disabled={loading}>
      {loading ? 'Adding...' : 'Add to Cart'}
    </button>
  );
}
```

## Error Handling

### Handle Missing Data Gracefully

Always provide fallbacks for optional Liquid data:

```tsx
export default createLiquidSnippet(ProductCard, {
  product: "product",
  compareAtPrice: {
    liquidVar: "product.compare_at_price",
    default: null,
  },
});

function ProductCard({ product, compareAtPrice }) {
  return (
    <div>
      <h3>{product.title}</h3>
      <span className="price">${product.price}</span>
      
      {/* Only show if available */}
      {compareAtPrice && (
        <span className="compare-at">${compareAtPrice}</span>
      )}
    </div>
  );
}
```

### Validate Props at Runtime

For hydrated components, validate props:

```tsx
function ProductGallery({ images, title }) {
  // Validate
  if (!images || !Array.isArray(images) || images.length === 0) {
    return <div className="error">No images available</div>;
  }
  
  const [currentIndex, setCurrentIndex] = useState(0);
  
  return (
    <div className="gallery">
      <img src={images[currentIndex].src} alt={title} />
      {/* ... */}
    </div>
  );
}
```

### Use Try-Catch for API Calls

Wrap API calls in try-catch blocks:

```tsx
async function addToCart(variantId: string) {
  try {
    const res = await fetch('/cart/add.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: variantId, quantity: 1 }),
    });
    
    if (!res.ok) {
      throw new Error('Failed to add to cart');
    }
    
    return await res.json();
  } catch (error) {
    console.error('Add to cart error:', error);
    // Show user-friendly error message
    alert('Failed to add item to cart. Please try again.');
  }
}
```

## Testing

### Test Build Output

Always verify generated Liquid:

1. Build your components
2. Check the output in `snippets/` directory
3. Verify Liquid syntax is correct
4. Test in a development Shopify store

### Test in Shopify

Before deploying to production:

1. Upload to a development theme
2. Test all component variations
3. Check browser console for errors
4. Test on mobile devices
5. Verify performance

### Use Verbose Mode for Debugging

When debugging build issues:

```bash
preliquify build --verbose
```

This shows detailed error messages and stack traces.

## Accessibility

### Use Semantic HTML

```tsx
// ✅ Good
<nav>
  <ul>
    <li><a href="/collections/all">Shop</a></li>
  </ul>
</nav>

// ❌ Avoid
<div>
  <div><span onClick={...}>Shop</span></div>
</div>
```

### Provide Alt Text

```tsx
<img 
  src="{{ product.featured_image }}" 
  alt="{{ product.title }}"
/>
```

### Use ARIA Labels

```tsx
<button 
  onClick={handleAddToCart}
  aria-label="Add {{ product.title }} to cart"
>
  Add to Cart
</button>
```

### Keyboard Navigation

Ensure interactive elements are keyboard accessible:

```tsx
function ProductGallery({ images }) {
  return (
    <div className="gallery">
      <button 
        onClick={() => setIndex(i => i - 1)}
        onKeyPress={(e) => e.key === 'Enter' && setIndex(i => i - 1)}
        aria-label="Previous image"
      >
        ←
      </button>
    </div>
  );
}
```

## Security

### Sanitize User Input

Never trust user input:

```tsx
// ❌ Dangerous
<div dangerouslySetInnerHTML={{ __html: userInput }} />

// ✅ Safe
<div>{userInput}</div>
```

### Validate API Responses

Always validate data from APIs:

```tsx
async function fetchProduct(id: string) {
  const res = await fetch(`/products/${id}.js`);
  const data = await res.json();
  
  // Validate response
  if (!data || typeof data.id !== 'string') {
    throw new Error('Invalid product data');
  }
  
  return data;
}
```

## Version Control

### Commit Generated Files

Decide whether to commit generated Liquid files:

**Option 1: Commit them** (recommended for teams)
- Add `snippets/*.liquid` and `assets/preliquify*.js` to git
- Ensures everyone has same output
- Easy to review changes

**Option 2: Don't commit them** (for advanced users)
- Add to `.gitignore`
- Requires build step in CI/CD
- Smaller repository

### Use `.gitignore`

```gitignore
node_modules/
dist/
.DS_Store
*.log

# Optional: Generated Liquid files
# snippets/*-prlq.liquid
# assets/preliquify*.js
```

## Deployment

### CI/CD Pipeline

Set up automated builds:

```yaml
# .github/workflows/build.yml
name: Build Liquid

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
      - run: pnpm install
      - run: pnpm preliquify build
      - uses: actions/upload-artifact@v4
        with:
          name: liquid-files
          path: snippets/
```

### Staging Environment

Always test in staging before production:

1. Build locally or in CI
2. Deploy to staging theme
3. Test thoroughly
4. Deploy to production

## Next Steps

- [API Reference](./api-reference.md)
- [Examples](../examples/)
- [Contributing](../CONTRIBUTING.md)

