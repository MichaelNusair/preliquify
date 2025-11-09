export type BuildOptions = {
  /**
   * Entry point(s) for compilation. Can be:
   * - A directory path to scan (e.g., "./src/snippets")
   * - A glob pattern (e.g., "./src/snippets/**‎/*.tsx")
   * - An array of files/directories/patterns
   *
   * Only files containing `createLiquidSnippet` will be compiled to .liquid files.
   * Other files are used as library components and bundled into entry points.
   *
   * @example
   * entryPoint: "./src/snippets"  // Scan directory
   * entryPoint: ["./src/MediaGallery.tsx", "./src/ProductCard.tsx"]  // Specific files
   * entryPoint: "./src/**‎/*.snippet.tsx"  // Pattern matching
   */
  entryPoint: string | string[];

  /**
   * @deprecated Use `entryPoint` instead. This will be removed in v2.0.0
   */
  srcDir?: string;

  outLiquidDir: string; // e.g., "<theme>/snippets"
  outClientDir: string; // e.g., "<theme>/assets"
  jsxImportSource?: string; // default: "preact"
  watch?: boolean;
  verbose?: boolean; // Show detailed error information
  suffixDistFiles?: boolean; // default: true - suffix all dist files with -prlq

  /**
   * Generate client-side component bundles with auto-registration
   * @default true
   */
  generateClientBundles?: boolean;

  /**
   * Minify client bundles
   * @default true for production, false for development
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
};
