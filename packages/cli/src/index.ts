#!/usr/bin/env node
import { build } from "@preliquify/compiler";
import { resolve, join, basename } from "node:path";
import { promises as fs } from "node:fs";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { pathToFileURL } from "node:url";
import { build as esbuild } from "esbuild";
import { setup } from "./setup.js";

const args = process.argv.slice(2);
const cmd = args[0] || "build";

const flags: {
  verbose: boolean;
  watch: boolean;
  help: boolean;
  force: boolean;
  noExamples: boolean;
  config?: string;
  srcDir?: string;
  outLiquidDir?: string;
  outClientDir?: string;
  jsxImportSource?: string;
} = {
  verbose: false,
  watch: false,
  help: false,
  force: false,
  noExamples: false,
};

for (let i = 0; i < args.length; i++) {
  const arg = args[i];

  if (arg === "--help" || arg === "-h") {
    flags.help = true;
  } else if (arg === "--verbose" || arg === "-v") {
    flags.verbose = true;
  } else if (arg === "--watch" || arg === "-w") {
    flags.watch = true;
  } else if (arg === "--force" || arg === "-f") {
    flags.force = true;
  } else if (arg === "--no-examples") {
    flags.noExamples = true;
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
Usage: preliquify <command> [options]

Commands:
  build              Build your Preliquify components (default)
  init               Initialize a Shopify theme for Preliquify
  help               Show this help message

Build Options:
  -h, --help                 Show this help message
  -w, --watch                Watch for changes and rebuild
  -v, --verbose              Show detailed error information
  -c, --config <path>        Path to config file (default: preliquify.config.ts/js/mjs)
  --src-dir <path>           Source directory (default: src/snippets)
  --out-liquid-dir <path>    Output directory for Liquid files (default: snippets)
  --out-client-dir <path>    Output directory for client assets (default: assets)
  --jsx-import-source <pkg>  JSX import source (default: preact)

Init Options:
  -f, --force                Overwrite existing files
  --no-examples              Skip creating example component
  -v, --verbose              Show detailed output

Examples:
  preliquify init                           # Set up a new project
  preliquify build                          # Build components
  preliquify build --watch                  # Build with watch mode
  preliquify build --src-dir ./components   # Custom source directory
  preliquify build --config ./my-config.ts  # Custom config file

Configuration:
  Create a config file (preliquify.config.ts/js/mjs):
  
    export default {
      entryPoint: "src/snippets",
      outLiquidDir: "snippets",
      outClientDir: "assets",
      tailwind: true,
      fragmentsDir: "src/schema-fragments", // Optional
    };
  
  Or use command-line flags (takes precedence over config file).

Documentation: https://github.com/MichaelNusair/preliquify
`);
}

// Handle init command
if (cmd === "init") {
  setup({
    force: flags.force,
    verbose: flags.verbose,
    skipExamples: flags.noExamples,
  }).catch((error) => {
    console.error("\n❌ Init failed:", error.message);
    process.exit(1);
  });
} else if (flags.help || cmd === "help") {
  showHelp();
  process.exit(0);
} else if (cmd !== "build" && cmd !== "") {
  console.error(`\n❌ Unknown command: ${cmd}`);
  showHelp();
  process.exit(1);
} else {
  // Continue with build command below
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

  const tmpDir = await mkdtemp(join(tmpdir(), "preliquify-config-"));

  try {
    for (const configPath of possibleConfigs) {
      try {
        await fs.access(configPath);
        let importPath: string;

        if (configPath.endsWith(".ts")) {
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
        if (e.code !== "ENOENT") {
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
    try {
      await fs.rm(tmpDir, { recursive: true, force: true });
    } catch {}
  }
}

// Only run build logic if we're doing a build command
if (cmd === "build" || cmd === "") {
  const cfg = (await loadConfig(flags.config)) ?? {};

  const buildOptions = {
    entryPoint:
      cfg.entryPoint || flags.srcDir || cfg.srcDir || resolve("src/snippets"),
    srcDir: flags.srcDir || cfg.srcDir, // Backwards compatibility
    outLiquidDir: flags.outLiquidDir ?? cfg.outLiquidDir ?? resolve("snippets"),
    outClientDir: flags.outClientDir ?? cfg.outClientDir ?? resolve("assets"),
    jsxImportSource: flags.jsxImportSource ?? cfg.jsxImportSource ?? "preact",
    watch: flags.watch || !!cfg.watch,
    verbose: flags.verbose || !!cfg.verbose,
    suffixDistFiles:
      cfg.suffixDistFiles !== undefined ? cfg.suffixDistFiles : true,
    generateClientBundles: cfg.generateClientBundles !== false, // Default true
    minify: cfg.minify !== false, // Default true
    tailwind: cfg.tailwind,
    // New: Schema fragments directory
    fragmentsDir: cfg.fragmentsDir,
    // New: Theme style extraction
    extractThemeStyles: cfg.extractThemeStyles,
  };

  console.log("\n🚀 Starting Preliquify build...\n");
  if (flags.verbose) {
    console.log("Configuration:");
    const entryPointDisplay = Array.isArray(buildOptions.entryPoint)
      ? buildOptions.entryPoint.join(", ")
      : buildOptions.entryPoint;
    console.log(`  Entry point: ${entryPointDisplay}`);
    console.log(`  Liquid output: ${buildOptions.outLiquidDir}`);
    console.log(`  Client output: ${buildOptions.outClientDir}`);
    console.log(`  JSX import source: ${buildOptions.jsxImportSource}`);
    console.log(`  Watch mode: ${buildOptions.watch ? "enabled" : "disabled"}`);
    console.log(
      `  Suffix dist files: ${buildOptions.suffixDistFiles ? "enabled" : "disabled"}`
    );
    if (buildOptions.fragmentsDir) {
      console.log(`  Fragments directory: ${buildOptions.fragmentsDir}`);
    }
    console.log("");
  }

  try {
    await build(buildOptions);
  } catch (error: any) {
    if (flags.verbose && error.stack) {
      console.error("\nFull stack trace:", error.stack);
    }
    process.exit(1);
  }
}
