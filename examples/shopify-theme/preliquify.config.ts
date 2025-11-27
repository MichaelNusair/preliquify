import type { PreliquifyConfig } from "@preliquify/cli";

const config: PreliquifyConfig = {
  entryPoint: "src/snippets", // Only files with createLiquidSnippet are compiled
  outLiquidDir: "snippets",
  outClientDir: "assets",
  tailwind: true, // Enable Tailwind CSS processing
};

export default config;
