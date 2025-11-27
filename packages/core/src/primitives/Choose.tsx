import { h, Fragment } from "preact";
import { useTarget } from "../runtime.js";
import type { Expr } from "../expr.js";

export function When(props: { is: Expr<boolean>; children: h.JSX.Element }) {
  const target = useTarget();
  if (target === "liquid") {
    return (
      <Fragment>
        {"{% if " + props.is.toLiquid() + " %}"}
        {props.children}
        {"{% endif %}"}
      </Fragment>
    );
  }
  return props.is.toClient()({}) ? props.children : null;
}

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
