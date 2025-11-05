/**
 * Configuration types for PreLiquify
 *
 * Import this type in your preliquify.config.ts for type safety:
 *
 * ```ts
 * import type { PreliquifyConfig } from "@preliquify/cli";
 *
 * const config: PreliquifyConfig = {
 *   srcDir: "src/snippets",
 *   outLiquidDir: "snippets",
 *   outClientDir: "assets",
 * };
 *
 * export default config;
 * ```
 */

/**
 * PreLiquify configuration options
 */
export interface PreliquifyConfig {
  /** Source directory for components */
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
}
