import { h, Fragment } from "preact";
import { useTarget } from "../runtime.js";
import type { ForProps } from "../types.js";

export function For<T>(props: ForProps<T>) {
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
