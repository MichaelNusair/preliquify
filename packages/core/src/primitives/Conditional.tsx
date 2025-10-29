import { h, Fragment } from "preact";
import { useTarget } from "../runtime.js";
import type { Expr } from "../expr.js";

export function Conditional(props: {
  when: Expr<boolean>;
  children: h.JSX.Element;
}) {
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
