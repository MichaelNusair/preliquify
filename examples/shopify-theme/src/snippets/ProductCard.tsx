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
import { useTarget, rawLiquid, liquidJson } from "@preliquify/preact";

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

// 3. SSR wrapper - captures props in data attributes for hydration
function ProductCardSSR(props: ProductCardProps) {
  const target = useTarget();

  if (target === "liquid") {
    // Store all props in data-preliq-props for automatic hydration
    // The hydration runtime will automatically read this and pass to ProductCard
    // Use Liquid expressions that reference the parameters passed via {% render %}
    return (
      <div
        className="product-card-ssr"
        data-preliq-props={rawLiquid(`{{ {
          "product": {{ product | json | escape }},
          "collection": {{ collection | json | escape }},
          "showPrice": {{ showPrice | default: true }},
          "customTitle": {{ product.title | escape | json }}
        } | json | escape }}`)}
      >
        {/* Server-rendered HTML */}
        <ProductCard {...props} />
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
