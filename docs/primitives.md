# Primitives

Preliquify provides primitives that compile to Liquid template syntax. These components work both at build time (generating Liquid) and at runtime (client-side evaluation).

## Table of Contents

- [Conditional](#conditional)
- [For](#for)
- [Choose](#choose)
- [Hydrate](#hydrate)

## Conditional

The `<Conditional>` component compiles to Liquid `{% if %}` blocks.

### Basic Usage

```tsx
import { Conditional, $ } from "@preliquify/preact";

<Conditional when={$.var("customer.email")}>
  <p>Welcome back!</p>
</Conditional>
```

Compiles to:
```liquid
{% if customer.email %}
  <p>Welcome back!</p>
{% endif %}
```

### With Expressions

```tsx
// Check if product is available
<Conditional when={$.var("product.available")}>
  <button>Add to Cart</button>
</Conditional>

// Check equality
<Conditional when={$.eq($.var("product.type"), $.lit("shirt"))}>
  <p>This is a shirt</p>
</Conditional>

// Check if collection contains item
<Conditional when={$.contains($.var("product.tags"), $.lit("sale"))}>
  <span className="badge">On Sale!</span>
</Conditional>
```

### Complex Conditions

Use logical operators for complex conditions:

```tsx
// AND condition
<Conditional when={$.and(
  $.var("customer.logged_in"),
  $.var("product.available")
)}>
  <button>Buy Now</button>
</Conditional>

// OR condition
<Conditional when={$.or(
  $.eq($.var("product.type"), $.lit("shirt")),
  $.eq($.var("product.type"), $.lit("pants"))
)}>
  <p>Clothing item</p>
</Conditional>

// NOT condition
<Conditional when={$.not($.var("cart.empty"))}>
  <div className="cart-items">
    {{ cart.item_count }} items
  </div>
</Conditional>
```

### Nested Conditionals

```tsx
<Conditional when={$.var("customer")}>
  <div className="customer-area">
    <p>Hello, {{ customer.name }}</p>
    
    <Conditional when={$.var("customer.orders_count")}>
      <p>Thanks for being a customer!</p>
    </Conditional>
  </div>
</Conditional>
```

## For

The `<For>` component compiles to Liquid `{% for %}` loops.

### Basic Usage

```tsx
import { For, $ } from "@preliquify/preact";

<For each={$.var("products")} as="product">
  <div className="product">
    <h3>{{ product.title }}</h3>
    <p>${{ product.price }}</p>
  </div>
</For>
```

Compiles to:
```liquid
{% for product in products %}
  <div class="product">
    <h3>{{ product.title }}</h3>
    <p>${{ product.price }}</p>
  </div>
{% endfor %}
```

### Loop Over Collections

```tsx
// Collection products
<For each={$.var("collection.products")} as="product">
  <ProductCard product={product} />
</For>

// Blog articles
<For each={$.var("blog.articles")} as="article">
  <article>
    <h2>{{ article.title }}</h2>
    <div>{{ article.excerpt }}</div>
  </article>
</For>

// Menu links
<For each={$.var("linklists.main-menu.links")} as="link">
  <a href="{{ link.url }}">{{ link.title }}</a>
</For>
```

### Special Liquid Variables

Inside a `<For>` loop, you can access special Liquid variables:

```tsx
<For each={$.var("products")} as="product">
  <div className="product">
    {/* forloop.index: 1-based index */}
    <span className="number">{{ forloop.index }}</span>
    
    {/* forloop.index0: 0-based index */}
    <span data-index="{{ forloop.index0 }}">Product</span>
    
    {/* forloop.first: true on first iteration */}
    {% if forloop.first %}
      <div className="first-product">Featured!</div>
    {% endif %}
    
    {/* forloop.last: true on last iteration */}
    {% if forloop.last %}
      <div className="last-product">End of list</div>
    {% endif %}
    
    <h3>{{ product.title }}</h3>
  </div>
</For>
```

### Nested Loops

```tsx
<For each={$.var("collections")} as="collection">
  <div className="collection">
    <h2>{{ collection.title }}</h2>
    
    <For each="collection.products" as="product">
      <div className="product">
        <h3>{{ product.title }}</h3>
      </div>
    </For>
  </div>
</For>
```

### With Components

```tsx
function ProductGrid() {
  return (
    <div className="grid">
      <For each={$.var("collection.products")} as="product">
        <ProductCard product={product} />
      </For>
    </div>
  );
}

function ProductCard({ product }) {
  return (
    <div className="product-card">
      <img src="{{ product.featured_image }}" alt="{{ product.title }}" />
      <h3>{{ product.title }}</h3>
      <p>${{ product.price }}</p>
    </div>
  );
}
```

## Choose

The `<Choose>` component compiles to Liquid `{% case %}` statements for multi-way branching.

### Basic Usage

```tsx
import { Choose, $ } from "@preliquify/preact";

<Choose
  value={$.var("product.type")}
  cases={{
    "shirt": <div>This is a shirt</div>,
    "pants": <div>These are pants</div>,
    "shoes": <div>These are shoes</div>,
  }}
  default={<div>Other product type</div>}
/>
```

Compiles to:
```liquid
{% case product.type %}
  {% when "shirt" %}
    <div>This is a shirt</div>
  {% when "pants" %}
    <div>These are pants</div>
  {% when "shoes" %}
    <div>These are shoes</div>
  {% else %}
    <div>Other product type</div>
{% endcase %}
```

### Product Type Badges

```tsx
<Choose
  value={$.var("product.type")}
  cases={{
    "clothing": <span className="badge badge-blue">Clothing</span>,
    "electronics": <span className="badge badge-green">Electronics</span>,
    "home": <span className="badge badge-yellow">Home & Garden</span>,
  }}
  default={<span className="badge">Product</span>}
/>
```

### Order Status Display

```tsx
<Choose
  value={$.var("order.financial_status")}
  cases={{
    "paid": <span className="status-paid">✓ Paid</span>,
    "pending": <span className="status-pending">⏱ Pending</span>,
    "refunded": <span className="status-refunded">↩ Refunded</span>,
  }}
/>
```

## Hydrate

The `<Hydrate>` component creates interactive islands that get hydrated on the client-side.

### Basic Usage

```tsx
import { Hydrate } from "@preliquify/preact";

<Hydrate
  id="product-gallery"
  component="ProductGallery"
  props={{
    images: product.images,
    title: product.title,
  }}
>
  {/* Placeholder content shown until hydration */}
  <div>Loading gallery...</div>
</Hydrate>
```

### Interactive Product Gallery

```tsx
// In your component file
function ProductGallery({ images, title }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  return (
    <div className="gallery">
      <img src={images[currentIndex].src} alt={title} />
      <button onClick={() => setCurrentIndex(i => i - 1)}>Previous</button>
      <button onClick={() => setCurrentIndex(i => i + 1)}>Next</button>
    </div>
  );
}

// Usage with Hydrate
<Hydrate
  id="gallery-1"
  component="ProductGallery"
  props={{
    images: "{{ product.images | json }}",
    title: "{{ product.title }}",
  }}
>
  <img src="{{ product.featured_image }}" alt="{{ product.title }}" />
</Hydrate>
```

### Add to Cart Button

```tsx
function AddToCartButton({ variantId, productId }) {
  const [loading, setLoading] = useState(false);
  
  const handleClick = async () => {
    setLoading(true);
    await fetch('/cart/add.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: variantId, quantity: 1 }),
    });
    setLoading(false);
  };
  
  return (
    <button onClick={handleClick} disabled={loading}>
      {loading ? 'Adding...' : 'Add to Cart'}
    </button>
  );
}

// Usage
<Hydrate
  id={`add-to-cart-${product.id}`}
  component="AddToCartButton"
  props={{
    variantId: "{{ product.selected_or_first_available_variant.id }}",
    productId: "{{ product.id }}",
  }}
>
  <button>Add to Cart</button>
</Hydrate>
```

## Best Practices

### Use Primitives for Liquid Data

❌ Don't use JavaScript array methods at build time:
```tsx
{products.map(p => <div>{p.title}</div>)}
```

✅ Use `<For>` primitive:
```tsx
<For each={$.var("products")} as="p">
  <div>{{ p.title }}</div>
</For>
```

### Avoid Complex Logic in Build Time

Keep build-time logic simple. For complex interactions, use `<Hydrate>`:

```tsx
// Simple display logic - OK at build time
<Conditional when={$.var("product.available")}>
  <button>Add to Cart</button>
</Conditional>

// Complex interactions - use Hydrate
<Hydrate id="cart" component="ShoppingCart" props={{...}}>
  <div>Loading cart...</div>
</Hydrate>
```

### Type Safety

Always type your props:

```tsx
interface ProductCardProps {
  product: {
    title: string;
    price: number;
    available: boolean;
  };
}

function ProductCard({ product }: ProductCardProps) {
  // TypeScript will catch errors
}
```

## Next Steps

- [Working with Expressions](./expressions.md)
- [Client-Side Hydration](./hydration.md)
- [Best Practices](./best-practices.md)

