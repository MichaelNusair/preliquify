/** @jsxImportSource preact */
import { h } from "preact";
import { useTarget, rawLiquid, liquidJson } from "@preliquify/preact";

interface YourComponentProps {
  metafieldData?: any;
  shopSettings?: any;
  fallbackData?: any;
}

function YourComponent(props: YourComponentProps) {
  return (
    <div className="your-component">
      <div className="component-content">Content here</div>
    </div>
  );
}

function YourComponentSSR(props: YourComponentProps) {
  const target = useTarget();

  if (target === "liquid") {
    const metafieldLiquid =
      typeof props.metafieldData === "string"
        ? props.metafieldData
        : liquidJson(props.metafieldData);

    const shopSettingsLiquid =
      typeof props.shopSettings === "string"
        ? props.shopSettings
        : liquidJson(props.shopSettings);

    const fallbackLiquid =
      typeof props.fallbackData === "string"
        ? props.fallbackData
        : liquidJson(props.fallbackData);

    return (
      <div
        className="your-component-ssr-root"
        data-metafield={rawLiquid(metafieldLiquid)}
        data-shop-settings={rawLiquid(shopSettingsLiquid)}
        data-fallback={rawLiquid(fallbackLiquid)}
      >
        <YourComponent {...props} />
      </div>
    );
  }

  return null;
}

export default function YourComponentSnippet() {
  return (
    <YourComponentSSR
      metafieldData={rawLiquid(
        "{{ product.metafields.namespace.key.value | json | escape }}"
      )}
      shopSettings={rawLiquid(
        "{{ shop.metafields.namespace.settings.value | json | escape }}"
      )}
      fallbackData={rawLiquid("{{ product.default_data | json | escape }}")}
    />
  );
}
