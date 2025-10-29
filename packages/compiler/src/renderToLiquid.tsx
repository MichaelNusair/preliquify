import { h } from 'preact';
import renderToString from 'preact-render-to-string';
import { TargetProvider } from '@preliquid/core';

export async function renderComponentToLiquid(mod: any): Promise<string> {
  const Comp = mod.default || mod.Component || null;
  if (!Comp) throw new Error("Export a default component.");
  const html = renderToString(
    h(TargetProvider, { value: 'liquid' }, h(Comp, {}))
  );
  // The resulting HTML contains raw Liquid tags as text nodes — perfect for snippet files.
  return html.trim() + "\n";
}

