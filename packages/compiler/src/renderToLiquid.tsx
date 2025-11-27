import { h } from "preact";
import renderToString from "preact-render-to-string";
import { TargetProvider } from "@preliquify/core";

import type { ComponentType } from "preact";

export async function renderComponentToLiquid(
  mod: Record<string, any>,
  filePath?: string
): Promise<string> {
  // Priority order: default export > Component named export > any other named export (function)
  let Comp: ComponentType<any> | null = null;

  // 1. Check for default export
  if (mod.default && typeof mod.default === "function") {
    Comp = mod.default;
  }
  // 2. Check for Component named export (backward compatibility)
  else if (mod.Component && typeof mod.Component === "function") {
    Comp = mod.Component;
  }
  // 3. Check for any other named export that's a function (component)
  else {
    for (const key of Object.keys(mod)) {
      // Skip special module properties
      if (key === "default" || key === "__esModule" || key.startsWith("__")) {
        continue;
      }
      const value = mod[key];
      // Check if it's a function (potential component)
      if (typeof value === "function") {
        Comp = value;
        break;
      }
    }
  }

  if (!Comp) {
    const fileName = filePath ? ` in ${filePath}` : "";
    const availableExports = Object.keys(mod)
      .filter((k) => !k.startsWith("__") && k !== "default")
      .join(", ");
    const exportsHint = availableExports
      ? ` Available exports: ${availableExports}`
      : "";
    throw new Error(
      `No component export found${fileName}. Export a default component, a named export called "Component", or any other named function/component.${exportsHint}`
    );
  }

  const html = renderToString(
    h(TargetProvider, { value: "liquid" }, h(Comp, {}))
  );
  // The resulting HTML contains raw Liquid tags as text nodes — perfect for snippet files.
  return html.trim() + "\n";
}
