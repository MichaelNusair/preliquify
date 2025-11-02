import { defineConfig } from "vitest/config";
import { resolve } from "node:path";

export default defineConfig({
  test: {
    globals: true,
    environment: "jsdom",
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/**",
        "dist/**",
        "**/*.d.ts",
        "**/*.config.*",
        "**/mockData/**",
        "examples/**",
        "scripts/**",
      ],
    },
    setupFiles: ["./test/setup.ts"],
  },
  resolve: {
    alias: {
      "@preliquify/core": resolve(__dirname, "./packages/core/src"),
      "@preliquify/compiler": resolve(__dirname, "./packages/compiler/src"),
      "@preliquify/preact": resolve(__dirname, "./packages/preact/src"),
      "@preliquify/cli": resolve(__dirname, "./packages/cli/src"),
    },
  },
});
