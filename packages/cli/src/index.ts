#!/usr/bin/env node
import { build } from "@preliquify/compiler";
import { resolve, join, basename } from "node:path";
import { promises as fs } from "node:fs";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { pathToFileURL } from "node:url";
import { build as esbuild } from "esbuild";

const args = process.argv.slice(2);
const cmd = args[0] || "build";

// Parse flags and options
const flags: {
  verbose: boolean;
  watch: boolean;
  help: boolean;
  config?: string;
  srcDir?: string;
  outLiquidDir?: string;
  outClientDir?: string;
  jsxImportSource?: string;
} = {
  verbose: false,
  watch: false,
  help: false,
};

// Parse arguments
for (let i = 0; i < args.length; i++) {
  const arg = args[i];

  if (arg === "--help" || arg === "-h") {
    flags.help = true;
  } else if (arg === "--verbose" || arg === "-v") {
    flags.verbose = true;
  } else if (arg === "--watch" || arg === "-w") {
    flags.watch = true;
  } else if (arg === "--config" || arg === "-c") {
    flags.config = args[++i];
  } else if (arg === "--src-dir") {
    flags.srcDir = args[++i];
  } else if (arg === "--out-liquid-dir") {
    flags.outLiquidDir = args[++i];
  } else if (arg === "--out-client-dir") {
    flags.outClientDir = args[++i];
  } else if (arg === "--jsx-import-source") {
    flags.jsxImportSource = args[++i];
  }
}

function showHelp() {
  console.log(`
Usage: preliquify build [options]

Commands:
  build              Build your PreLiquify components (default)

Options:
  -h, --help                 Show this help message
  -w, --watch                Watch for changes and rebuild
  -v, --verbose              Show detailed error information
  -c, --config <path>        Path to config file (default: preliquify.config.ts/js/mjs)
  --src-dir <path>           Source directory (default: src/snippets)
  --out-liquid-dir <path>    Output directory for Liquid files (default: snippets)
  --out-client-dir <path>    Output directory for client assets (default: assets)
  --jsx-import-source <pkg>  JSX import source (default: preact)

Examples:
  preliquify build
  preliquify build --watch
  preliquify build --src-dir ./components --out-liquid-dir ./templates
  preliquify build --config ./my-config.ts

Configuration:
  You can configure PreLiquify in two ways:
  
  1. Create a config file (preliquify.config.ts/js/mjs):
     export default {
       srcDir: "src/snippets",
       outLiquidDir: "snippets",
       outClientDir: "assets",
       jsxImportSource: "preact",
     };
  
  2. Use command-line flags (takes precedence over config file):
     preliquify build --src-dir ./src --out-liquid-dir ./output
  
  Command-line flags override values from the config file.
`);
}

if (flags.help || (cmd !== "build" && cmd !== "")) {
  if (cmd !== "build" && cmd !== "" && !flags.help) {
    console.error(`\n❌ Unknown command: ${cmd}`);
  }
  showHelp();
  process.exit(flags.help ? 0 : 1);
}

async function loadConfig(customConfigPath?: string): Promise<any> {
  const cwd = process.cwd();
  const possibleConfigs = customConfigPath
    ? [resolve(cwd, customConfigPath)]
    : [
        resolve(cwd, "preliquify.config.ts"),
        resolve(cwd, "preliquify.config.js"),
        resolve(cwd, "preliquify.config.mjs"),
      ];

  // Create a temporary directory for config compilation
  const tmpDir = await mkdtemp(join(tmpdir(), "preliquify-config-"));

  try {
    for (const configPath of possibleConfigs) {
      try {
        await fs.access(configPath);
        // File exists, try to import it
        let importPath: string;

        if (configPath.endsWith(".ts")) {
          // Transpile TS to ESM using esbuild
          const tmpOut = join(tmpDir, basename(configPath) + ".mjs");
          await esbuild({
            entryPoints: [configPath],
            bundle: true,
            format: "esm",
            platform: "node",
            outfile: tmpOut,
            external: [],
          });
          importPath = pathToFileURL(tmpOut).href;
        } else {
          importPath = pathToFileURL(configPath).href;
        }

        const mod = await import(importPath);
        const cfg = mod.default || mod;

        return cfg;
      } catch (e: any) {
        // File doesn't exist or can't be imported, try next
        if (e.code !== "ENOENT") {
          // Log non-file-not-found errors for debugging
          if (flags.verbose) {
            console.warn(
              `[preliquify] Error loading config from ${configPath}:`,
              e.message
            );
          }
        }
        continue;
      }
    }

    return null;
  } finally {
    // Clean up temporary directory
    try {
      await fs.rm(tmpDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  }
}

const cfg = (await loadConfig(flags.config)) ?? {};

// Command-line flags override config file values
const buildOptions = {
  srcDir: flags.srcDir ?? cfg.srcDir ?? resolve("src/snippets"),
  outLiquidDir: flags.outLiquidDir ?? cfg.outLiquidDir ?? resolve("snippets"),
  outClientDir: flags.outClientDir ?? cfg.outClientDir ?? resolve("assets"),
  jsxImportSource: flags.jsxImportSource ?? cfg.jsxImportSource ?? "preact",
  watch: flags.watch || !!cfg.watch,
  verbose: flags.verbose || !!cfg.verbose,
};

console.log("\n🚀 Starting PreLiquify build...\n");
if (flags.verbose) {
  console.log("Configuration:");
  console.log(`  Source directory: ${buildOptions.srcDir}`);
  console.log(`  Liquid output: ${buildOptions.outLiquidDir}`);
  console.log(`  Client output: ${buildOptions.outClientDir}`);
  console.log(`  JSX import source: ${buildOptions.jsxImportSource}`);
  console.log(`  Watch mode: ${buildOptions.watch ? "enabled" : "disabled"}\n`);
}

try {
  await build(buildOptions);
} catch (error: any) {
  // Error formatting is handled by the build function
  if (flags.verbose && error.stack) {
    console.error("\nFull stack trace:", error.stack);
  }
  process.exit(1);
}
