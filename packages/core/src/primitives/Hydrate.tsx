import { useTarget } from "../runtime.js";
import { liquidJson } from "../liquid.js";
import type { HydrateProps } from "../types.js";

export function Hydrate({ id, component, props = {} }: HydrateProps) {
  const target = useTarget();
  if (target === "liquid") {
    return (
      <div
        data-preliq-island={component}
        data-preliq-id={id}
        data-preliq-props={liquidJson(props)}
      />
    );
  }
  return null;
}
