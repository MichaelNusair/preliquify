import type { ComponentType, JSX, VNode } from "preact";

/**
 * Expression type that can be evaluated in both Liquid and client contexts
 *
 * Expressions provide a dual-compilation model:
 * - At build time: Generate Liquid template syntax via `toLiquid()`
 * - At runtime: Evaluate in the browser via `toClient()`
 *
 * @template T - The type of value this expression evaluates to
 *
 * @example
 * ```tsx
 * const expr: Expr<string> = $.var("product.title");
 * expr.toLiquid() // => "product.title" (used at build time)
 * expr.toClient()({ product: { title: "Shoes" } }) // => "Shoes" (used at runtime)
 * ```
 */
export interface Expr<T> {
  /** Convert expression to Liquid template syntax */
  toLiquid(): string;
  /** Convert expression to client-side JavaScript function */
  toClient(): (ctx: Record<string, unknown>) => T;
}

/**
 * Component props for conditional rendering
 */
export interface ConditionalProps {
  when: Expr<boolean>;
  children: JSX.Element | JSX.Element[];
}

/**
 * Component props for loop rendering
 */
export interface ForProps<T> {
  each: Expr<T[]>;
  as: string;
  children: JSX.Element | JSX.Element[];
}

/**
 * Component props for hydration islands
 *
 * Islands are interactive components that get hydrated on the client-side
 * after the initial Liquid template is rendered by Shopify.
 *
 * @example
 * ```tsx
 * <Hydrate
 *   id="product-gallery-1"
 *   component="ProductGallery"
 *   props={{ productId: "123", images: [...] }}
 * />
 * ```
 */
export interface HydrateProps {
  /** Unique identifier for the island instance */
  id: string;
  /** Component name to hydrate on client */
  component: string;
  /** Props to pass to the hydrated component */
  props?: Record<string, unknown>;
}

/**
 * PreLiquify configuration options
 */
export interface PreliquifyConfig {
  /** Source directory for components */
  srcDir?: string;
  /** Output directory for Liquid templates */
  outLiquidDir?: string;
  /** Output directory for client assets */
  outClientDir?: string;
  /** JSX import source */
  jsxImportSource?: string;
  /** Enable watch mode */
  watch?: boolean;
  /** Enable verbose logging */
  verbose?: boolean;
  /** Suffix all dist files (liquid and js) with -prlq (default: true) */
  suffixDistFiles?: boolean;
}

/**
 * Component that can be rendered to Liquid
 *
 * @template P - The component's prop types
 */
export type LiquidComponent<P = Record<string, unknown>> = ComponentType<P>;

/**
 * Props with Liquid expressions
 *
 * Allows props to be either:
 * - The actual value (used at build time)
 * - An Expr (for dynamic Liquid expressions)
 * - A string (raw Liquid variable name)
 *
 * @template P - The original prop types
 *
 * @example
 * ```tsx
 * type ProductProps = { title: string; price: number };
 * type ProductLiquidProps = LiquidProps<ProductProps>;
 * // { title: string | Expr<string> | string, price: number | Expr<number> | string }
 * ```
 */
export type LiquidProps<P> = {
  [K in keyof P]: P[K] | Expr<P[K]> | string;
};

/**
 * Enhanced expression builder type definitions
 *
 * Extended API for building more complex Liquid expressions with type safety
 */
export interface ExpressionBuilder {
  // Literals
  lit<T>(value: T): Expr<T>;

  // Variables
  var<T = unknown>(path: string): Expr<T>;

  // Logical operators
  not(expr: Expr<boolean>): Expr<boolean>;
  and(a: Expr<boolean>, b: Expr<boolean>): Expr<boolean>;
  or(a: Expr<boolean>, b: Expr<boolean>): Expr<boolean>;

  // Comparison operators
  eq<T>(a: Expr<T>, b: Expr<T>): Expr<boolean>;
  neq<T>(a: Expr<T>, b: Expr<T>): Expr<boolean>;
  gt(a: Expr<number>, b: Expr<number>): Expr<boolean>;
  gte(a: Expr<number>, b: Expr<number>): Expr<boolean>;
  lt(a: Expr<number>, b: Expr<number>): Expr<boolean>;
  lte(a: Expr<number>, b: Expr<number>): Expr<boolean>;

  // Array/String operations
  contains<T>(collection: Expr<T[] | string>, item: Expr<T>): Expr<boolean>;
  size(
    collection: Expr<unknown[] | string | Record<string, unknown>>
  ): Expr<number>;
  first<T>(array: Expr<T[]>): Expr<T | undefined>;
  last<T>(array: Expr<T[]>): Expr<T | undefined>;

  // Null checks
  isNil(value: Expr<unknown>): Expr<boolean>;
  isBlank(value: Expr<unknown>): Expr<boolean>;
}

/**
 * Enhanced expression builder with Shopify filters
 */
export interface EnhancedExpressionBuilder extends ExpressionBuilder {
  // Math operations
  plus(a: Expr<number>, b: Expr<number>): Expr<number>;
  minus(a: Expr<number>, b: Expr<number>): Expr<number>;
  times(a: Expr<number>, b: Expr<number>): Expr<number>;
  dividedBy(a: Expr<number>, b: Expr<number>): Expr<number>;
  modulo(a: Expr<number>, b: Expr<number>): Expr<number>;
  abs(value: Expr<number>): Expr<number>;
  ceil(value: Expr<number>): Expr<number>;
  floor(value: Expr<number>): Expr<number>;
  round(value: Expr<number>, decimals?: Expr<number>): Expr<number>;

  // String operations
  append(str: Expr<string>, suffix: Expr<string>): Expr<string>;
  prepend(str: Expr<string>, prefix: Expr<string>): Expr<string>;
  downcase(str: Expr<string>): Expr<string>;
  upcase(str: Expr<string>): Expr<string>;
  capitalize(str: Expr<string>): Expr<string>;
  strip(str: Expr<string>): Expr<string>;
  stripNewlines(str: Expr<string>): Expr<string>;
  truncate(
    str: Expr<string>,
    length: Expr<number>,
    ellipsis?: Expr<string>
  ): Expr<string>;
  replace(
    str: Expr<string>,
    search: Expr<string>,
    replacement: Expr<string>
  ): Expr<string>;
  split(str: Expr<string>, delimiter: Expr<string>): Expr<string[]>;

  // Array operations
  join(array: Expr<unknown[]>, separator: Expr<string>): Expr<string>;
  sort<T>(array: Expr<T[]>, property?: Expr<string>): Expr<T[]>;
  reverse<T>(array: Expr<T[]>): Expr<T[]>;
  uniq<T>(array: Expr<T[]>): Expr<T[]>;
  compact<T>(array: Expr<(T | null | undefined)[]>): Expr<T[]>;
  map<T, K extends keyof T>(
    array: Expr<T[]>,
    property: Expr<string>
  ): Expr<T[K][]>;
  where<T>(
    array: Expr<T[]>,
    property: Expr<string>,
    value?: Expr<unknown>
  ): Expr<T[]>;

  // Date operations
  date(value: Expr<string | number | Date>, format: Expr<string>): Expr<string>;

  // Default value
  default<T>(value: Expr<T | null | undefined>, fallback: Expr<T>): Expr<T>;

  // Shopify-specific filters
  money(value: Expr<number>): Expr<string>;
  moneyWithoutCurrency(value: Expr<number>): Expr<string>;
  handle(value: Expr<string>): Expr<string>;
  pluralize(
    count: Expr<number>,
    singular: Expr<string>,
    plural: Expr<string>
  ): Expr<string>;
}

/**
 * Component metadata for runtime
 */
export interface ComponentMetadata {
  name: string;
  hasIslands: boolean;
  dependencies: string[];
}

/**
 * Build result information
 */
export interface BuildResult {
  success: boolean;
  componentsBuilt: number;
  errors: Error[];
  warnings: string[];
}

/**
 * Runtime hydration options
 */
export interface HydrationOptions {
  /** Enable debug mode */
  debug?: boolean;
  /** Root element to search for islands */
  root?: Element;
  /** Callback after hydration */
  onHydrated?: (componentName: string, id: string) => void;
  /** Error handler */
  onError?: (error: Error, componentName: string) => void;
}

/**
 * PreLiquify runtime API
 *
 * The runtime handles client-side hydration of interactive islands
 * in Shopify Liquid templates.
 */
export interface PreliquifyRuntime {
  /** Register a component for hydration */
  register(name: string, component: ComponentType<unknown>): void;

  /** Manually hydrate islands */
  hydrate(container?: Element): void;

  /** Get mounted component by ID */
  getComponent(id: string): ComponentType<unknown> | undefined;

  /** Get all hydration errors */
  getErrors(): Error[];

  /** Enable/disable debug mode */
  setDebug(enabled: boolean): void;

  /** Unmount a component */
  unmount(id: string): boolean;

  /** Update component props */
  update(id: string, newProps: Record<string, unknown>): boolean;
}

// Re-export useful Preact types
export type { VNode, ComponentType, JSX } from "preact";
