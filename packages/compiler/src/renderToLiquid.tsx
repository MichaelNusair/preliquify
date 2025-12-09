import renderToString from "preact-render-to-string";
import { TargetProvider } from "@preliquify/core";

import { h, type ComponentType } from "preact";

export async function renderComponentToLiquid(
  mod: Record<string, any>,
  filePath?: string
): Promise<string> {
  let Comp: ComponentType<any> | null = null;

  if (mod.default && typeof mod.default === "function") {
    Comp = mod.default;
  } else if (mod.Component && typeof mod.Component === "function") {
    Comp = mod.Component;
  } else {
    for (const key of Object.keys(mod)) {
      if (key === "default" || key === "__esModule" || key.startsWith("__")) {
        continue;
      }
      const value = mod[key];
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
  return `${html.trim()}\n`;
}
