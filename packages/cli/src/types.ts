/**
 * Configuration types for PreLiquify
 *
 * @example
 * ```ts
 * import type { PreliquifyConfig } from "@preliquify/cli";
 *
 * const config: PreliquifyConfig = {
 *   entryPoint: "./src/snippets",
 *   outLiquidDir: "./snippets",
 *   outClientDir: "./assets",
 * };
 *
 * export default config;
 * ```
 */

/**
 * PreLiquify configuration options
 */
export interface PreliquifyConfig {
  /**
   * Entry point(s) for compilation. Can be:
   * - A directory path to scan (e.g., "./src/snippets")
   * - A glob pattern (e.g., "./src/snippets.tsx")
   * - An array of files/directories/patterns
   *
   * Only files containing createLiquidSnippet will be compiled to .liquid files.
   */
  entryPoint?: string | string[];

  /** @deprecated Use `entryPoint` instead. Will be removed in v2.0.0 */
  srcDir?: string;

  /** Output directory for Liquid templates */
  outLiquidDir?: string;
  /** Output directory for client assets */
  outClientDir?: string;
  /** JSX import source */
  jsxImportSource?: string;
  /** Enable watch mode */
  watch?: boolean;
  /** Enable verbose logging */
  verbose?: boolean;
  /** Suffix all dist files (liquid and js) with -prlq (default: true) */
  suffixDistFiles?: boolean;

  /**
   * Generate client-side component bundles with auto-registration
   * When true, creates .bundle.js files for each component that auto-register with the runtime
   * @default true
   */
  generateClientBundles?: boolean;

  /**
   * Minify client bundles
   * @default true
   */
  minify?: boolean;

  /**
   * Enable Tailwind CSS processing
   * @default false
   */
  tailwind?: boolean | {
    /**
     * Path to Tailwind config file
     * @default "tailwind.config.js" or "tailwind.config.ts"
     */
    config?: string;
    /**
     * Path to PostCSS config file
     * @default "postcss.config.js" or "postcss.config.ts"
     */
    postcssConfig?: string;
  };
}
