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
 * Detects if a file uses createLiquidSnippet by scanning its content
 * @param filePath - Path to the file to check
 * @returns True if the file contains createLiquidSnippet
 */
async function usesCreateLiquidSnippet(filePath: string): Promise<boolean> {
  try {
    const content = await fs.readFile(filePath, "utf8");

    // Check for import of createLiquidSnippet
    const hasImport =
      /import\s+.*createLiquidSnippet.*from\s+['"]@preliquify\/(preact|core)['"]/g.test(
        content
      );

    // Check for usage (export default createLiquidSnippet or const X = createLiquidSnippet)
    const hasUsage = /createLiquidSnippet\s*\(/g.test(content);

    return hasImport && hasUsage;
  } catch {
    return false;
  }
}

/**
 * Scans entry points and finds all files that use createLiquidSnippet
 * @param entryPoints - Array of file paths, directories, or glob patterns
 * @param verbose - Whether to log detailed information
 * @returns Array of absolute file paths that should be compiled
 */
async function scanForLiquidSnippets(
  entryPoints: string[],
  verbose: boolean
): Promise<string[]> {
  const allFiles = new Set<string>();

  // Resolve all entry points to actual files
  for (const entry of entryPoints) {
    try {
      const stats = await fs.stat(entry);

      if (stats.isDirectory()) {
        // Scan directory for .tsx files
        const files = await fg("**/*.tsx", {
          cwd: entry,
          absolute: true,
          ignore: ["**/node_modules/**", "**/.git/**"],
        });
        files.forEach((f) => allFiles.add(f));
      } else if (stats.isFile() && entry.endsWith(".tsx")) {
        // Single file
        allFiles.add(resolve(entry));
      }
    } catch (_error) {
      // Might be a glob pattern - try resolving as glob
      const files = await fg(entry, {
        absolute: true,
        ignore: ["**/node_modules/**", "**/.git/**"],
      });
      files.forEach((f) => allFiles.add(f));
    }
  }

  // Filter to only files using createLiquidSnippet
  const snippetFiles: string[] = [];
  const libraryFiles: string[] = [];

  for (const file of allFiles) {
    if (await usesCreateLiquidSnippet(file)) {
      snippetFiles.push(file);
    } else {
      libraryFiles.push(file);
    }
  }

  if (verbose) {
    console.log(`\n📊 Scan Results:`);
    console.log(`   Total files found: ${allFiles.size}`);
    console.log(`   Snippet files (will compile): ${snippetFiles.length}`);
    console.log(`   Library files (bundle only): ${libraryFiles.length}`);

    if (snippetFiles.length > 0) {
      console.log(`\n✨ Compiling snippets:`);
      snippetFiles.forEach((f) => console.log(`   - ${basename(f)}`));
    }

    if (libraryFiles.length > 0 && libraryFiles.length < 20) {
      console.log(`\n📦 Library components (not compiled separately):`);
      libraryFiles.forEach((f) => console.log(`   - ${basename(f)}`));
    }
    console.log();
  }

  return snippetFiles;
}

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
 * @param verbose - Whether to log verbose output
 */
async function setupTempNodeModules(
  projectRoot: string,
  tmpDir: string,
  externalPackages: string[],
  verbose = false
): Promise<void> {
  const tmpNodeModules = join(tmpDir, "node_modules");
  await fs.mkdir(tmpNodeModules, { recursive: true });

  const projectRequire = createRequire(join(projectRoot, "package.json"));

  // Handle each package separately (including scoped packages)
  for (const pkg of externalPackages) {
    try {
      let actualPkgDir: string | null = null;

      // Try multiple resolution strategies
      try {
        // Strategy 1: Use require.resolve for packages without strict exports
        const resolvedPath = projectRequire.resolve(pkg);
        let current = dirname(resolvedPath);

        // Walk up to find the package root directory
        while (current !== dirname(current)) {
          try {
            const pkgJsonPath = join(current, "package.json");
            await fs.access(pkgJsonPath);
            const pkgJsonContent = await fs.readFile(pkgJsonPath, "utf8");
            const pkgJson = JSON.parse(pkgJsonContent);

            if (pkgJson.name === pkg) {
              actualPkgDir = current;
              break;
            }
          } catch (_e) {
            // Continue walking up directory tree
          }

          current = dirname(current);
        }

        if (!actualPkgDir) {
          actualPkgDir = dirname(resolvedPath);
        }
      } catch (_error) {
        // Strategy 2: For preliquify packages in monorepo, use workspace packages
        if (pkg.startsWith("@preliquify/")) {
          const pkgName = pkg.replace("@preliquify/", "");
          const workspacePkgDir = join(projectRoot, "packages", pkgName);
          try {
            await fs.access(join(workspacePkgDir, "package.json"));
            actualPkgDir = workspacePkgDir;
          } catch (_e) {
            // Package not in workspace
          }
        }

        // Strategy 3: Look in node_modules directly
        if (!actualPkgDir) {
          const nodeModulesPkgDir = join(projectRoot, "node_modules", pkg);
          try {
            await fs.access(join(nodeModulesPkgDir, "package.json"));
            actualPkgDir = nodeModulesPkgDir;
          } catch (_e) {
            // Package not in node_modules
          }
        }
      }

      if (!actualPkgDir) {
        throw new Error(`Could not find package directory for ${pkg}`);
      }

      // For scoped packages, ensure the scope directory exists
      if (pkg.startsWith("@")) {
        const scope = pkg.split("/")[0];
        const scopeDir = join(tmpNodeModules, scope);
        await fs.mkdir(scopeDir, { recursive: true });
      }

      await createSymlink(actualPkgDir, tmpNodeModules, pkg);
      if (verbose) {
        console.log(`  ✓ Symlinked ${pkg} from ${actualPkgDir}`);
      }
    } catch (error) {
      // Log errors for preliquify packages as they're critical
      if (pkg.startsWith("@preliquify/")) {
        console.warn(`⚠️  Failed to symlink ${pkg}:`, error);
      }
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
    entryPoint: configEntryPoint,
    srcDir: deprecatedSrcDir,
    outLiquidDir,
    outClientDir,
    watch,
    verbose = false,
    suffixDistFiles = true,
  } = opts;
  const errorReporter = createErrorReporter(verbose);

  // Handle backwards compatibility and normalize entryPoint
  let entryPoint: string | string[];

  if (deprecatedSrcDir && !configEntryPoint) {
    console.warn(
      `⚠️  Warning: 'srcDir' is deprecated and will be removed in v2.0.0. Please use 'entryPoint' instead.\n` +
        `   Change your config from:\n` +
        `     srcDir: "${deprecatedSrcDir}"\n` +
        `   To:\n` +
        `     entryPoint: "${deprecatedSrcDir}"\n`
    );
    entryPoint = deprecatedSrcDir;
  } else if (configEntryPoint) {
    entryPoint = configEntryPoint;
  } else {
    throw new Error(
      'Build configuration error: Either "entryPoint" or "srcDir" must be specified.\n' +
        "Please add to your preliquify.config.ts:\n" +
        '  entryPoint: "./src/snippets"  // Directory to scan\n' +
        "Or:\n" +
        '  entryPoint: ["./src/File1.tsx", "./src/File2.tsx"]  // Specific files'
    );
  }

  // Normalize to array
  const entryPoints = Array.isArray(entryPoint) ? entryPoint : [entryPoint];

  // Scan for files using createLiquidSnippet
  console.log("🔍 Scanning for Liquid snippets...");
  let entries: string[];

  try {
    entries = await scanForLiquidSnippets(entryPoints, verbose);
  } catch (error: any) {
    throw new FileSystemError(
      `Failed to scan entry points: ${error.message}`,
      entryPoints.join(", "),
      error
    );
  }

  if (entries.length === 0) {
    const entryList = entryPoints.map((ep) => `   - ${ep}`).join("\n");
    console.warn(
      `\n⚠️  No files with 'createLiquidSnippet' found in entry points:\n${entryList}\n\n` +
        `💡 Tip: Only files that call createLiquidSnippet() are compiled to .liquid files.\n` +
        `   Other files are treated as library components and bundled into snippets.\n\n` +
        `   Example:\n` +
        `     export default createLiquidSnippet(MyComponent, { ... });`
    );
    return;
  }

  // Validate: Warn if config specifies files that don't use createLiquidSnippet
  if (Array.isArray(configEntryPoint)) {
    const configFiles = new Set(
      configEntryPoint
        .filter((ep) => ep.endsWith(".tsx"))
        .map((ep) => resolve(ep))
    );
    const actualFiles = new Set(entries);

    const missingSnippets = [...configFiles].filter((f) => !actualFiles.has(f));
    const unexpectedSnippets = [...actualFiles].filter(
      (f) => !configFiles.has(f)
    );

    if (missingSnippets.length > 0) {
      const missingList = missingSnippets
        .map((f) => `   - ${basename(f)}`)
        .join("\n");
      console.warn(
        `\n⚠️  Configuration Validation Warning:\n` +
          `   The following files are listed in entryPoint but don't use createLiquidSnippet:\n${missingList}\n` +
          `   These files will NOT be compiled to .liquid files.\n` +
          `   (Scan results override config - this is just a lint warning)`
      );
    }

    if (unexpectedSnippets.length > 0 && configFiles.size > 0) {
      const unexpectedList = unexpectedSnippets
        .map((f) => `   - ${basename(f)}`)
        .join("\n");
      console.warn(
        `\n⚠️  Configuration Validation Warning:\n` +
          `   Found files with createLiquidSnippet that aren't listed in entryPoint:\n${unexpectedList}\n` +
          `   These WILL be compiled (scan finds all snippets).\n` +
          `   Consider adding them to your config for better documentation.`
      );
    }
  }

  console.log(`\n✅ Found ${entries.length} snippet(s) to compile\n`);

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

  // Find project root from first entry point
  const firstEntryDir =
    entries.length > 0 ? dirname(entries[0]) : entryPoints[0];
  const projectRoot = await findProjectRoot(firstEntryDir);
  if (!projectRoot) {
    throw new FileSystemError(
      "Could not find project root (node_modules directory). Make sure you're running PreLiquify from a project with node_modules.",
      firstEntryDir
    );
  }

  await setupTempNodeModules(
    projectRoot,
    tmpDir,
    [...EXTERNAL_PACKAGES],
    verbose
  );

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
          const tmpOut = join(tmpDir, `${basename(file)}.mjs`);

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
      } catch (_error) {
        console.warn("⚠️  Failed to build enhanced runtime, using fallback");
        await fs.writeFile(runtimeOutPath, FALLBACK_RUNTIME, "utf8");
      }

      // Generate client bundles for each component with auto-registration
      const generateClientBundles = opts.generateClientBundles !== false; // Default true

      if (generateClientBundles) {
        console.log(`\n📦 Generating client component bundles...`);

        let bundleCount = 0;
        for (const file of entries) {
          try {
            const componentName = basename(file, ".tsx");
            const bundleFilename = applySuffixIfNeeded(
              `${componentName}.bundle.js`,
              suffixDistFiles
            );
            const bundleOutPath = join(outClientDir, bundleFilename);

            // Create a wrapper file with auto-registration
            const wrapperContent = `
import { default as Snippet } from '${file}';

// Extract the original component from the snippet wrapper
// createLiquidSnippet attaches the component to __preliquifyComponent
const Component = Snippet.__preliquifyComponent || Snippet;
const componentName = Snippet.__preliquifyComponentName || '${componentName}';

// Auto-registration with retry logic
(function() {
  let registered = false;
  
  function registerComponent() {
    if (registered) return;
    
    if (typeof window !== 'undefined' && window.__PRELIQUIFY__) {
      if (window.__PRELIQUIFY__.register) {
        window.__PRELIQUIFY__.register(componentName, Component);
        registered = true;
        if (${verbose}) {
          console.log('[__PRELIQUIFY__] Registered:', componentName);
        }
        return;
      }
    }
    
    // Runtime not loaded yet, retry
    setTimeout(registerComponent, 10);
  }
  
  // Start registration when script loads
  if (typeof window !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', registerComponent);
    } else {
      registerComponent();
    }
  }
})();
`;

            const wrapperPath = join(tmpDir, `${componentName}-wrapper.js`);
            await fs.writeFile(wrapperPath, wrapperContent, "utf8");

            // Bundle the component with auto-registration
            // Bundle all dependencies including @preliquify and preact
            // This creates self-contained bundles that work in browser
            await esbuild({
              entryPoints: [wrapperPath],
              bundle: true,
              outfile: bundleOutPath,
              format: "iife",
              target: "es2020",
              minify: opts.minify !== false,
              external: [], // Bundle everything for browser
              platform: "browser",
              jsx: "automatic",
              jsxImportSource: opts.jsxImportSource || "preact",
              globalName: `__PreliquifyBundle_${componentName}`,
            });

            bundleCount++;
            if (verbose) {
              console.log(`  ✓ ${bundleFilename}`);
            }
          } catch (error) {
            console.warn(`⚠️  Failed to bundle ${basename(file)}:`, error);
          }
        }

        if (bundleCount > 0) {
          console.log(`✅ Generated ${bundleCount} client bundle(s)`);
        }
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
    } catch (_error) {
      // Ignore cleanup errors
    }
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
    ignored: /(^|[/\\])\../, // ignore dotfiles
    persistent: true,
    ignoreInitial: true,
  });

  let buildTimeout: ReturnType<typeof setTimeout> | null = null;
  const debouncedBuild = async (path: string, event: string) => {
    if (buildTimeout) clearTimeout(buildTimeout);

    buildTimeout = setTimeout(async () => {
      console.log(`\n⚡ ${event}: ${path}`);
      errorReporter.clear();

      try {
        await build({ ...opts, watch: false });
      } catch (_error) {
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
      } catch (_error) {
        // File might not exist
      }
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
