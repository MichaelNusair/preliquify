import type { Expr } from "./types.js";

export type { Expr };

/**
 * Creates an Expr object with toString() and valueOf() methods for primitive conversion.
 * This allows Expr objects to be used directly in JSX contexts where they need to be
 * converted to strings or primitives.
 */
export function createExpr<T>(
  toLiquid: () => string,
  toClient: () => (ctx: Record<string, unknown>) => T
): Expr<T> {
  const expr: Expr<T> = {
    toLiquid,
    toClient,
  };

  // Add toString() and valueOf() to allow primitive conversion
  // This is needed when Expr objects are used in JSX contexts (e.g., inside For loops)
  Object.defineProperty(expr, "toString", {
    value() {
      return toLiquid();
    },
    enumerable: false,
    configurable: true,
  });

  Object.defineProperty(expr, "valueOf", {
    value() {
      return toLiquid();
    },
    enumerable: false,
    configurable: true,
  });

  // Add .value getter for runtime access
  // This allows accessing the actual value at runtime: expr.value
  Object.defineProperty(expr, "value", {
    get() {
      // At runtime, evaluate with empty context (will be populated by actual props)
      // This is a convenience getter - actual evaluation happens in components
      return toClient()({});
    },
    enumerable: false,
    configurable: true,
  });

  return expr;
}

/**
 * Expression builder for creating Liquid expressions with type safety
 *
 * The `$` helper provides a fluent API for building Liquid expressions that work
 * both at compile-time (generating Liquid syntax) and runtime (evaluating in the browser).
 *
 * @example
 * ```tsx
 * import { $, Conditional } from '@preliquify/preact';
 *
 * // Variable expression
 * const productTitle = $.var("product.title");
 *
 * // Literal expression
 * const isActive = $.lit(true);
 *
 * // Conditional logic
 * <Conditional when={$.var("customer.email")}>
 *   <p>Welcome back!</p>
 * </Conditional>
 * ```
 */
export const $ = {
  /**
   * Creates a literal expression from a JavaScript value
   *
   * @template T - The type of the literal value
   * @param v - The literal value (string, number, boolean, null, etc.)
   * @returns An Expr that represents the literal in Liquid and runtime
   *
   * @example
   * ```tsx
   * $.lit("hello")     // => 'hello' in Liquid (single quotes to avoid HTML escaping)
   * $.lit(42)          // => 42 in Liquid
   * $.lit(true)        // => true in Liquid
   * $.lit(null)        // => null in Liquid
   * ```
   */
  lit<T>(v: T): Expr<T> {
    return createExpr(
      () => {
        // Use single quotes for strings in Liquid to avoid HTML escaping issues
        // Liquid uses single quotes in conditionals: {% if var == 'value' %}
        if (typeof v === "string") {
          // Escape single quotes by doubling them (Liquid convention)
          const escaped = v.replace(/'/g, "''");
          return `'${escaped}'`;
        }
        // For other types, use JSON.stringify (numbers, booleans, null)
        return String(v);
      },
      () => () => v
    );
  },

  /**
   * Creates a variable expression from a Liquid variable path
   *
   * @template T - The expected type of the variable (defaults to unknown)
   * @param name - The Liquid variable path (e.g., "product.title", "customer.email") or an Expr<string>
   * @returns An Expr that represents the variable in Liquid and runtime
   *
   * @example
   * ```tsx
   * $.var("product.title")              // Access product title
   * $.var("customer.email")             // Access customer email
   * $.var($.when(condition, "path1", "path2"))  // Conditional path
   * ```
   */
  var<T = unknown>(name: string | Expr<string>): Expr<T> {
    // If name is already an Expr, use it directly
    if (typeof name === "object" && "toLiquid" in name) {
      return createExpr(
        () => name.toLiquid(),
        () => (ctx: Record<string, unknown>) => {
          const path = name.toClient()(ctx);
          const segments = String(path).split(".");
          let cur: unknown = ctx;
          for (const s of segments) {
            cur = (cur as Record<string, unknown>)?.[s];
          }
          return cur as T;
        }
      );
    }

    // Otherwise, treat as string path
    return createExpr(
      () => name,
      () => (ctx: Record<string, unknown>) => {
        const segments = name.split(".");
        let cur: unknown = ctx;
        for (const s of segments) {
          cur = (cur as Record<string, unknown>)?.[s];
        }
        return cur as T;
      }
    );
  },

  /**
   * Helper to build nested Liquid variable paths dynamically
   *
   * @param basePath - The base Liquid variable path (e.g., "designSettings")
   * @param segments - Additional path segments to append
   * @returns The full Liquid variable path
   *
   * @example
   * ```tsx
   * $.path("designSettings", "desktopSettings", "layoutType")
   * // => "designSettings.desktopSettings.layoutType"
   *
   * const base = "designSettings";
   * const path = $.path(base, "desktopSettings", "desktopLayoutType");
   * $.var(path)  // Access designSettings.desktopSettings.desktopLayoutType
   * ```
   */
  path(basePath: string, ...segments: string[]): string {
    if (segments.length === 0) return basePath;
    return [basePath, ...segments].join(".");
  },

  /**
   * Creates a logical NOT expression
   *
   * @param a - The boolean expression to negate
   * @returns An Expr that represents `not a` in Liquid
   *
   * @example
   * ```tsx
   * $.not($.var("customer.logged_in"))  // => not customer.logged_in
   * <Conditional when={$.not($.var("settings.show_header"))}>
   *   <p>Header is hidden</p>
   * </Conditional>
   * ```
   */
  not(a: Expr<boolean>): Expr<boolean> {
    // Liquid doesn't support parentheses around 'not'
    // WARNING: When negating OR expressions, use De Morgan's law:
    // not (A or B) = (not A) and (not B)
    // Liquid parses "not A or B" as "(not A) or B", not "not (A or B)"
    const liquidStr = a.toLiquid();
    
    // Check if this is an OR expression (contains " or ")
    // If so, warn the user that they should use De Morgan's law
    if (liquidStr.includes(" or ")) {
      console.warn(
        "[Preliquify] Negating an OR expression. Liquid will parse 'not A or B' as '(not A) or B', not 'not (A or B)'. " +
        "Use De Morgan's law: not (A or B) = (not A) and (not B). " +
        "Or restructure to check for the specific conditions you want."
      );
    }
    
    return createExpr(
      () => `not ${liquidStr}`,
      () => (ctx) => !a.toClient()(ctx)
    );
  },

  /**
   * Creates a logical AND expression
   *
   * @param a - First boolean expression
   * @param b - Second boolean expression
   * @returns An Expr that represents `a and b` in Liquid
   *
   * @example
   * ```tsx
   * $.and($.var("customer.logged_in"), $.var("settings.show_welcome"))
   * // => customer.logged_in and settings.show_welcome
   * ```
   */
  and(a: Expr<boolean>, b: Expr<boolean>): Expr<boolean> {
    // Note: Liquid doesn't support parentheses, but for AND we can still use them
    // in simple cases. However, to be safe, we'll avoid them when possible.
    return createExpr(
      () => `${a.toLiquid()} and ${b.toLiquid()}`,
      () => (ctx) => a.toClient()(ctx) && b.toClient()(ctx)
    );
  },

  /**
   * Creates a logical OR expression
   * Supports chaining multiple OR conditions (Shopify Liquid supports this)
   *
   * @param a - First boolean expression
   * @param b - Second boolean expression
   * @param rest - Additional boolean expressions to chain with OR
   * @returns An Expr that represents `a or b or ...` in Liquid
   *
   * @example
   * ```tsx
   * // Two conditions
   * $.or($.var("customer.logged_in"), $.var("cart.item_count"))
   * // => customer.logged_in or cart.item_count
   *
   * // Three or more conditions
   * $.or(
   *   $.eq($.var("product.type"), $.lit("shirt")),
   *   $.eq($.var("product.type"), $.lit("pants")),
   *   $.eq($.var("product.type"), $.lit("shoes"))
   * )
   * // => product.type == 'shirt' or product.type == 'pants' or product.type == 'shoes'
   * ```
   */
  or(
    a: Expr<boolean>,
    b: Expr<boolean>,
    ...rest: Expr<boolean>[]
  ): Expr<boolean> {
    // Chain multiple ORs: a or b or c or d ...
    // Note: Liquid doesn't support parentheses, so we don't wrap conditions
    const allExprs = [a, b, ...rest];
    return createExpr(
      () => {
        // Generate: a or b or c or d (no parentheses - Liquid doesn't support them)
        return allExprs.map((expr) => expr.toLiquid()).join(" or ");
      },
      () => (ctx) => {
        // Evaluate all and return true if any is true
        return allExprs.some((expr) => expr.toClient()(ctx));
      }
    );
  },

  /**
   * Conditionally selects a value or path based on a condition.
   * Automatically handles both runtime values and Liquid paths.
   *
   * @template T - The type of the selected value
   * @param condition - Boolean condition (can be a prop or Liquid variable)
   * @param trueValue - Value/path to use when condition is true
   * @param falseValue - Value/path to use when condition is false
   * @returns An Expr representing the selected value
   *
   * @example
   * ```tsx
   * // Select path based on prop (for Liquid)
   * const settings = $.when(
   *   staticIsMobile,
   *   $.var("designSettings.mobileSettings"),
   *   $.var("designSettings.desktopSettings")
   * );
   * // Access nested property
   * const layoutType = $.prop(settings, "desktopLayoutType");
   *
   * // Select runtime value (for client-side)
   * const runtimeSettings = $.when(
   *   staticIsMobile,
   *   mobileSettings,  // runtime value
   *   desktopSettings  // runtime value
   * );
   * ```
   */
  when<T>(
    condition: boolean | Expr<boolean>,
    trueValue: T | Expr<T>,
    falseValue: T | Expr<T>
  ): Expr<T> {
    // Check if values are Exprs
    const trueIsExpr =
      typeof trueValue === "object" &&
      trueValue !== null &&
      "toLiquid" in trueValue;
    const falseIsExpr =
      typeof falseValue === "object" &&
      falseValue !== null &&
      "toLiquid" in falseValue;

    // Store runtime values for .value access
    const trueRuntime = trueIsExpr ? undefined : (trueValue as T);
    const falseRuntime = falseIsExpr ? undefined : (falseValue as T);

    // If condition is a boolean prop
    if (typeof condition === "boolean") {
      const selectedValue = condition ? trueValue : falseValue;
      const selectedRuntime = condition ? trueRuntime : falseRuntime;

      // If selected value is an Expr, enhance it with runtime value access
      if (
        typeof selectedValue === "object" &&
        selectedValue !== null &&
        "toLiquid" in selectedValue
      ) {
        const selectedExpr = selectedValue as Expr<T>;

        // Create enhanced Expr that preserves runtime value for .value access
        return createExpr(
          () => selectedExpr.toLiquid(),
          () => {
            // If we have runtime value, use it; otherwise evaluate the Expr
            if (selectedRuntime !== undefined) {
              return () => selectedRuntime;
            }
            return selectedExpr.toClient();
          }
        );
      }

      // Both are runtime values - create Expr that returns the selected value
      // WARNING: This won't work in Liquid context - runtime objects can't be converted to Liquid paths
      // For Liquid, you should use $.var() with Liquid paths instead
      return createExpr(
        () => {
          // For Liquid, we can't use runtime values directly
          // If it's an object, we can't generate a valid Liquid path
          if (typeof selectedRuntime === "object" && selectedRuntime !== null) {
            // This will generate invalid Liquid - user should use Liquid paths instead
            console.warn(
              "[Preliquify] $.when() received runtime objects. For Liquid generation, use Liquid paths: $.when(condition, $.var('path1'), $.var('path2'))"
            );
            return "[object Object]"; // This will cause Liquid errors - user needs to fix
          }
          // For primitives, we can use them directly
          return String(selectedRuntime);
        },
        () => () => selectedRuntime as T
      );
    }

    // If condition is an Expr (Liquid variable)
    const trueExpr = trueIsExpr
      ? (trueValue as Expr<T>)
      : $.lit(trueValue as T);
    const falseExpr = falseIsExpr
      ? (falseValue as Expr<T>)
      : $.lit(falseValue as T);

    return createExpr(
      () => {
        // Generate Liquid conditional expression
        // Liquid doesn't have ternary, but we can use: (condition and trueValue) or falseValue
        // But this only works for boolean values, not paths
        // For paths, we need to handle it differently
        if (trueIsExpr || falseIsExpr) {
          // At least one is an Expr - we need to generate proper Liquid conditional
          // This is complex, so for now we'll use a workaround
          return `(${condition.toLiquid()} ? ${trueExpr.toLiquid()} : ${falseExpr.toLiquid()})`;
        }
        return `(${condition.toLiquid()} ? ${trueExpr.toLiquid()} : ${falseExpr.toLiquid()})`;
      },
      () => (ctx) => {
        const cond = condition.toClient()(ctx);
        if (cond) {
          return trueIsExpr ? trueExpr.toClient()(ctx) : (trueRuntime as T);
        } else {
          return falseIsExpr ? falseExpr.toClient()(ctx) : (falseRuntime as T);
        }
      }
    );
  },

  /**
   * Accesses a nested property on an expression
   *
   * @template T - The type of the parent expression
   * @template K - The property key
   * @param expr - The parent expression
   * @param property - The property name to access
   * @returns An Expr representing the nested property
   *
   * @example
   * ```tsx
   * const settings = $.var("designSettings.desktopSettings");
   * const layoutType = $.prop(settings, "desktopLayoutType");
   * // Equivalent to: $.var("designSettings.desktopSettings.desktopLayoutType")
   * ```
   */
  prop<T, K extends keyof T>(expr: Expr<T>, property: string): Expr<T[K]> {
    return createExpr(
      () => {
        const base = expr.toLiquid();
        // If base is already a path, append property
        if (!base.includes(" ") && !base.includes("(")) {
          return `${base}.${property}`;
        }
        // Otherwise, we need to handle it differently
        // For complex expressions, we can't just append
        return `${base}.${property}`;
      },
      () => (ctx) => {
        const parent = expr.toClient()(ctx);
        if (parent && typeof parent === "object") {
          return (parent as Record<string, unknown>)[property] as T[K];
        }
        return undefined as T[K];
      }
    );
  },

  /**
   * Creates an equality comparison expression
   * Automatically handles nested property access if the first argument is an object Expr
   *
   * @template T - The type of values being compared
   * @param a - First expression to compare (can be object Expr with property access)
   * @param b - Second expression to compare
   * @returns An Expr that represents `a == b` in Liquid
   *
   * @example
   * ```tsx
   * $.eq($.var("product.type"), $.lit("shirt"))
   * // => product.type == 'shirt'
   *
   * const settings = $.var("designSettings.desktopSettings");
   * $.eq($.prop(settings, "desktopLayoutType"), $.lit("slider"))
   * // => designSettings.desktopSettings.desktopLayoutType == 'slider'
   * ```
   */
  eq<T>(a: Expr<T>, b: Expr<T>): Expr<boolean> {
    return createExpr(
      () => `${a.toLiquid()} == ${b.toLiquid()}`,
      () => (ctx) => a.toClient()(ctx) === b.toClient()(ctx)
    );
  },

  /**
   * Creates a contains expression for checking if an item is in a collection
   *
   * @template T - The type of items in the collection
   * @param collection - The collection expression
   * @param item - The item to search for
   * @returns An Expr that represents `collection contains item` in Liquid
   *
   * @example
   * ```tsx
   * $.contains($.var("product.tags"), $.lit("sale"))
   * // => product.tags contains "sale"
   *
   * <Conditional when={$.contains($.var("product.tags"), $.lit("featured"))}>
   *   <span class="badge">Featured</span>
   * </Conditional>
   * ```
   */
  contains<T>(collection: Expr<T[]>, item: Expr<T>): Expr<boolean> {
    return createExpr(
      () => `${collection.toLiquid()} contains ${item.toLiquid()}`,
      () => (ctx) =>
        (collection.toClient()(ctx) ?? []).includes(item.toClient()(ctx))
    );
  },
};
