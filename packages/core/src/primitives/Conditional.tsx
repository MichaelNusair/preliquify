import { h, Fragment } from "preact";
import { useTarget } from "../runtime.js";
import type { ConditionalProps } from "../types.js";

/**
 * Conditional rendering primitive that compiles to Liquid `{% if %}` blocks
 *
 * This component enables conditional rendering that works both at build time
 * (generating Liquid syntax) and at runtime (client-side evaluation).
 *
 * **Best Practices:**
 * - Use for simple true/false conditions or 1-2 branches
 * - For 3+ branches, use `<Choose>` component instead (more maintainable)
 * - Avoid negating OR expressions - use De Morgan's law or restructure
 *
 * @param props - The conditional props
 * @param props.when - Expression that evaluates to a boolean
 * @param props.children - Content to render if condition is true
 *
 * @example
 * ```tsx
 * import { Conditional, $ } from '@preliquify/preact';
 *
 * // Simple condition
 * <Conditional when={$.var("customer.email")}>
 *   <p>Welcome back, {{ customer.name }}</p>
 * </Conditional>
 *
 * // For 3+ branches, use Choose instead:
 * <Choose
 *   value={$.var("product.type")}
 *   cases={{
 *     shirt: <ShirtComponent />,
 *     pants: <PantsComponent />,
 *     shoes: <ShoesComponent />,
 *   }}
 *   default={<OtherComponent />}
 * />
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
    const liquidExpr = props.when.toLiquid();

    // Warn if this looks like it should use Choose instead (multiple OR conditions)
    // Count OR operators - if 2+ (meaning 3+ branches), suggest Choose
    const orCount = (liquidExpr.match(/\sor\s/g) || []).length;
    if (orCount >= 2) {
      console.warn(
        `[Preliquify] Consider using <Choose> component for ${orCount + 1} branches instead of multiple <Conditional> components. ` +
          `This is more maintainable and generates cleaner Liquid code.\n` +
          `Current expression: ${liquidExpr}`
      );
    }

    return (
      <Fragment>
        {`{% if ${liquidExpr} %}`}
        {props.children}
        {"{% endif %}"}
      </Fragment>
    );
  }

  return props.when.toClient()({}) ? props.children : null;
}
