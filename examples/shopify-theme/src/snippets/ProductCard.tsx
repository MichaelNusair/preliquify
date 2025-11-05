/**
 * ProductCard Component Example
 *
 * This demonstrates how to:
 * 1. Define a component with props
 * 2. Pass Liquid snippet parameters from {% render %} call
 * 3. Automatically pass props to Preact component during hydration
 *
 * Usage in Shopify Liquid:
 *   {% render 'ProductCard', product: product, collection: collection %}
 */

/** @jsxImportSource preact */
import { h } from "preact";
import { useTarget, rawLiquid } from "@preliquify/preact";

// 1. Define your component props interface
interface ProductCardProps {
  product?: any;
  collection?: any;
  showPrice?: boolean;
  customTitle?: string;
}

// 2. Your actual component - receives props normally
function ProductCard(props: ProductCardProps) {
  // During build: props.product = "{{ product | json | escape }}" (string)
  // At runtime (Shopify): props.product = actual product object (evaluated by Liquid)
  // On client: props.product = parsed from data attribute

  return (
    <div className="product-card">
      <h3>{props.customTitle || "Product Title"}</h3>
      {props.showPrice && <div className="price">Price will be shown</div>}
      {/* Component implementation */}
    </div>
  );
}

// 3. SSR wrapper - wraps component with hydration attributes
function ProductCardSSR(props: ProductCardProps) {
  const target = useTarget();

  if (target === "liquid") {
    // Wrap component with data attributes for automatic hydration
    // The hydration runtime will read data-preliq-props and hydrate ProductCard
    // Note: props.product, props.collection are Liquid expression strings at build time
    // They become actual values when Shopify evaluates the Liquid at runtime

    // Construct JSON object using Liquid string concatenation
    // This is the correct way to build JSON with Liquid variables
    return (
      <div
        data-preliq-island="ProductCard"
        data-preliq-id="product-card"
        data-preliq-props={rawLiquid(
          `{{ '{"product":' | append: (product | json | escape) | append: ',"collection":' | append: (collection | json | escape) | append: ',"showPrice":' | append: (showPrice | default: true) | append: ',"customTitle":' | append: (product.title | escape | json) | append: '}' }}`
        )}
      >
        {/* Server-rendered HTML - will be replaced by hydrated component on client */}
        {/* At build time, props are Liquid expression strings, so we can't render the component */}
        {/* The hydration runtime will replace this placeholder with the actual component */}
        <div className="product-card-placeholder">Loading product...</div>
      </div>
    );
  }

  // Client-side: hydration script handles rendering
  return null;
}

// 4. Default export - this is what Preliquify compiles
// Use Liquid variables that match the parameters passed via {% render %}
export default function ProductCardSnippet() {
  return (
    <ProductCardSSR
      // These Liquid variables are available when you call:
      // {% render 'ProductCard', product: product, collection: collection %}
      product={rawLiquid("{{ product | json | escape }}")}
      collection={rawLiquid("{{ collection | json | escape }}")}
      showPrice={true}
      customTitle={rawLiquid("{{ product.title | escape }}")}
    />
  );
}
