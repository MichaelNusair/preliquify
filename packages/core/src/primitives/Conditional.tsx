import { h, Fragment } from "preact";
import { useTarget } from "../runtime.js";
import type { ConditionalProps } from "../types.js";

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
