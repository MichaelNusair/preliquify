#!/usr/bin/env node
import { build } from "@preliquify/compiler";
import { resolve } from "node:path";
import { promises as fs } from "node:fs";
import { pathToFileURL } from "node:url";
import { build as esbuild } from "esbuild";

const cmd = process.argv[2] || "build";
if (cmd !== "build") {
  console.error(`Unknown command: ${cmd}`);
  process.exit(1);
}

async function loadConfig(): Promise<any> {
  const cwd = process.cwd();
  const possibleConfigs = [
    resolve(cwd, "preliquify.config.ts"),
    resolve(cwd, "preliquify.config.js"),
    resolve(cwd, "preliquify.config.mjs"),
  ];

  for (const configPath of possibleConfigs) {
    try {
      await fs.access(configPath);
      // File exists, try to import it
      let importPath: string;

      if (configPath.endsWith(".ts")) {
        // Transpile TS to ESM using esbuild
        const tmpOut = configPath + ".mjs";
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

      // Clean up temp file if we created one
      if (configPath.endsWith(".ts")) {
        try {
          await fs.rm(configPath + ".mjs");
        } catch {
          // Ignore cleanup errors
        }
      }

      return cfg;
    } catch (e: any) {
      // File doesn't exist or can't be imported, try next
      if (e.code !== "ENOENT") {
        // Log non-file-not-found errors for debugging
        console.warn(
          `[preliquify] Error loading config from ${configPath}:`,
          e.message
        );
      }
      continue;
    }
  }

  return null;
}

const cfg = (await loadConfig()) ?? {};

try {
  await build({
    srcDir: cfg.srcDir ?? resolve("src/snippets"),
    outLiquidDir: cfg.outLiquidDir ?? resolve("snippets"),
    outClientDir: cfg.outClientDir ?? resolve("assets"),
    jsxImportSource: cfg.jsxImportSource ?? "preact",
    watch: !!cfg.watch,
  });
} catch (error: any) {
  const errorMessage = error.message || String(error);
  console.error(errorMessage);
  process.exit(1);
}
