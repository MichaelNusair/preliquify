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
    <div className="product-card border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
      <h3 className="text-xl font-semibold text-gray-900 mb-2">
        {customTitle || product?.title || "Product Title"}
      </h3>
      {showPrice && (
        <div className="price text-2xl font-bold text-blue-600 mb-2">
          ${product?.price || "0.00"}
        </div>
      )}
      {collection && (
        <div className="collection text-sm text-gray-500">
          {collection.title}
        </div>
      )}
    </div>
  );
}

export default createLiquidSnippet(ProductCard, {
  product: "product",
  collection: "collection",
  showPrice: { liquidVar: "showPrice", default: true },
  customTitle: "customTitle",
});
