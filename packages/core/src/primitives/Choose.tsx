import { h, Fragment, type JSX } from "preact";
import { useTarget } from "../runtime.js";
import type { Expr } from "../expr.js";
import type { ChooseProps } from "../types.js";

/**
 * Choose component that compiles to Liquid {% case %} statements
 *
 * Provides multi-way branching based on a value expression.
 * Compiles to Liquid case/when/else/endcase syntax.
 *
 * @example
 * ```tsx
 * <Choose
 *   value={$.var("product.type")}
 *   cases={{
 *     shirt: <div>This is a shirt</div>,
 *     pants: <div>These are pants</div>,
 *   }}
 *   default={<div>Other type</div>}
 * />
 * ```
 *
 * Compiles to:
 * ```liquid
 * {% case product.type %}
 *   {% when "shirt" %}
 *     <div>This is a shirt</div>
 *   {% when "pants" %}
 *     <div>These are pants</div>
 *   {% else %}
 *     <div>Other type</div>
 * {% endcase %}
 * ```
 */
export function Choose<T = string | number>(props: ChooseProps<T>) {
  const target = useTarget();

  if (target === "liquid") {
    // Build Liquid case statement
    const caseValue = props.value.toLiquid();

    return (
      <Fragment>
        {`{% case ${caseValue} %}`}
        {Object.entries(props.cases).map(([key, children]) => {
          // Escape the key for Liquid (handle quotes)
          const escapedKey =
            typeof key === "string"
              ? `'${key.replace(/'/g, "''")}'`
              : String(key);
          return (
            <Fragment key={key}>
              {`{% when ${escapedKey} %}`}
              {children}
            </Fragment>
          );
        })}
        {props.default && (
          <>
            {"{% else %}"}
            {props.default}
          </>
        )}
        {"{% endcase %}"}
      </Fragment>
    );
  }

  // Runtime: evaluate and render matching case
  const value = props.value.toClient()({});
  const matchingCase = props.cases[String(value)];
  return matchingCase || props.default || null;
}

/**
 * When component for conditional rendering (used with Otherwise)
 *
 * @deprecated Consider using Choose component with cases prop for better Liquid compilation
 */
export function When(props: { is: Expr<boolean>; children: h.JSX.Element }) {
  const target = useTarget();
  if (target === "liquid") {
    return (
      <Fragment>
        {`{% if ${props.is.toLiquid()} %}`}
        {props.children}
        {"{% endif %}"}
      </Fragment>
    );
  }
  return props.is.toClient()({}) ? props.children : null;
}

/**
 * Otherwise component for default case (used with When)
 *
 * @deprecated Consider using Choose component with default prop for better Liquid compilation
 */
export function Otherwise(props: { children: h.JSX.Element }) {
  const target = useTarget();
  if (target === "liquid")
    return (
      <Fragment>
        {"{% else %}"}
        {props.children}
      </Fragment>
    );
  return props.children;
}
