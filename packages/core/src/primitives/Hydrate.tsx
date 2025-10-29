import { h } from 'preact';
import { useTarget } from '../runtime';
import { liquidJson } from '../liquid';

type HydrateProps = {
  id: string;                       // unique id for the island instance
  component: string;                // component name for client loader
  props?: Record<string, any>;
};

export function Hydrate({ id, component, props = {} }: HydrateProps) {
  const target = useTarget();
  if (target === 'liquid') {
    return (
      <div
        data-preliq-island={component}
        data-preliq-id={id}
        data-preliq-props={liquidJson(props)}
      />
    );
  }
  // client runtime mounts automatically; nothing to do here at render time
  return null;
}

