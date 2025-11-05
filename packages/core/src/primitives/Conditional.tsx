import { h, Fragment } from "preact";
import { useTarget } from "../runtime.js";
import type { ConditionalProps } from "../types.js";

/**
 * Conditional rendering primitive that compiles to Liquid `{% if %}` blocks
 *
 * This component enables conditional rendering that works both at build time
 * (generating Liquid syntax) and at runtime (client-side evaluation).
 *
 * @param props - The conditional props
 * @param props.when - Expression that evaluates to a boolean
 * @param props.children - Content to render if condition is true
 *
 * @example
 * ```tsx
 * import { Conditional, $ } from '@preliquify/preact';
 *
 * // Check if customer is logged in
 * <Conditional when={$.var("customer.email")}>
 *   <p>Welcome back, {{ customer.name }}</p>
 * </Conditional>
 *
 * // Check product availability
 * <Conditional when={$.var("product.available")}>
 *   <button>Add to Cart</button>
 * </Conditional>
 *
 * // Complex conditions
 * <Conditional when={$.and(
 *   $.var("customer.logged_in"),
 *   $.eq($.var("cart.item_count"), $.lit(0))
 * )}>
 *   <p>You're logged in but your cart is empty</p>
 * </Conditional>
 * ```
 *
 * @remarks
 * Compiles to:
 * ```liquid
 * {% if condition %}
 *   <!-- children -->
 * {% endif %}
 * ```
 */
export function Conditional(props: ConditionalProps) {
  const target = useTarget();
  if (target === "liquid") {
    return (
      <Fragment>
        {"{% if " + props.when.toLiquid() + " %}"}
        {props.children}
        {"{% endif %}"}
      </Fragment>
    );
  }
  return props.when.toClient()({}) ? props.children : null;
}
