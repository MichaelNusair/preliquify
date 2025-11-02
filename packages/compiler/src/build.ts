import fg from "fast-glob";
import { promises as fs } from "node:fs";
import { join, dirname, basename, resolve } from "node:path";
import { pathToFileURL, fileURLToPath } from "node:url";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { build as esbuild } from "esbuild";
import { renderComponentToLiquid } from "./renderToLiquid.js";
import { needsClientRuntime } from "./detectIslands.js";
import type { BuildOptions } from "./types.js";
import { createRequire } from "node:module";
import {
  CompilationError,
  FileSystemError,
  createErrorReporter,
} from "./errors.js";

function createBrowserPolyfills() {
  return `
    if (typeof globalThis.window === 'undefined') {
      globalThis.window = {
        location: { 
          href: '', 
          pathname: '', 
          reload: () => {},
          origin: '',
          search: '',
          hash: '',
        },
        innerWidth: 1024,
        innerHeight: 768,
        addEventListener: () => {},
        removeEventListener: () => {},
        getComputedStyle: (el) => ({ 
          display: el?.style?.display || 'block',
          visibility: el?.style?.visibility || 'visible',
        }),
        history: {
          pushState: () => {},
          replaceState: () => {},
          back: () => {},
          forward: () => {},
        },
      };
    }
    if (typeof globalThis.document === 'undefined') {
      const createMockElement = () => ({
        setAttribute: () => {},
        getAttribute: () => null,
        classList: { add: () => {}, remove: () => {}, contains: () => false },
        textContent: '',
        appendChild: () => {},
        remove: () => {},
        closest: () => null,
        querySelector: () => null,
        querySelectorAll: () => [],
      });
      globalThis.document = {
        querySelector: () => null,
        querySelectorAll: () => [],
        addEventListener: () => {},
        removeEventListener: () => {},
        createElement: createMockElement,
        createTextNode: () => ({ textContent: '' }),
        head: {
          appendChild: () => {},
          removeChild: () => {},
        },
        body: {
          appendChild: () => {},
          removeChild: () => {},
        },
        readyState: 'complete',
      };
    }
  `;
}

export async function build(opts: BuildOptions) {
  const { srcDir, outLiquidDir, outClientDir, watch, verbose = false } = opts;
  const errorReporter = createErrorReporter(verbose);

  let entries: string[];
  try {
    entries = await fg("**/*.tsx", { cwd: srcDir, absolute: true });
  } catch (error: any) {
    throw new FileSystemError(
      `Failed to scan source directory: ${error.message}`,
      srcDir,
      error
    );
  }

  if (entries.length === 0) {
    console.warn(`⚠️  No .tsx files found in ${srcDir}`);
    return;
  }

  try {
    await fs.mkdir(outLiquidDir, { recursive: true });
    await fs.mkdir(outClientDir, { recursive: true });
  } catch (error: any) {
    throw new FileSystemError(
      `Failed to create output directories: ${error.message}`,
      outLiquidDir,
      error
    );
  }

  // Create a temporary directory for intermediate files
  const tmpDir = await mkdtemp(join(tmpdir(), "preliquify-"));

  try {
    let needsRuntime = false;

    for (const file of entries) {
      const tmpOut = join(tmpDir, basename(file) + ".mjs");

      try {
        const code = await fs.readFile(file, "utf8");
        if (needsClientRuntime(code)) needsRuntime = true;

        // Bundle this TSX to ESM so Node can import it for SSR-to-Liquid
        // Keep preact external so it uses the same instance as renderToLiquid
        // (needed for hooks to work correctly)

        await esbuild({
          entryPoints: [file],
          bundle: true,
          format: "esm",
          platform: "node",
          outfile: tmpOut,
          jsx: "automatic",
          jsxImportSource: "preact",
          external: ["preact", "preact/hooks", "preact-render-to-string"],
          banner: {
            js: createBrowserPolyfills(),
          },
        });

        // Create a require function from the compiler's context to resolve preact
        const compilerRequire = createRequire(import.meta.url);
        let preactPath: string | undefined;
        try {
          preactPath = compilerRequire.resolve("preact");
        } catch (e) {
          // Fallback: try to find preact in the project's node_modules
          const projectRoot = dirname(file);
          let current = projectRoot;
          while (current !== dirname(current)) {
            const nodeModules = join(current, "node_modules");
            try {
              await fs.access(nodeModules);
              const testPreact = join(nodeModules, "preact");
              await fs.access(testPreact);
              preactPath = testPreact;
              break;
            } catch {
              current = dirname(current);
            }
          }
        }

        if (!preactPath) {
          throw new Error(
            "Could not find preact package. Make sure preact is installed."
          );
        }

        // Create node_modules in temp directory with symlinks to preact
        // This allows Node to resolve preact when importing the bundled file
        const tmpNodeModules = join(tmpDir, "node_modules");
        await fs.mkdir(tmpNodeModules, { recursive: true });
        const tmpPreact = join(tmpNodeModules, "preact");

        try {
          // Create symlink to preact
          await fs.symlink(preactPath, tmpPreact, "dir");
        } catch (e: any) {
          // If symlink fails (e.g., Windows without admin rights),
          // Node should still resolve from parent directories
          // We'll rely on resolveDir in esbuild and Node's module resolution
        }

        // Create a safe import context with polyfills
        const polyfillCode = createBrowserPolyfills();
        const modUrl = pathToFileURL(tmpOut).href;

        // Evaluate polyfills before importing
        eval(polyfillCode);

        const mod = await import(modUrl);
        const liquid = await renderComponentToLiquid(mod, file);

        const outPath = join(
          outLiquidDir,
          basename(file).replace(/\.tsx$/, ".liquid")
        );
        await fs.writeFile(outPath, liquid, "utf8");
      } catch (error: any) {
        const compilationError = new CompilationError(
          error.message || String(error),
          file,
          error
        );
        errorReporter.report(compilationError);

        // Continue processing other files
        continue;
      }
    }

    // Ship enhanced client runtime if needed
    if (needsRuntime) {
      // Build the runtime
      const runtimePath = fileURLToPath(
        new URL("./runtime/client-runtime.ts", import.meta.url)
      );

      const runtimeOutPath = join(outClientDir, "preliquify.runtime.js");

      try {
        await esbuild({
          entryPoints: [runtimePath],
          bundle: true,
          format: "iife",
          platform: "browser",
          outfile: runtimeOutPath,
          minify: true,
          target: ["es2015"],
        });

        console.log(`✅ Generated client runtime: ${runtimeOutPath}`);
      } catch (error: any) {
        // Fallback to simple runtime if build fails
        console.warn("⚠️  Failed to build enhanced runtime, using fallback");

        const fallbackRuntime = `
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
      var Comp = (window.Preliquify||{})[name];
      if (!Comp) continue;
      var props = parseProps(el) || {};
      if (window.preact) {
        window.preact.render(window.preact.h(Comp, props), el);
      }
    }
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount);
  } else {
    mount();
  }
})();
`;
        await fs.writeFile(runtimeOutPath, fallbackRuntime, "utf8");
      }
    }

    if (watch) {
      console.log(
        "[preliquify] watch mode not implemented in boilerplate — add chokidar here."
      );
    }

    // Check if any errors occurred during compilation
    errorReporter.throwIfErrors();

    // Success message
    if (entries.length > 0 && !errorReporter.hasErrors()) {
      console.log(`✅ Successfully compiled ${entries.length} component(s)`);
    }
  } finally {
    // Clean up temporary directory
    try {
      await fs.rm(tmpDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  }
}
