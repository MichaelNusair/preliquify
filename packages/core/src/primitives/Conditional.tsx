import { h, Fragment } from 'preact';
import { useTarget } from '../runtime';
import type { Expr } from '../expr';

export function Conditional(props: { when: Expr<boolean>; children: h.JSX.Element }) {
  const target = useTarget();
  if (target === 'liquid') {
    return (
      <Fragment>
        {'{% if ' + props.when.toLiquid() + ' %}'}
        {props.children}
        {'{% endif %}'}
      </Fragment>
    );
  }
  return props.when.toClient()({}) ? props.children : null;
}

