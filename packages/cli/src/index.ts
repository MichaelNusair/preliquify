#!/usr/bin/env node
import { build } from '@preliquify/compiler';
import { resolve } from 'node:path';

const cmd = process.argv[2] || "build";
if (cmd !== "build") {
  console.error(`Unknown command: ${cmd}`);
  process.exit(1);
}

const configPath = resolve(process.cwd(), "preliquify.config.ts");
let cfg: any = {};
try {
  // dynamic import config (TS/ESM), fallback to JS if needed
  const mod = await import("file://" + configPath);
  cfg = mod.default || mod;
} catch (e) {
  console.warn("[preliquify] no preliquify.config.ts found, using defaults.");
}

await build({
  srcDir: cfg.srcDir ?? resolve("src/snippets"),
  outLiquidDir: cfg.outLiquidDir ?? resolve("snippets"),
  outClientDir: cfg.outClientDir ?? resolve("assets"),
  jsxImportSource: cfg.jsxImportSource ?? "preact",
  watch: !!cfg.watch
});

