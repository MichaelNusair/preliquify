/**
 * ProductCard - Simplified using createLiquidSnippet
 *
 * This demonstrates the new createLiquidSnippet helper that eliminates
 * the need to manually write SSR wrappers and default exports.
 *
 * Usage in Shopify Liquid:
 *   {% render 'ProductCardSimple', product: product, collection: collection %}
 */

/** @jsxImportSource preact */
import { createLiquidSnippet } from "@preliquify/preact";

// 1. Define your component props interface
interface ProductCardProps {
  product?: any;
  collection?: any;
  showPrice?: boolean;
  customTitle?: string;
}

// 2. Write your component normally - just business logic!
function ProductCard({
  product,
  collection,
  showPrice,
  customTitle,
}: ProductCardProps) {
  return (
    <div className="product-card">
      <h3>{customTitle || product?.title || "Product Title"}</h3>
      {showPrice && <div className="price">${product?.price || "0.00"}</div>}
      {collection && <div className="collection">{collection.title}</div>}
    </div>
  );
}

// 3. That's it! createLiquidSnippet handles:
//    - SSR wrapper with data attributes
//    - Default export that maps Liquid variables
//    - Placeholder rendering at build time
export default createLiquidSnippet(ProductCard, {
  product: "product", // Liquid variable name matches prop name
  collection: "collection",
  showPrice: { liquidVar: "showPrice", default: true },
  customTitle: "customTitle",
});
