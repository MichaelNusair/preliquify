import { h } from "preact";
import { useTarget } from "../runtime.js";
import { rawLiquid } from "../liquid.js";
import type { ComponentType } from "preact";

/**
 * Helper to check if a value is a Liquid expression string
 * @internal
 */
function isLiquidExpression(value: unknown): boolean {
  return (
    typeof value === "string" && (value.includes("{{") || value.includes("{%"))
  );
}

/**
 * Mapping configuration for component props to Liquid variables
 *
 * Can be either:
 * - A string: The Liquid variable name (e.g., "product" maps to `{{ product }}`)
 * - An object with `liquidVar` and optional `default` value
 */
type PropMapping =
  | string // Liquid variable name (same as prop name)
  | {
      /** The Liquid variable name to map from */
      liquidVar: string;
      /** Default value if the Liquid variable is undefined/null */
      default?: unknown;
    };

/**
 * Options for configuring the Liquid snippet wrapper
 */
interface CreateLiquidSnippetOptions {
  /** Component name for hydration (defaults to component displayName or name) */
  componentName?: string;
  /** ID for the hydration island (defaults to component name in kebab-case) */
  id?: string;
  /** Placeholder content shown at build time (defaults to "Loading...") */
  placeholder?: unknown;
}

/**
 * Creates a Liquid snippet wrapper for a Preact component
 *
 * This is the recommended way to create components that accept props from Liquid.
 * It handles the mapping between Liquid variables and component props, and sets up
 * client-side hydration automatically.
 *
 * @template P - The component's prop types
 * @param Component - The Preact component to wrap
 * @param propMapping - Mapping of prop names to Liquid variables
 * @param options - Optional configuration for the snippet
 * @returns A wrapped component that can be compiled to Liquid
 *
 * @example
 * Basic usage with simple prop mapping:
 * ```tsx
 * interface ProductCardProps {
 *   product: any;
 *   showPrice: boolean;
 * }
 *
 * function ProductCard({ product, showPrice }: ProductCardProps) {
 *   return (
 *     <div className="product-card">
 *       <h3>{product.title}</h3>
 *       {showPrice && <p>${product.price}</p>}
 *     </div>
 *   );
 * }
 *
 * export default createLiquidSnippet(ProductCard, {
 *   product: "product",  // Maps to {{ product }}
 *   showPrice: "showPrice",  // Maps to {{ showPrice }}
 * });
 * ```
 *
 * @example
 * With default values:
 * ```tsx
 * export default createLiquidSnippet(ProductCard, {
 *   product: "product",
 *   showPrice: {
 *     liquidVar: "showPrice",
 *     default: true,  // Default to true if not provided
 *   },
 * });
 * ```
 *
 * @example
 * With custom component name and placeholder:
 * ```tsx
 * export default createLiquidSnippet(ProductCard, propMapping, {
 *   componentName: "MyProductCard",
 *   id: "product-card",
 *   placeholder: <div className="skeleton">Loading product...</div>,
 * });
 * ```
 *
 * @remarks
 * Usage in Shopify Liquid:
 * ```liquid
 * {% render 'ProductCard', product: product, showPrice: true %}
 * ```
 *
 * The component will:
 * 1. Render the placeholder at build time to avoid SSR errors
 * 2. Hydrate on the client with the actual props
 * 3. Replace the placeholder with the fully interactive component
 */
export function createLiquidSnippet<P extends Record<string, unknown>>(
  Component: ComponentType<P>,
  propMapping: Record<keyof P, PropMapping>,
  options: CreateLiquidSnippetOptions = {}
): ComponentType {
  const componentName =
    options.componentName ||
    Component.displayName ||
    Component.name ||
    "Component";
  const id =
    options.id ||
    componentName
      .toLowerCase()
      .replace(/([A-Z])/g, "-$1")
      .replace(/^-/, "");
  const placeholder = options.placeholder || <div>Loading...</div>;

  function ComponentSSR(props: P) {
    const propEntries = Object.entries(propMapping);

    if (propEntries.length === 0) {
      return (
        <div
          data-preliq-island={componentName}
          data-preliq-id={id}
          data-preliq-props={rawLiquid("{}")}
        >
          {placeholder}
        </div>
      );
    }

    const firstProp = propEntries[0];
    const firstPropName = String(firstProp[0]);
    const firstMapping = firstProp[1];
    const firstLiquidVar =
      typeof firstMapping === "string" ? firstMapping : firstMapping.liquidVar;
    const firstDefault =
      typeof firstMapping === "object" && "default" in firstMapping
        ? firstMapping.default
        : undefined;

    const escapedFirstPropName = firstPropName.replace(/'/g, "''");

    // Build JSON using Liquid assigns - output as script tag content to avoid HTML escaping
    // Extract quote character from a string to avoid literal quotes that get HTML-escaped
    let liquidExpr = `{% assign _q = 'a"b' | split: 'a' | last | split: 'b' | first %}`;
    liquidExpr += `{% assign _json = '{' %}`;
    liquidExpr += `{% assign _json = _json | append: _q | append: '${escapedFirstPropName}' | append: _q | append: ':' %}`;
    // Assign the filtered value first, then append it (append filter doesn't accept filter chains)
    liquidExpr += `{% assign _val = ${firstLiquidVar}`;
    if (firstDefault !== undefined) {
      const defaultStr =
        typeof firstDefault === "string"
          ? `"${firstDefault}"`
          : String(firstDefault);
      liquidExpr += ` | default: ${defaultStr}`;
    }
    liquidExpr += ` | json | escape %}`;
    liquidExpr += `{% assign _json = _json | append: _val %}`;

    for (let i = 1; i < propEntries.length; i++) {
      const [propName, mapping] = propEntries[i];
      const liquidVar =
        typeof mapping === "string" ? mapping : mapping.liquidVar;
      const defaultValue =
        typeof mapping === "object" && "default" in mapping
          ? mapping.default
          : undefined;

      const escapedPropName = String(propName).replace(/'/g, "''");
      liquidExpr += `{% assign _json = _json | append: ',' | append: _q | append: '${escapedPropName}' | append: _q | append: ':' %}`;
      // Assign the filtered value first, then append it
      liquidExpr += `{% assign _val = ${liquidVar}`;
      if (defaultValue !== undefined) {
        const defaultStr =
          typeof defaultValue === "string"
            ? `"${defaultValue}"`
            : String(defaultValue);
        liquidExpr += ` | default: ${defaultStr}`;
      }
      liquidExpr += ` | json | escape %}`;
      liquidExpr += `{% assign _json = _json | append: _val %}`;
    }

    liquidExpr += `{% assign _json = _json | append: '}' %}{{ _json }}`;

    // At build time (liquid target), always render placeholder to avoid errors
    // Components that use .map() or other JS methods will fail with Liquid expression strings
    // Client-side hydration will replace the placeholder with the actual component
    const target = useTarget();
    if (target === "liquid") {
      return (
        <div data-preliq-island={componentName} data-preliq-id={id}>
          <script
            type="application/json"
            data-preliq-props=""
            dangerouslySetInnerHTML={{ __html: rawLiquid(liquidExpr) }}
          />
          {placeholder}
        </div>
      );
    }

    // During client-side rendering (hydration), render the actual component
    // Props are now actual data (not Liquid expression strings), so it's safe
    return <Component {...props} />;
  }

  function LiquidSnippet() {
    const props: Partial<P> = {};

    for (const [propName, mapping] of Object.entries(propMapping)) {
      const liquidVar =
        typeof mapping === "string" ? mapping : mapping.liquidVar;
      const defaultValue =
        typeof mapping === "object" && "default" in mapping
          ? mapping.default
          : undefined;

      if (defaultValue !== undefined) {
        props[propName as keyof P] = rawLiquid(
          `{{ ${liquidVar} | default: ${typeof defaultValue === "string" ? `"${defaultValue}"` : defaultValue} | json | escape }}`
        ) as P[keyof P];
      } else {
        props[propName as keyof P] = rawLiquid(
          `{{ ${liquidVar} | json | escape }}`
        ) as P[keyof P];
      }
    }

    return <ComponentSSR {...(props as P)} />;
  }

  LiquidSnippet.displayName = `${componentName}Snippet`;

  return LiquidSnippet;
}
