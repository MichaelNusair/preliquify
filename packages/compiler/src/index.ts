export { build } from "./build.js";
export type { BuildOptions } from "./types.js";

// Schema Fragments
export {
  createFragmentRegistry,
  scanForFragments,
  injectFragments,
  processLiquidWithFragments,
  listFragments,
  getFragment,
  DEFAULT_FRAGMENTS,
} from "./schema-fragments.js";
export type { SchemaFragment, FragmentRegistry } from "./schema-fragments.js";

// Theme Style Analyzer
export {
  analyzeTheme,
  extractThemeStyles,
  writeExtractedStyles,
} from "./theme-analyzer.js";
export type {
  ExtractedStyles,
  ThemeAnalyzerOptions,
} from "./theme-analyzer.js";
