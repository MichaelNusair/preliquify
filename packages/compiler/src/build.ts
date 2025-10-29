import fg from "fast-glob";
import { promises as fs } from "node:fs";
import { join, dirname, basename } from "node:path";
import { pathToFileURL } from "node:url";
import { build as esbuild } from "esbuild";
import { renderComponentToLiquid } from "./renderToLiquid.js";
import { needsClientRuntime } from "./detectIslands.js";
import type { BuildOptions } from "./types.js";

export async function build(opts: BuildOptions) {
  const { srcDir, outLiquidDir, outClientDir, watch } = opts;

  const entries = await fg("**/*.tsx", { cwd: srcDir, absolute: true });
  await fs.mkdir(outLiquidDir, { recursive: true });
  await fs.mkdir(outClientDir, { recursive: true });

  let needsRuntime = false;

  for (const file of entries) {
    try {
      const code = await fs.readFile(file, "utf8");
      if (needsClientRuntime(code)) needsRuntime = true;

      // Bundle this TSX to ESM so Node can import it for SSR-to-Liquid
      const tmpOut = file + ".mjs";
      await esbuild({
        entryPoints: [file],
        bundle: true,
        format: "esm",
        platform: "node",
        outfile: tmpOut,
        jsx: "automatic",
        jsxImportSource: "preact",
        external: ["preact", "@preliquify/core", "@preliquify/preact"],
      });

      const mod = await import(pathToFileURL(tmpOut).href);
      const liquid = await renderComponentToLiquid(mod, file);

      const outPath = join(
        outLiquidDir,
        basename(file).replace(/\.tsx$/, ".liquid")
      );
      await fs.writeFile(outPath, liquid, "utf8");
      await fs.rm(tmpOut);
    } catch (error: any) {
      const errorMessage = error.message || String(error);
      throw new Error(`Error processing ${file}: ${errorMessage}`);
    }
  }

  // Ship a tiny client runtime if needed
  if (needsRuntime) {
    const runtimeJs = `
(function(){
  function parseProps(el){
    try { return JSON.parse(el.getAttribute('data-preliq-props')); }
    catch(_) { return {}; }
  }
  function mount(){
    var nodes = document.querySelectorAll('[data-preliq-island]');
    for (var i=0;i<nodes.length;i++){
      var el = nodes[i];
      var name = el.getAttribute('data-preliq-island');
      var id = el.getAttribute('data-preliq-id');
      // Convention: components are globally exposed under window.Preliquify[name]
      var Comp = (window as any).Preliquify?.[name];
      if (!Comp) continue;
      var props = parseProps(el) || {};
      // This assumes Preact is available globally (or bundle it).
      (window as any).preact?.render((window as any).preact.h(Comp, props), el);
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
  else mount();
})();
`;
    await fs.writeFile(
      join(outClientDir, "preliquify.runtime.js"),
      runtimeJs,
      "utf8"
    );
  }

  if (watch) {
    console.log(
      "[preliquify] watch mode not implemented in boilerplate — add chokidar here."
    );
  }
}
