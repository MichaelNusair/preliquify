import { h } from "preact";
import renderToString from "preact-render-to-string";
import { TargetProvider } from "@preliquify/core";

import type { ComponentType } from "preact";

export async function renderComponentToLiquid(
  mod: { default?: ComponentType<any>; Component?: ComponentType<any> },
  filePath?: string
): Promise<string> {
  const Comp = mod.default || mod.Component || null;
  if (!Comp) {
    const fileName = filePath ? ` in ${filePath}` : "";
    throw new Error(`Export a default component${fileName}.`);
  }
  const html = renderToString(
    h(TargetProvider, { value: "liquid" }, h(Comp, {}))
  );
  // The resulting HTML contains raw Liquid tags as text nodes — perfect for snippet files.
  return html.trim() + "\n";
}
