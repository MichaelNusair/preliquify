import { h, Fragment } from "preact";
import { useTarget } from "../runtime.js";
import type { Expr } from "../expr.js";

export function For<T>(props: {
  each: Expr<T[]>;
  as: string;
  children: h.JSX.Element;
}) {
  const target = useTarget();
  if (target === "liquid") {
    const coll = props.each.toLiquid();
    return (
      <Fragment>
        {`{% for ${props.as} in ${coll} %}`}
        {props.children}
        {`{% endfor %}`}
      </Fragment>
    );
  }

  const list = props.each.toClient()({}) ?? [];
  return (
    <Fragment>{(list as any[]).map((_it, _i) => props.children)}</Fragment>
  );
}
