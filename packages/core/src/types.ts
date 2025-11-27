// Core type definitions for PreLiquify

import type { ComponentType, JSX, VNode } from "preact";

/**
 * Expression type that can be evaluated in both Liquid and client contexts
 */
export interface Expr<T> {
  /** Convert expression to Liquid template syntax */
  toLiquid(): string;
  /** Convert expression to client-side JavaScript function */
  toClient(): (ctx: any) => T;
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
 */
export interface HydrateProps {
  /** Unique identifier for the island instance */
  id: string;
  /** Component name to hydrate on client */
  component: string;
  /** Props to pass to the hydrated component */
  props?: Record<string, any>;
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
}

/**
 * Component that can be rendered to Liquid
 */
export type LiquidComponent<P = {}> = ComponentType<P>;

/**
 * Props with Liquid expressions
 */
export type LiquidProps<P> = {
  [K in keyof P]: P[K] | Expr<P[K]> | string;
};

/**
 * Enhanced expression builder type definitions
 */
export interface ExpressionBuilder {
  // Literals
  lit<T>(value: T): Expr<T>;

  // Variables
  var(path: string): Expr<any>;
  var<T>(path: string): Expr<T>;

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
  size(collection: Expr<any[] | string | object>): Expr<number>;
  first<T>(array: Expr<T[]>): Expr<T | undefined>;
  last<T>(array: Expr<T[]>): Expr<T | undefined>;

  // Null checks
  isNil(value: Expr<any>): Expr<boolean>;
  isBlank(value: Expr<any>): Expr<boolean>;
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
  join(array: Expr<any[]>, separator: Expr<string>): Expr<string>;
  sort<T>(array: Expr<T[]>, property?: Expr<string>): Expr<T[]>;
  reverse<T>(array: Expr<T[]>): Expr<T[]>;
  uniq<T>(array: Expr<T[]>): Expr<T[]>;
  compact<T>(array: Expr<T[]>): Expr<T[]>;
  map<T>(array: Expr<T[]>, property: Expr<string>): Expr<any[]>;
  where<T>(
    array: Expr<T[]>,
    property: Expr<string>,
    value?: Expr<any>
  ): Expr<T[]>;

  // Date operations
  date(value: Expr<any>, format: Expr<string>): Expr<string>;

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
 */
export interface PreliquifyRuntime {
  /** Register a component for hydration */
  register(name: string, component: ComponentType<any>): void;

  /** Manually hydrate islands */
  hydrate(container?: Element): void;

  /** Get mounted component by ID */
  getComponent(id: string): any;

  /** Get all hydration errors */
  getErrors(): Error[];

  /** Enable/disable debug mode */
  setDebug(enabled: boolean): void;

  /** Unmount a component */
  unmount(id: string): boolean;

  /** Update component props */
  update(id: string, newProps: Record<string, any>): boolean;
}

// Re-export useful Preact types
export type { VNode, ComponentType, JSX } from "preact";
