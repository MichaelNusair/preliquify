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
const flags = {
  verbose: args.includes("--verbose") || args.includes("-v"),
  watch: args.includes("--watch") || args.includes("-w"),
};

if (cmd !== "build") {
  console.error(`\n❌ Unknown command: ${cmd}`);
  console.error(`\nUsage: preliquify build [options]`);
  console.error(`\nOptions:`);
  console.error(`  --watch, -w     Watch for changes`);
  console.error(`  --verbose, -v   Show detailed error information\n`);
  process.exit(1);
}

async function loadConfig(): Promise<any> {
  const cwd = process.cwd();
  const possibleConfigs = [
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

const cfg = (await loadConfig()) ?? {};

console.log("\n🚀 Starting PreLiquify build...\n");

try {
  await build({
    srcDir: cfg.srcDir ?? resolve("src/snippets"),
    outLiquidDir: cfg.outLiquidDir ?? resolve("snippets"),
    outClientDir: cfg.outClientDir ?? resolve("assets"),
    jsxImportSource: cfg.jsxImportSource ?? "preact",
    watch: flags.watch || !!cfg.watch,
    verbose: flags.verbose,
  });
} catch (error: any) {
  // Error formatting is handled by the build function
  if (flags.verbose && error.stack) {
    console.error("\nFull stack trace:", error.stack);
  }
  process.exit(1);
}
