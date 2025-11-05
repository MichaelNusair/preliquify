/** @jsxImportSource preact */
import { h } from "preact";
import { useTarget, rawLiquid } from "@preliquify/preact";

interface ProductCardProps {
  product?: any;
  collection?: any;
  showPrice?: boolean;
  customTitle?: string;
}

function ProductCard(props: ProductCardProps) {
  return (
    <div className="product-card">
      <h3>{props.customTitle || "Product Title"}</h3>
      {props.showPrice && <div className="price">Price will be shown</div>}
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
        data-preliq-props={rawLiquid(
          `{{ '{"product":' | append: (product | json | escape) | append: ',"collection":' | append: (collection | json | escape) | append: ',"showPrice":' | append: (showPrice | default: true) | append: ',"customTitle":' | append: (product.title | escape | json) | append: '}' }}`
        )}
      >
        <div className="product-card-placeholder">Loading product...</div>
      </div>
    );
  }

  return null;
}

export default function ProductCardSnippet() {
  return (
    <ProductCardSSR
      product={rawLiquid("{{ product | json | escape }}")}
      collection={rawLiquid("{{ collection | json | escape }}")}
      showPrice={true}
      customTitle={rawLiquid("{{ product.title | escape }}")}
    />
  );
}
