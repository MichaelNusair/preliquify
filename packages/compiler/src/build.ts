import fg from "fast-glob";
import { promises as fs } from "node:fs";
import { join, dirname, basename, resolve, parse } from "node:path";
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
import chokidar from "chokidar";
import {
  EXTERNAL_PACKAGES,
  DEFAULT_CONCURRENCY,
  WATCH_DEBOUNCE_MS,
  BROWSER_API_ERRORS,
  LIQUID_EXPRESSION_ERRORS,
  ESBUILD_COMPONENT_CONFIG,
  ESBUILD_RUNTIME_CONFIG,
  FALLBACK_RUNTIME,
} from "./constants.js";

/**
 * Finds the project root by looking for node_modules directory
 * @param startPath - Starting directory path
 * @returns Project root path or null if not found
 */
async function findProjectRoot(startPath: string): Promise<string | null> {
  let current = resolve(startPath);
  const filesystemRoot = parse(current).root;

  while (current !== filesystemRoot) {
    const nodeModules = join(current, "node_modules");
    try {
      await fs.access(nodeModules);
      return current;
    } catch {
      const next = dirname(current);
      if (next === current) break;
      current = next;
    }
  }

  return null;
}

/**
 * Sets up temporary node_modules directory with symlinks to external packages
 * @param projectRoot - Project root directory
 * @param tmpDir - Temporary directory path
 * @param externalPackages - List of external package names to symlink
 */
async function setupTempNodeModules(
  projectRoot: string,
  tmpDir: string,
  externalPackages: string[]
): Promise<void> {
  const tmpNodeModules = join(tmpDir, "node_modules");
  await fs.mkdir(tmpNodeModules, { recursive: true });

  const projectRequire = createRequire(join(projectRoot, "package.json"));

  const basePackages = new Set<string>();
  for (const pkg of externalPackages) {
    basePackages.add(pkg.split("/")[0]);
  }

  for (const basePkg of basePackages) {
    try {
      const resolvedPath = projectRequire.resolve(basePkg);

      let current = dirname(resolvedPath);
      let actualPkgDir: string | null = null;

      while (current !== dirname(current)) {
        try {
          const pkgJsonPath = join(current, "package.json");
          await fs.access(pkgJsonPath);
          const pkgJsonContent = await fs.readFile(pkgJsonPath, "utf8");
          const pkgJson = JSON.parse(pkgJsonContent);

          if (pkgJson.name === basePkg) {
            actualPkgDir = current;
            break;
          }
        } catch {}

        if (
          basename(current) === basePkg &&
          basename(dirname(current)) === "node_modules"
        ) {
          actualPkgDir = current;
          break;
        }

        current = dirname(current);
      }

      if (!actualPkgDir) {
        actualPkgDir = dirname(resolvedPath);
      }

      await createSymlink(actualPkgDir, tmpNodeModules, basePkg);
    } catch (error) {
      // Silently continue if package symlink fails - non-critical
    }
  }
}

/**
 * Creates a symlink for a package in the temporary node_modules
 * Handles both Unix and Windows platforms
 */
async function createSymlink(
  packageDir: string,
  tmpNodeModules: string,
  packageName: string
): Promise<void> {
  const tmpPkgPath = join(tmpNodeModules, packageName);

  // Remove existing symlink if present
  try {
    const stat = await fs.lstat(tmpPkgPath);
    if (stat.isSymbolicLink()) {
      await fs.unlink(tmpPkgPath);
    }
  } catch {
    // Symlink doesn't exist, continue
  }

  const absolutePkgDir = resolve(packageDir);

  try {
    // Try standard directory symlink first
    await fs.symlink(absolutePkgDir, tmpPkgPath, "dir");
  } catch (error) {
    // On Windows, try junction if directory symlink fails
    if (process.platform === "win32") {
      try {
        await fs.symlink(absolutePkgDir, tmpPkgPath, "junction");
      } catch {
        throw error; // Re-throw if junction also fails
      }
    } else {
      throw error;
    }
  }
}

/**
 * Generates browser API polyfills for SSR environment
 * These polyfills allow components to be rendered at build time
 * without throwing errors for browser-only APIs
 */
function createBrowserPolyfills(): string {
  return `
    if (typeof globalThis.__PRELIQUIFY_SSR__ === 'undefined') {
      globalThis.__PRELIQUIFY_SSR__ = typeof window === 'undefined';
    }
    
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
        IntersectionObserver: typeof globalThis.IntersectionObserver !== 'undefined' 
          ? globalThis.IntersectionObserver 
          : function() {
              return {
                observe: () => {},
                unobserve: () => {},
                disconnect: () => {},
              };
            },
        requestIdleCallback: typeof globalThis.requestIdleCallback !== 'undefined'
          ? globalThis.requestIdleCallback
          : (cb) => setTimeout(cb, 0),
      };
    }
    
    if (typeof globalThis.localStorage === 'undefined') {
      const storage = new Map();
      globalThis.localStorage = {
        getItem: (key) => storage.get(String(key)) || null,
        setItem: (key, value) => storage.set(String(key), String(value)),
        removeItem: (key) => storage.delete(String(key)),
        clear: () => storage.clear(),
        get length() { return storage.size; },
        key: (index) => {
          const keys = Array.from(storage.keys());
          return keys[index] || null;
        },
      };
    }
    
    if (typeof globalThis.HTMLElement === 'undefined') {
      globalThis.HTMLElement = class HTMLElement {
        constructor() {}
        setAttribute() {}
        getAttribute() { return null; }
        hasAttribute() { return false; }
        classList = { add: () => {}, remove: () => {}, contains: () => false, toggle: () => false };
        textContent = '';
        appendChild() { return null; }
        remove() {}
        closest() { return null; }
        querySelector() { return null; }
        querySelectorAll() { return []; }
        getBoundingClientRect() { 
          return { top: 0, left: 0, bottom: 0, right: 0, width: 0, height: 0 };
        }
        dispatchEvent() { return true; }
      };
    }
    
    if (typeof globalThis.Element === 'undefined') {
      globalThis.Element = globalThis.HTMLElement;
    }
    
    if (typeof globalThis.document === 'undefined') {
      const createMockElement = () => {
        const el = Object.create(globalThis.HTMLElement.prototype);
        Object.assign(el, {
          setAttribute: () => {},
          getAttribute: () => null,
          hasAttribute: () => false,
          classList: { add: () => {}, remove: () => {}, contains: () => false, toggle: () => false },
          textContent: '',
          appendChild: () => null,
          remove: () => {},
          closest: () => null,
          querySelector: () => null,
          querySelectorAll: () => [],
          getBoundingClientRect: () => ({ top: 0, left: 0, bottom: 0, right: 0, width: 0, height: 0 }),
          dispatchEvent: () => true,
        });
        return el;
      };
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

/**
 * Applies -prlq suffix to filenames before extension
 * @param filename - Original filename
 * @param suffixDistFiles - Whether to apply suffix
 * @returns Filename with suffix applied if enabled
 * @example applySuffixIfNeeded("ProductCard.liquid", true) => "ProductCard-prlq.liquid"
 */
function applySuffixIfNeeded(
  filename: string,
  suffixDistFiles: boolean
): string {
  if (!suffixDistFiles) {
    return filename;
  }

  const firstDotIndex = filename.indexOf(".");
  if (firstDotIndex === -1) {
    return `${filename}-prlq`;
  }

  const nameWithoutExt = filename.slice(0, firstDotIndex);
  const ext = filename.slice(firstDotIndex);
  return `${nameWithoutExt}-prlq${ext}`;
}

export async function build(opts: BuildOptions) {
  const {
    srcDir,
    outLiquidDir,
    outClientDir,
    watch,
    verbose = false,
    suffixDistFiles = true,
  } = opts;
  const errorReporter = createErrorReporter(verbose);

  let entries: string[];
  try {
    entries = await fg("**/*.tsx", {
      cwd: srcDir,
      absolute: true,
      ignore: [],
    });
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

  const tmpDir = await mkdtemp(join(tmpdir(), "preliquify-"));

  const projectRoot = await findProjectRoot(srcDir);
  if (!projectRoot) {
    throw new FileSystemError(
      "Could not find project root (node_modules directory). Make sure you're running PreLiquify from a project with node_modules.",
      srcDir
    );
  }

  await setupTempNodeModules(projectRoot, tmpDir, [...EXTERNAL_PACKAGES]);

  const originalNodePath = process.env.NODE_PATH;
  const projectNodeModules = join(projectRoot, "node_modules");
  const extendedNodePath = originalNodePath
    ? `${projectNodeModules}${process.platform === "win32" ? ";" : ":"}${originalNodePath}`
    : projectNodeModules;
  process.env.NODE_PATH = extendedNodePath;

  try {
    let needsRuntime = false;
    const concurrency = DEFAULT_CONCURRENCY;

    const processBatch = async (batch: string[]) => {
      return Promise.all(
        batch.map(async (file) => {
          const tmpOut = join(tmpDir, basename(file) + ".mjs");

          try {
            const code = await fs.readFile(file, "utf8");
            if (needsClientRuntime(code)) needsRuntime = true;

            await esbuild({
              entryPoints: [file],
              bundle: true,
              outfile: tmpOut,
              external: [...EXTERNAL_PACKAGES],
              banner: {
                js: createBrowserPolyfills(),
              },
              ...ESBUILD_COMPONENT_CONFIG,
            });

            const polyfillCode = createBrowserPolyfills();
            const modUrl = pathToFileURL(tmpOut).href;

            eval(polyfillCode);

            const mod = await import(modUrl);
            const liquid = await renderComponentToLiquid(mod, file);

            const trimmedLiquid = liquid.trim();
            if (trimmedLiquid) {
              const liquidFilename = basename(file).replace(
                /\.tsx$/,
                ".liquid"
              );
              const finalFilename = applySuffixIfNeeded(
                liquidFilename,
                suffixDistFiles
              );
              const outPath = join(outLiquidDir, finalFilename);
              await fs.writeFile(outPath, liquid, "utf8");
            }
          } catch (error: any) {
            const errorMessage = error?.message || String(error);
            const isMissingComponentError = errorMessage.includes(
              "No component export found"
            );

            const isBrowserAPIError = BROWSER_API_ERRORS.some((msg) =>
              errorMessage.includes(msg)
            );

            const liquidError = LIQUID_EXPRESSION_ERRORS.find(({ pattern }) =>
              pattern.test(errorMessage)
            );

            if (!isMissingComponentError) {
              if (liquidError) {
                const enhancedError = new CompilationError(
                  `${errorMessage}\n\n💡 Fix: ${liquidError.fix}\n\n   At build time, props are Liquid expression strings (e.g., "{{ media | json }}").\n   You cannot use JavaScript array methods (.map(), .filter(), etc.) on them.\n\n   Solution: Use Preliquify primitives for Liquid data:\n   - Use <For each={$.var('media')} as="item"> for loops\n   - Use <Conditional when={$.var('condition')}> for conditionals\n   - Use useTarget() to detect build time vs runtime\n\n   Example:\n     import { For, $ } from '@preliquify/preact';\n     <For each={$.var('media')} as="item">\n       <div>{{ item.title }}</div>\n     </For>\n\n   See: https://github.com/your-repo/docs#liquid-primitives`,
                  file,
                  error,
                  {
                    hint: liquidError.fix,
                    type: "liquid_expression_error",
                  }
                );
                errorReporter.report(enhancedError);
              } else if (isBrowserAPIError && verbose) {
                console.warn(
                  `⚠️  Browser API warning in ${basename(file)}: ${errorMessage}\n   This may be handled by SSR polyfills.`
                );
              } else {
                const compilationError = new CompilationError(
                  errorMessage,
                  file,
                  error
                );
                errorReporter.report(compilationError);
              }
            }
          }
        })
      );
    };

    for (let i = 0; i < entries.length; i += concurrency) {
      const batch = entries.slice(i, i + concurrency);
      await processBatch(batch);
    }

    if (needsRuntime) {
      const runtimePath = fileURLToPath(
        new URL("../src/runtime/client-runtime.ts", import.meta.url)
      );

      const runtimeFilename = applySuffixIfNeeded(
        "preliquify.runtime.js",
        suffixDistFiles
      );
      const runtimeOutPath = join(outClientDir, runtimeFilename);

      try {
        await esbuild({
          entryPoints: [runtimePath],
          bundle: true,
          outfile: runtimeOutPath,
          ...ESBUILD_RUNTIME_CONFIG,
        });

        console.log(`✅ Generated client runtime: ${runtimeOutPath}`);
      } catch (error) {
        console.warn("⚠️  Failed to build enhanced runtime, using fallback");
        await fs.writeFile(runtimeOutPath, FALLBACK_RUNTIME, "utf8");
      }
    }

    if (watch) {
      await startWatchMode(opts, errorReporter);
    }

    errorReporter.throwIfErrors();

    if (entries.length > 0 && !errorReporter.hasErrors()) {
      console.log(`✅ Successfully compiled ${entries.length} component(s)`);
    }
  } finally {
    if (originalNodePath !== undefined) {
      process.env.NODE_PATH = originalNodePath || "";
    } else {
      delete process.env.NODE_PATH;
    }

    try {
      await fs.rm(tmpDir, { recursive: true, force: true });
    } catch {}
  }
}

async function startWatchMode(
  opts: BuildOptions,
  errorReporter: ReturnType<typeof createErrorReporter>
) {
  const { srcDir, outLiquidDir, verbose, suffixDistFiles = true } = opts;

  console.log("\n👀 Starting watch mode...");
  console.log(`   Watching: ${srcDir}`);
  console.log(`   Output: ${outLiquidDir}\n`);

  const watcher = chokidar.watch("**/*.tsx", {
    cwd: srcDir,
    ignored: /(^|[\/\\])\../, // ignore dotfiles
    persistent: true,
    ignoreInitial: true,
  });

  let buildTimeout: NodeJS.Timeout | null = null;
  const debouncedBuild = async (path: string, event: string) => {
    if (buildTimeout) clearTimeout(buildTimeout);

    buildTimeout = setTimeout(async () => {
      console.log(`\n⚡ ${event}: ${path}`);
      errorReporter.clear();

      try {
        await build({ ...opts, watch: false });
      } catch (error) {
        if (verbose) {
          console.error("\n❌ Build failed, waiting for changes...");
        }
      }
    }, WATCH_DEBOUNCE_MS);
  };

  watcher
    .on("add", (path) => debouncedBuild(path, "Added"))
    .on("change", (path) => debouncedBuild(path, "Changed"))
    .on("unlink", async (path) => {
      console.log(`\n🗑️  Removed: ${path}`);

      const liquidFilename = basename(path).replace(/\.tsx$/, ".liquid");
      const finalFilename = applySuffixIfNeeded(
        liquidFilename,
        suffixDistFiles
      );
      const liquidFile = join(outLiquidDir, finalFilename);

      try {
        await fs.unlink(liquidFile);
        console.log(`   Deleted: ${liquidFile}`);
      } catch (error) {}
    })
    .on("error", (error) => {
      console.error("\n❌ Watcher error:", error);
    })
    .on("ready", () => {
      console.log("✅ Ready for changes\n");
    });

  process.on("SIGINT", () => {
    console.log("\n\n👋 Stopping watch mode...");
    watcher.close();
    process.exit(0);
  });

  await new Promise(() => {});
}
