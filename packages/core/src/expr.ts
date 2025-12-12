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
    // Add .value getter for runtime access
    // This allows accessing the actual value at runtime: expr.value
    get value() {
      // At runtime, evaluate with empty context (will be populated by actual props)
      // This is a convenience getter - actual evaluation happens in components
      return toClient()({});
    },
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
   * Creates an Expr from a runtime value with its Liquid path.
   * This is essential when passing props to child components that need to use Liquid expressions.
   *
   * **Problem it solves:**
   * When you pass `props.storeMetafield.designSettings` to a child component as `designSettings`,
   * the child can't use `$.var('designSettings.mobileSettings')` because `designSettings` isn't
   * a Liquid variable - the actual Liquid path is `storeMetafield.designSettings`.
   *
   * **Solution:**
   * Use `$.from()` to wrap the prop with its Liquid path, then use `$.prop()` to access nested properties.
   *
   * @template T - The type of the value
   * @param liquidPath - The Liquid variable path (e.g., "storeMetafield.designSettings")
   * @param runtimeValue - The runtime JavaScript value
   * @returns An Expr that uses the Liquid path at build time and runtime value at runtime
   *
   * @example
   * ```tsx
   * // In parent component (createLiquidSnippet root):
   * <MediaGallery
   *   designSettings={$.from("storeMetafield.designSettings", props.storeMetafield.designSettings)}
   *   // ...
   * />
   *
   * // In child component types:
   * interface MediaGalleryProps {
   *   designSettings: PropWithExpr<DesignSettings>;  // Can be DesignSettings or Expr<DesignSettings>
   * }
   *
   * // In child component:
   * const MediaGallery = ({ designSettings, ... }) => {
   *   const settings = $.asExpr(designSettings);  // Convert to Expr if needed
   *   const mobileSettings = $.prop(settings, "mobileSettings");
   *   const layoutType = $.prop(mobileSettings, "layoutType");
   *   // Liquid: storeMetafield.designSettings.mobileSettings.layoutType
   *   // Runtime: designSettings.mobileSettings.layoutType (from .value)
   * };
   * ```
   */
  from<T>(liquidPath: string, runtimeValue: T): Expr<T> {
    return createExpr(
      () => liquidPath,
      () => () => runtimeValue
    );
  },

  /**
   * Converts a value to an Expr if it isn't already.
   * Helper for components that accept PropWithExpr<T> types.
   *
   * @template T - The type of the value
   * @param value - Either a raw value or an Expr
   * @param fallbackPath - Optional Liquid path to use if value is not an Expr (defaults to empty string)
   * @returns An Expr
   *
   * @example
   * ```tsx
   * interface Props {
   *   designSettings: PropWithExpr<DesignSettings>;
   * }
   *
   * const MediaGallery = ({ designSettings }: Props) => {
   *   // Convert to Expr (uses empty path if not already an Expr)
   *   const settings = $.asExpr(designSettings);
   *   const layoutType = $.prop(settings, "desktopLayoutType");
   * };
   * ```
   */
  asExpr<T>(value: T | Expr<T>, fallbackPath: string = ""): Expr<T> {
    // If already an Expr, return it
    if (typeof value === "object" && value !== null && "toLiquid" in value) {
      return value as Expr<T>;
    }

    // Warn if creating Expr with empty path - this will cause errors when using $.prop()
    if (!fallbackPath) {
      const errorMsg =
        `[Preliquify] $.asExpr() was called with a raw value but no fallback path. ` +
        `This will create an Expr with an empty Liquid path, which will cause errors when accessing properties. ` +
        `\n\nSolution: Pass the prop as an Expr from the parent component using $.from():\n` +
        `  // In parent component:\n` +
        `  <MediaGallery\n` +
        `    designSettings={$.from("storeMetafield.designSettings", props.storeMetafield.designSettings)}\n` +
        `    // ...\n` +
        `  />\n\n` +
        `  // Or provide a fallback path:\n` +
        `  const settings = $.asExpr(designSettings, "storeMetafield.designSettings");`;

      if (
        typeof process !== "undefined" &&
        process.env.NODE_ENV !== "production"
      ) {
        console.warn(errorMsg);
      }
    }

    // Otherwise, wrap it with $.from()
    return $.from(fallbackPath, value as T);
  },

  /**
   * Creates a logical NOT expression
   *
   * **⚠️ Important:** Cannot negate OR expressions in Liquid.
   * Liquid parses `not A or B` as `(not A) or B`, not `not (A or B)`.
   *
   * **For multiple branches (3+), use `<Choose>` component instead.**
   *
   * @param a - The boolean expression to negate
   * @returns An Expr that represents `not a` in Liquid
   *
   * @example
   * ```tsx
   * // Simple negation
   * $.not($.var("customer.logged_in"))  // => not customer.logged_in
   * <Conditional when={$.not($.var("settings.show_header"))}>
   *   <p>Header is hidden</p>
   * </Conditional>
   *
   * // ❌ Don't do this - will throw error:
   * $.not($.or($.eq($.var("type"), $.lit("a")), $.eq($.var("type"), $.lit("b"))))
   *
   * // ✅ Use Choose for 3+ branches:
   * <Choose
   *   value={$.var("type")}
   *   cases={{ a: <ComponentA />, b: <ComponentB /> }}
   *   default={<ComponentC />}
   * />
   * ```
   */
  not(a: Expr<boolean>): Expr<boolean> {
    // Liquid doesn't support parentheses around 'not'
    // ERROR: Negating OR expressions doesn't work in Liquid
    // Liquid parses "not A or B" as "(not A) or B", not "not (A or B)"
    const liquidStr = a.toLiquid();

    // Check if this is an OR expression (contains " or ")
    // Throw an error to prevent misuse - user must use De Morgan's law or Choose component
    if (liquidStr.includes(" or ")) {
      const errorMsg =
        "[Preliquify] Cannot negate an OR expression. Liquid will parse 'not A or B' as '(not A) or B', not 'not (A or B)'. " +
        "\n\nSolutions:\n" +
        "1. Use De Morgan's law: not (A or B) = (not A) and (not B)\n" +
        "2. Use Choose component for 3+ branches (recommended)\n" +
        "3. Restructure to check for the specific conditions you want\n\n" +
        `Expression: not ${liquidStr}`;

      if (
        typeof process !== "undefined" &&
        process.env.NODE_ENV !== "production"
      ) {
        throw new Error(errorMsg);
      } else {
        console.error(errorMsg);
      }
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
   * **💡 Tip:** For 3+ branches checking the same value, consider using `<Choose>` component instead.
   * It's more maintainable and generates cleaner Liquid code.
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
   * // Three or more conditions (works, but Choose is better)
   * $.or(
   *   $.eq($.var("product.type"), $.lit("shirt")),
   *   $.eq($.var("product.type"), $.lit("pants")),
   *   $.eq($.var("product.type"), $.lit("shoes"))
   * )
   * // => product.type == 'shirt' or product.type == 'pants' or product.type == 'shoes'
   *
   * // ✅ Better: Use Choose for 3+ branches
   * <Choose
   *   value={$.var("product.type")}
   *   cases={{
   *     shirt: <ShirtComponent />,
   *     pants: <PantsComponent />,
   *     shoes: <ShoesComponent />,
   *   }}
   * />
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
  prop<T, K extends keyof T>(expr: Expr<T>, property: K): Expr<T[K]> {
    return createExpr(
      () => {
        const base = expr.toLiquid();

        // Validate base path - must not be empty or start with a dot
        if (!base || base.startsWith(".")) {
          const errorMsg =
            `[Preliquify] Cannot access property "${String(property)}" on invalid Liquid path: "${base}". ` +
            `The base path is empty or starts with a dot, which is invalid in Liquid. ` +
            `\n\nSolution: Use $.from() to provide a valid Liquid path when creating the Expr:\n` +
            `  const settings = $.from("storeMetafield.designSettings", designSettings);\n` +
            `  const layoutType = $.prop(settings, "desktopLayoutType");`;

          if (
            typeof process !== "undefined" &&
            process.env.NODE_ENV !== "production"
          ) {
            throw new Error(errorMsg);
          }
          // In production, return a safe fallback
          return property;
        }

        // If base is already a path (no spaces, no parentheses), append property
        if (!base.includes(" ") && !base.includes("(")) {
          return `${base}.${String(property)}`;
        }

        // For complex expressions (conditionals, comparisons, etc.), we can't append
        // This is a limitation - you can't do "if condition then path1 else path2".property
        // The user needs to restructure their logic
        const errorMsg =
          `[Preliquify] Cannot access property "${String(property)}" on complex expression: "${base}". ` +
          `Liquid doesn't support property access on conditional expressions. ` +
          `\n\nSolution: Access the property before the conditional:\n` +
          `  // Instead of: $.prop($.when(condition, path1, path2), "property")\n` +
          `  // Do: $.when(condition, $.prop(path1, "property"), $.prop(path2, "property"))`;

        if (
          typeof process !== "undefined" &&
          process.env.NODE_ENV !== "production"
        ) {
          throw new Error(errorMsg);
        }
        // In production, return a safe fallback
        return String(property);
      },
      () => (ctx) => {
        const parent = expr.toClient()(ctx);
        if (parent && typeof parent === "object") {
          return (parent as Record<string, unknown>)[String(property)] as T[K];
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

  /**
   * Maps over an array expression with a transformation function
   * Generates Liquid code that performs the transformation at build time
   *
   * **Note:** The transformation function receives an item expression builder
   * that can be used to access properties. Use `item.var('property')` or
   * `item.prop('property')` to access properties of the current item.
   *
   * @template T - The type of items in the source array
   * @template R - The type of items in the result array
   * @param arrayExpr - Expression that evaluates to an array
   * @param transform - Transformation function that receives an item expression builder
   * @returns An Expr that represents the transformed array
   *
   * @example
   * ```tsx
   * import { $, $enhanced } from '@preliquify/preact';
   *
   * // Simple property extraction (uses Liquid's map filter)
   * const titles = $.map(productsExpr, (item) => item.var('title'));
   * // Generates: products | map: 'title'
   *
   * // Transform with string concatenation
   * const processedMedia = $.map(mediaExpr, (item) => ({
   *   src: $enhanced.append(item.var('src'), $.lit('?height=800')),
   *   alt: item.var('alt')
   * }));
   * ```
   *
   * @remarks
   * - For simple property extraction, this uses Liquid's `map` filter
   * - For object transformations, this generates Liquid loops that build JSON arrays
   * - Complex transformations may require using `<For>` component instead
   */
  map<T, R>(
    arrayExpr: Expr<T[]>,
    transform: (item: {
      var: (path: string) => Expr<unknown>;
      prop: <K extends keyof T>(prop: K) => Expr<T[K]>;
    }) => R | Expr<R>
  ): Expr<R[]> {
    // Generate a unique variable name for the loop item
    const itemVar = "_map_item";
    const resultVar = "_map_result";

    // Create item expression builder
    const itemBuilder = {
      var: (path: string) => $.var(`${itemVar}.${path}`),
      prop: <K extends keyof T>(prop: K) =>
        $.var(`${itemVar}.${String(prop)}`) as Expr<T[K]>,
    };

    // Call the transform function to get the transformation descriptor
    const transformResult = transform(itemBuilder);

    // Check if result is an Expr (simple transformation)
    const isExpr =
      typeof transformResult === "object" &&
      transformResult !== null &&
      "toLiquid" in transformResult;

    if (isExpr) {
      // Simple case: transform returns a single expression
      const resultExpr = transformResult as Expr<R>;
      const liquidResult = resultExpr.toLiquid();

      return createExpr(
        () => {
          // If it's a simple property access, use Liquid's map filter
          if (liquidResult.startsWith(`${itemVar}.`)) {
            const prop = liquidResult.substring(`${itemVar}.`.length);
            return `${arrayExpr.toLiquid()} | map: '${prop}'`;
          }

          // For other expressions, we'd need a loop - but this is complex
          // For now, return the source array and let runtime handle it
          // In a full implementation, this would generate a proper loop
          return arrayExpr.toLiquid();
        },
        () => (ctx) => {
          const arr = arrayExpr.toClient()(ctx) ?? [];
          return arr.map((item) => {
            const itemCtx = { ...ctx, [itemVar]: item };
            return resultExpr.toClient()(itemCtx) as R;
          });
        }
      );
    }

    // Complex case: transform returns an object with multiple properties
    // Build JSON array in Liquid
    const transformObj = transformResult as Record<string, Expr<unknown>>;
    const keys = Object.keys(transformObj);

    return createExpr(
      () => {
        const sourceArray = arrayExpr.toLiquid();

        // Build Liquid code that creates a JSON array of transformed objects
        // This follows the pattern from createLiquidSnippet for building JSON
        let liquidCode = `{% assign _q = 'a"b' | split: 'a' | last | split: 'b' | first %}`;
        liquidCode += `{% assign ${resultVar} = '[' %}`;
        liquidCode += `{% for ${itemVar} in ${sourceArray} %}`;
        liquidCode += `{% unless forloop.first %}{% assign ${resultVar} = ${resultVar} | append: ',' %}{% endunless %}`;
        liquidCode += `{% assign ${resultVar} = ${resultVar} | append: '{' %}`;

        // Build each property of the transformed object
        for (let i = 0; i < keys.length; i++) {
          const key = keys[i];
          const keyExpr = transformObj[key];
          const escapedKey = key.replace(/'/g, "''");

          if (i > 0) {
            liquidCode += `{% assign ${resultVar} = ${resultVar} | append: ',' %}`;
          }

          // Add key
          liquidCode += `{% assign ${resultVar} = ${resultVar} | append: _q | append: '${escapedKey}' | append: _q | append: ':' %}`;

          // Add value (need to handle different expression types)
          const keyLiquid = keyExpr.toLiquid();
          // For simple property access, use the item variable directly
          const adjustedLiquid = keyLiquid.replace(
            new RegExp(`${itemVar}\\.`, "g"),
            `${itemVar}.`
          );
          liquidCode += `{% assign _val = ${adjustedLiquid} | json | escape %}`;
          liquidCode += `{% assign ${resultVar} = ${resultVar} | append: _val %}`;
        }

        liquidCode += `{% assign ${resultVar} = ${resultVar} | append: '}' %}`;
        liquidCode += `{% endfor %}`;
        liquidCode += `{% assign ${resultVar} = ${resultVar} | append: ']' %}`;
        liquidCode += `${resultVar}`;

        return liquidCode;
      },
      () => (ctx) => {
        const arr = arrayExpr.toClient()(ctx) ?? [];
        return arr.map((item) => {
          const itemCtx = { ...ctx, [itemVar]: item };
          const result: Record<string, unknown> = {};
          for (const key of keys) {
            result[key] = transformObj[key].toClient()(itemCtx);
          }
          return result as R;
        });
      }
    );
  },

  /**
   * Filters an array expression based on a condition
   * Generates Liquid code that performs the filtering at build time
   *
   * @template T - The type of items in the array
   * @param arrayExpr - Expression that evaluates to an array
   * @param predicate - Filter function that receives an item expression builder and returns a boolean expression
   * @returns An Expr that represents the filtered array
   *
   * @example
   * ```tsx
   * // Filter media to only videos (uses Liquid's where filter)
   * const videos = $.filter(mediaExpr, (item) =>
   *   $.eq(item.var('type'), $.lit('video'))
   * );
   *
   * // Filter products by price (generates loop with conditional)
   * const expensiveProducts = $.filter(productsExpr, (item) =>
   *   $.gt(item.var('price'), $.lit(100))
   * );
   * ```
   *
   * @remarks
   * - For simple property equality checks, this uses Liquid's `where` filter
   * - For complex predicates, this generates Liquid loops with conditionals
   * - The filtered array is built using Liquid's array concatenation
   */
  filter<T>(
    arrayExpr: Expr<T[]>,
    predicate: (item: {
      var: (path: string) => Expr<unknown>;
      prop: <K extends keyof T>(prop: K) => Expr<T[K]>;
    }) => Expr<boolean>
  ): Expr<T[]> {
    const itemVar = "_filter_item";
    const resultVar = "_filter_result";

    // Create item expression builder
    const itemBuilder = {
      var: (path: string) => $.var(`${itemVar}.${path}`),
      prop: <K extends keyof T>(prop: K) =>
        $.var(`${itemVar}.${String(prop)}`) as Expr<T[K]>,
    };

    // Get the predicate expression
    const predicateExpr = predicate(itemBuilder);
    const predicateLiquid = predicateExpr.toLiquid();

    return createExpr(
      () => {
        const sourceArray = arrayExpr.toLiquid();

        // Check if predicate is a simple property equality that can use Liquid's where filter
        // Pattern: _filter_item.property == value
        const simpleEqMatch = predicateLiquid.match(
          /^_filter_item\.(\w+)\s*==\s*(.+)$/
        );

        if (simpleEqMatch) {
          // Use Liquid's where filter for simple equality
          const [, property, value] = simpleEqMatch;
          return `${sourceArray} | where: '${property}', ${value}`;
        }

        // For other predicates, generate a loop with conditional
        // Build array by concatenating matching items
        let liquidCode = `{% assign ${resultVar} = '' | split: '' %}`;
        liquidCode += `{% for ${itemVar} in ${sourceArray} %}`;
        // Replace item variable references in predicate with actual loop variable
        const adjustedPredicate = predicateLiquid.replace(
          new RegExp(`_filter_item`, "g"),
          itemVar
        );
        liquidCode += `{% if ${adjustedPredicate} %}`;
        // Concatenate the item to the result array
        // Note: Liquid's concat works with arrays, so we need to convert item to array first
        liquidCode += `{% assign _temp_arr = ${itemVar} | json | split: '' | first | split: '' %}`;
        liquidCode += `{% assign ${resultVar} = ${resultVar} | concat: _temp_arr %}`;
        liquidCode += `{% endif %}`;
        liquidCode += `{% endfor %}`;
        liquidCode += `${resultVar}`;
        return liquidCode;
      },
      () => (ctx) => {
        const arr = arrayExpr.toClient()(ctx) ?? [];
        return arr.filter((item) => {
          const itemCtx = { ...ctx, [itemVar]: item };
          return predicateExpr.toClient()(itemCtx);
        });
      }
    );
  },
};
