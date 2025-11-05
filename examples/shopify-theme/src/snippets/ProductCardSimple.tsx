/** @jsxImportSource preact */
import { createLiquidSnippet } from "@preliquify/preact";

interface ProductCardProps {
  product?: any;
  collection?: any;
  showPrice?: boolean;
  customTitle?: string;
}

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

export default createLiquidSnippet(ProductCard, {
  product: "product",
  collection: "collection",
  showPrice: { liquidVar: "showPrice", default: true },
  customTitle: "customTitle",
});
