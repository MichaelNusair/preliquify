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
  placeholder?: any;
}

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
    liquidExpr += `{% assign _json = _json | append: (${firstLiquidVar}`;
    if (firstDefault !== undefined) {
      const defaultStr =
        typeof firstDefault === "string"
          ? `"${firstDefault}"`
          : String(firstDefault);
      liquidExpr += ` | default: ${defaultStr}`;
    }
    liquidExpr += ` | json | escape) %}`;

    for (let i = 1; i < propEntries.length; i++) {
      const [propName, mapping] = propEntries[i];
      const liquidVar =
        typeof mapping === "string" ? mapping : mapping.liquidVar;
      const defaultValue =
        typeof mapping === "object" && "default" in mapping
          ? mapping.default
          : undefined;

      const escapedPropName = String(propName).replace(/'/g, "''");
      liquidExpr += `{% assign _json = _json | append: ',' | append: _q | append: '${escapedPropName}' | append: _q | append: ':' | append: (${liquidVar}`;
      if (defaultValue !== undefined) {
        const defaultStr =
          typeof defaultValue === "string"
            ? `"${defaultValue}"`
            : String(defaultValue);
        liquidExpr += ` | default: ${defaultStr}`;
      }
      liquidExpr += ` | json | escape) %}`;
    }

    liquidExpr += `{% assign _json = _json | append: '}' %}{{ _json }}`;

    // Output props as script tag content (not attribute) to avoid HTML escaping
    // Script tag is created via JSX, Liquid expression outputs JSON content
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

  LiquidSnippet.displayName = `${componentName}Snippet`;

  return LiquidSnippet;
}
