/**
 * Helper to automatically create Liquid snippets from components
 *
 * This eliminates the need to manually write SSR wrappers and default exports.
 * Just write your component with normal props, and this handles the rest.
 *
 * @example
 * ```tsx
 * interface Props {
 *   product: Product;
 *   showPrice?: boolean;
 * }
 *
 * function ProductCard({ product, showPrice = true }: Props) {
 *   return <div>{product.title}</div>;
 * }
 *
 * export default createLiquidSnippet(ProductCard, {
 *   product: "product",  // Liquid variable name matches prop name
 *   showPrice: { liquidVar: "showPrice", default: true }
 * });
 * ```
 */

import { h } from "preact";
import { useTarget } from "../runtime.js";
import { rawLiquid } from "../liquid.js";
import type { ComponentType } from "preact";

type PropMapping =
  | string // Liquid variable name (same as prop name)
  | {
      liquidVar: string; // Liquid variable name
      default?: any; // Default value if not provided
    };

interface CreateLiquidSnippetOptions {
  /** Component name for hydration (defaults to component displayName or name) */
  componentName?: string;
  /** ID for the hydration island (defaults to component name in kebab-case) */
  id?: string;
  /** Placeholder content shown at build time (defaults to "Loading...") */
  placeholder?: any; // JSX.Element but avoiding JSX namespace dependency
}

/**
 * Creates a Liquid snippet from a component with automatic SSR wrapper and default export
 *
 * @param Component - Your component that receives normal props
 * @param propMapping - Mapping of prop names to Liquid variables
 * @param options - Optional configuration
 * @returns A component ready to be exported as default for Preliquify
 */
export function createLiquidSnippet<P extends Record<string, any>>(
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

  // SSR wrapper that automatically handles props
  function ComponentSSR(props: P) {
    const target = useTarget();

    if (target === "liquid") {
      // Build Liquid expression for data-preliq-props using append filter
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

      // Build the Liquid expression: {{ '{"prop1":' | append: (var1 | json | escape) | append: ',"prop2":' | append: (var2 | json | escape) | append: '}' }}
      const firstProp = propEntries[0];
      const firstPropName = String(firstProp[0]);
      const firstMapping = firstProp[1];
      const firstLiquidVar =
        typeof firstMapping === "string"
          ? firstMapping
          : firstMapping.liquidVar;
      const firstDefault =
        typeof firstMapping === "object" && "default" in firstMapping
          ? firstMapping.default
          : undefined;

      let liquidExpr = `{{ '{"${firstPropName}":' | append: (${firstLiquidVar}`;
      if (firstDefault !== undefined) {
        const defaultStr =
          typeof firstDefault === "string"
            ? `"${firstDefault}"`
            : String(firstDefault);
        liquidExpr += ` | default: ${defaultStr}`;
      }
      liquidExpr += ` | json | escape)`;

      // Add remaining props
      for (let i = 1; i < propEntries.length; i++) {
        const [propName, mapping] = propEntries[i];
        const liquidVar =
          typeof mapping === "string" ? mapping : mapping.liquidVar;
        const defaultValue =
          typeof mapping === "object" && "default" in mapping
            ? mapping.default
            : undefined;

        liquidExpr += ` | append: ',"${String(propName)}":' | append: (${liquidVar}`;
        if (defaultValue !== undefined) {
          const defaultStr =
            typeof defaultValue === "string"
              ? `"${defaultValue}"`
              : String(defaultValue);
          liquidExpr += ` | default: ${defaultStr}`;
        }
        liquidExpr += ` | json | escape)`;
      }

      liquidExpr += ` | append: '}' }}`;

      return (
        <div
          data-preliq-island={componentName}
          data-preliq-id={id}
          data-preliq-props={rawLiquid(liquidExpr)}
        >
          {placeholder}
        </div>
      );
    }

    return null;
  }

  // Default export that maps Liquid variables to props
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
        ) as any;
      } else {
        props[propName as keyof P] = rawLiquid(
          `{{ ${liquidVar} | json | escape }}`
        ) as any;
      }
    }

    return <ComponentSSR {...(props as P)} />;
  }

  // Set display name for debugging
  LiquidSnippet.displayName = `${componentName}Snippet`;

  return LiquidSnippet;
}
