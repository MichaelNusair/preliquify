import type { Expr } from "./types.js";

export type { Expr };

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
   * $.lit("hello")     // => "hello" in Liquid
   * $.lit(42)          // => 42 in Liquid
   * $.lit(true)        // => true in Liquid
   * $.lit(null)        // => null in Liquid
   * ```
   */
  lit<T>(v: T): Expr<T> {
    return {
      toLiquid: () => JSON.stringify(v),
      toClient: () => () => v,
    };
  },

  /**
   * Creates a variable expression from a Liquid variable path
   *
   * @template T - The expected type of the variable (defaults to unknown)
   * @param name - The Liquid variable path (e.g., "product.title", "customer.email")
   * @returns An Expr that represents the variable in Liquid and runtime
   *
   * @example
   * ```tsx
   * $.var("product.title")              // Access product title
   * $.var("customer.email")             // Access customer email
   * $.var("collections.frontpage")      // Access collection
   * $.var("settings.show_banner")       // Access theme setting
   * ```
   */
  var<T = unknown>(name: string): Expr<T> {
    return {
      toLiquid: () => name,
      toClient: () => (ctx: Record<string, unknown>) => {
        const segments = name.split(".");
        let cur: unknown = ctx;
        for (const s of segments) {
          cur = (cur as Record<string, unknown>)?.[s];
        }
        return cur as T;
      },
    };
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
    return {
      toLiquid: () => `(not ${a.toLiquid()})`,
      toClient: () => (ctx) => !a.toClient()(ctx),
    };
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
    return {
      toLiquid: () => `(${a.toLiquid()}) and (${b.toLiquid()})`,
      toClient: () => (ctx) => a.toClient()(ctx) && b.toClient()(ctx),
    };
  },

  /**
   * Creates a logical OR expression
   *
   * @param a - First boolean expression
   * @param b - Second boolean expression
   * @returns An Expr that represents `a or b` in Liquid
   *
   * @example
   * ```tsx
   * $.or($.var("customer.logged_in"), $.var("cart.item_count"))
   * // => customer.logged_in or cart.item_count
   * ```
   */
  or(a: Expr<boolean>, b: Expr<boolean>): Expr<boolean> {
    return {
      toLiquid: () => `(${a.toLiquid()}) or (${b.toLiquid()})`,
      toClient: () => (ctx) => a.toClient()(ctx) || b.toClient()(ctx),
    };
  },

  /**
   * Creates an equality comparison expression
   *
   * @template T - The type of values being compared
   * @param a - First expression to compare
   * @param b - Second expression to compare
   * @returns An Expr that represents `a == b` in Liquid
   *
   * @example
   * ```tsx
   * $.eq($.var("product.type"), $.lit("shirt"))
   * // => product.type == "shirt"
   *
   * <Conditional when={$.eq($.var("cart.item_count"), $.lit(0))}>
   *   <p>Your cart is empty</p>
   * </Conditional>
   * ```
   */
  eq<T>(a: Expr<T>, b: Expr<T>): Expr<boolean> {
    return {
      toLiquid: () => `${a.toLiquid()} == ${b.toLiquid()}`,
      toClient: () => (ctx) => a.toClient()(ctx) === b.toClient()(ctx),
    };
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
    return {
      toLiquid: () => `${collection.toLiquid()} contains ${item.toLiquid()}`,
      toClient: () => (ctx) =>
        (collection.toClient()(ctx) ?? []).includes(item.toClient()(ctx)),
    };
  },
};
