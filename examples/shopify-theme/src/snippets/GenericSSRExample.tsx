/**
 * Generic SSR + Hydration Pattern Example
 *
 * This demonstrates how Preliquify transforms a Preact component:
 * 1. Component receives props (which can be Liquid expressions)
 * 2. Build time: Renders component with Liquid variables → Liquid snippet
 * 3. Runtime: Liquid evaluates variables → HTML with data attributes
 * 4. Client: Hydration script reads data attributes → hydrates component
 */

/** @jsxImportSource preact */
import { h } from "preact";
import { useTarget, rawLiquid, liquidJson } from "@preliquify/preact";

// Your actual component - receives props as usual
interface YourComponentProps {
  // Define your props interface
  metafieldData?: any;
  shopSettings?: any;
  fallbackData?: any;
}

function YourComponent(props: YourComponentProps) {
  // Your component logic here
  // During build: props are Liquid expressions (strings)
  // At runtime: props are actual values (after Liquid evaluates)
  // On client: props are parsed from DOM attributes

  return (
    <div className="your-component">
      {/* Component implementation */}
      {/* During build, this will render with Liquid expression strings */}
      <div className="component-content">Content here</div>
    </div>
  );
}

// SSR wrapper that adds data attributes for hydration
function YourComponentSSR(props: YourComponentProps) {
  const target = useTarget();

  if (target === "liquid") {
    // SERVER-SIDE (Build time):
    // Props contain Liquid expressions (strings like "{{ variable }}")
    // Wrap component with data attributes that will contain Liquid expressions

    // Convert props to Liquid expressions for data attributes
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
        {/* Server-rendered component HTML */}
        {/* During build, this renders with the props passed below */}
        <YourComponent {...props} />
      </div>
    );
  }

  // CLIENT-SIDE: Return null, hydration script handles rendering
  return null;
}

// Default export - this is what Preliquify compiles
// Props are passed as Liquid expressions here
export default function YourComponentSnippet() {
  return (
    <YourComponentSSR
      // These props become Liquid expressions in the output
      // They will be evaluated at runtime by Shopify Liquid
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

/**
 * Build Process:
 *
 * 1. Preliquify finds this file (default export)
 * 2. Renders with TargetProvider("liquid") → component renders in SSR mode
 * 3. YourComponentSSR returns the wrapped div with data attributes
 * 4. Output Liquid snippet contains:
 *    - Server-rendered HTML from <YourComponent />
 *    - Data attributes with Liquid expressions
 *
 * Runtime (Shopify):
 *
 * 1. Liquid template evaluates variables:
 *    data-metafield="{{ product.metafields.namespace.key.value | json | escape }}"
 *    → data-metafield='{"key": "value"}' (actual JSON)
 *
 * 2. Browser receives HTML with data attributes containing JSON
 *
 * Client Hydration:
 *
 * 1. Hydration script finds .your-component-ssr-root elements
 * 2. Reads data attributes and parses JSON
 * 3. Renders YourComponent with parsed props
 * 4. Component becomes interactive
 */
