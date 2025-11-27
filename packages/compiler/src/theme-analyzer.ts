/**
 * Theme Style Analyzer
 *
 * Automatically analyzes existing Shopify theme styles and extracts them
 * for integration with Preliquify components. This prevents style conflicts
 * and ensures React components blend seamlessly with the existing theme.
 *
 * Features:
 * - Scans assets/*.css for theme styles
 * - Extracts :root CSS variables
 * - Extracts @keyframes animations
 * - Extracts important selectors (.shopify-*, etc.)
 * - Generates theme-extracted.css with scoped styles
 */

import { promises as fs } from "node:fs";
import { join, basename } from "node:path";
import fg from "fast-glob";

export interface ExtractedStyles {
  /** CSS custom properties from :root */
  cssVariables: string[];
  /** @keyframes definitions */
  keyframes: string[];
  /** Important theme selectors */
  themeSelectors: string[];
  /** Font-face declarations */
  fontFaces: string[];
  /** Media queries with theme settings */
  mediaQueries: string[];
  /** Raw combined CSS */
  rawCSS: string;
}

export interface ThemeAnalyzerOptions {
  /** Directory containing theme assets (default: ./assets) */
  assetsDir?: string;
  /** Directory containing Liquid files to scan for embedded CSS */
  liquidDirs?: string[];
  /** Selectors to always include */
  includeSelectors?: string[];
  /** Selectors to exclude */
  excludeSelectors?: string[];
  /** Whether to scope extracted styles */
  scopeStyles?: boolean;
  /** Scope selector (default: [data-preliquify]) */
  scopeSelector?: string;
  /** Enable verbose logging */
  verbose?: boolean;
}

const DEFAULT_OPTIONS: Required<ThemeAnalyzerOptions> = {
  assetsDir: "./assets",
  liquidDirs: ["./layout", "./sections", "./snippets", "./templates"],
  includeSelectors: [
    ":root",
    ".shopify-",
    ".section-",
    ".page-",
    ".rte",
    ".product-",
    ".collection-",
    ".cart-",
    ".customer-",
    ".header",
    ".footer",
    ".drawer",
    ".modal",
    ".overlay",
    "[data-",
  ],
  excludeSelectors: [".preliquify-", "[data-preliquify]"],
  scopeStyles: true,
  scopeSelector: "[data-preliquify]",
  verbose: false,
};

/**
 * Extracts CSS from a file content
 */
function extractCSSFromContent(content: string): string {
  // Extract inline <style> tags from Liquid/HTML
  const styleMatches = content.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi);
  const styles: string[] = [];

  for (const match of styleMatches) {
    styles.push(match[1]);
  }

  // Also extract {% style %} Liquid tags
  const liquidStyleMatches = content.matchAll(
    /\{%\s*style\s*%\}([\s\S]*?)\{%\s*endstyle\s*%\}/gi
  );

  for (const match of liquidStyleMatches) {
    styles.push(match[1]);
  }

  return styles.join("\n");
}

/**
 * Extracts :root CSS variables
 */
function extractRootVariables(css: string): string[] {
  const results: string[] = [];
  const rootPattern = /:root\s*\{([^}]+)\}/g;

  let match;
  while ((match = rootPattern.exec(css)) !== null) {
    results.push(`:root {${match[1]}}`);
  }

  return results;
}

/**
 * Extracts @keyframes definitions
 */
function extractKeyframes(css: string): string[] {
  const results: string[] = [];
  const keyframesPattern =
    /@keyframes\s+[\w-]+\s*\{[^}]*(?:\{[^}]*\}[^}]*)*\}/g;

  const matches = css.match(keyframesPattern);
  if (matches) {
    results.push(...matches);
  }

  return results;
}

/**
 * Extracts @font-face declarations
 */
function extractFontFaces(css: string): string[] {
  const results: string[] = [];
  const fontFacePattern = /@font-face\s*\{[^}]+\}/g;

  const matches = css.match(fontFacePattern);
  if (matches) {
    results.push(...matches);
  }

  return results;
}

/**
 * Extracts media queries
 */
function extractMediaQueries(css: string): string[] {
  const results: string[] = [];
  // Match media queries - this is a simplified pattern
  const mediaPattern = /@media[^{]+\{(?:[^{}]+|\{[^{}]*\})*\}/g;

  const matches = css.match(mediaPattern);
  if (matches) {
    // Filter to only include those with CSS variables or theme-related content
    for (const match of matches) {
      if (match.includes("--") || match.includes(".shopify")) {
        results.push(match);
      }
    }
  }

  return results;
}

/**
 * Extracts selectors matching given patterns
 */
function extractMatchingSelectors(
  css: string,
  includePatterns: string[],
  excludePatterns: string[]
): string[] {
  const results: string[] = [];

  // Simple regex to match CSS rules
  // This matches selector { properties }
  const rulePattern = /([^{}]+)\{([^{}]+)\}/g;

  let match;
  while ((match = rulePattern.exec(css)) !== null) {
    const selector = match[1].trim();
    const properties = match[2];

    // Skip if it's a keyframe or font-face
    if (selector.startsWith("@") || selector.includes("%")) {
      continue;
    }

    // Check if selector matches any include pattern
    const shouldInclude = includePatterns.some((pattern) =>
      selector.includes(pattern)
    );

    // Check if selector matches any exclude pattern
    const shouldExclude = excludePatterns.some((pattern) =>
      selector.includes(pattern)
    );

    if (shouldInclude && !shouldExclude) {
      results.push(`${selector} {${properties}}`);
    }
  }

  return results;
}

/**
 * Scopes CSS selectors to prevent conflicts
 */
function scopeCSS(css: string, scopeSelector: string): string {
  // Don't scope :root, @keyframes, @font-face, or @media
  const lines = css.split("\n");
  const result: string[] = [];
  let inAtRule = false;
  let braceCount = 0;

  for (const line of lines) {
    const trimmed = line.trim();

    // Track @-rules
    if (trimmed.startsWith("@")) {
      inAtRule = true;
      braceCount = 0;
    }

    // Track braces for @-rules
    if (inAtRule) {
      braceCount += (line.match(/\{/g) || []).length;
      braceCount -= (line.match(/\}/g) || []).length;

      if (braceCount <= 0) {
        inAtRule = false;
      }
      result.push(line);
      continue;
    }

    // Skip :root
    if (trimmed.startsWith(":root")) {
      result.push(line);
      continue;
    }

    // Scope regular selectors
    if (trimmed && !trimmed.startsWith("/*") && !trimmed.endsWith("*/")) {
      // Check if this line contains a selector (has { at some point)
      if (
        trimmed.includes("{") ||
        (!trimmed.includes("}") && !trimmed.includes(":"))
      ) {
        // This might be a selector - prefix it
        const modified = line.replace(
          /^(\s*)([^{]+)(\{)/,
          `$1${scopeSelector} $2$3`
        );
        result.push(modified);
        continue;
      }
    }

    result.push(line);
  }

  return result.join("\n");
}

/**
 * Analyzes theme styles and extracts relevant CSS
 */
export async function analyzeTheme(
  projectRoot: string,
  options: ThemeAnalyzerOptions = {}
): Promise<ExtractedStyles> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const allCSS: string[] = [];

  // 1. Scan CSS files in assets directory
  const assetsPath = join(projectRoot, opts.assetsDir);
  try {
    const cssFiles = await fg("**/*.css", {
      cwd: assetsPath,
      absolute: true,
      ignore: ["**/preliquify*", "**/main.css", "**/*.min.css"],
    });

    for (const file of cssFiles) {
      try {
        const content = await fs.readFile(file, "utf8");
        allCSS.push(content);
        if (opts.verbose) {
          console.log(`  📄 Analyzed: ${basename(file)}`);
        }
      } catch {
        // Skip unreadable files
      }
    }
  } catch {
    // Assets directory doesn't exist
  }

  // 2. Scan Liquid files for embedded CSS
  for (const liquidDir of opts.liquidDirs) {
    const liquidPath = join(projectRoot, liquidDir);
    try {
      const liquidFiles = await fg("**/*.liquid", {
        cwd: liquidPath,
        absolute: true,
      });

      for (const file of liquidFiles) {
        try {
          const content = await fs.readFile(file, "utf8");
          const embeddedCSS = extractCSSFromContent(content);
          if (embeddedCSS) {
            allCSS.push(embeddedCSS);
            if (opts.verbose) {
              console.log(`  📄 Extracted CSS from: ${basename(file)}`);
            }
          }
        } catch {
          // Skip unreadable files
        }
      }
    } catch {
      // Directory doesn't exist
    }
  }

  const combinedCSS = allCSS.join("\n");

  // Extract different types of styles
  const cssVariables = extractRootVariables(combinedCSS);
  const keyframes = extractKeyframes(combinedCSS);
  const fontFaces = extractFontFaces(combinedCSS);
  const mediaQueries = extractMediaQueries(combinedCSS);
  const themeSelectors = extractMatchingSelectors(
    combinedCSS,
    opts.includeSelectors,
    opts.excludeSelectors
  );

  // Build raw CSS output
  let rawCSS = `/**
 * Theme Styles - Auto-extracted by Preliquify
 * Generated: ${new Date().toISOString()}
 * 
 * These styles are extracted from your Shopify theme to ensure
 * Preliquify components integrate seamlessly.
 */

/* CSS Custom Properties */
${cssVariables.join("\n\n")}

/* Font Faces */
${fontFaces.join("\n\n")}

/* Keyframe Animations */
${keyframes.join("\n\n")}

/* Theme Selectors */
${themeSelectors.join("\n\n")}

/* Media Queries */
${mediaQueries.join("\n\n")}
`;

  // Optionally scope the CSS
  if (opts.scopeStyles) {
    // Only scope the theme selectors, not variables/keyframes/fonts
    const scopedSelectors = scopeCSS(
      themeSelectors.join("\n"),
      opts.scopeSelector
    );
    rawCSS = rawCSS.replace(themeSelectors.join("\n\n"), scopedSelectors);
  }

  return {
    cssVariables,
    keyframes,
    fontFaces,
    mediaQueries,
    themeSelectors,
    rawCSS,
  };
}

/**
 * Writes extracted theme styles to a file
 */
export async function writeExtractedStyles(
  outputPath: string,
  styles: ExtractedStyles
): Promise<void> {
  await fs.writeFile(outputPath, styles.rawCSS, "utf8");
}

/**
 * Full theme analysis workflow
 */
export async function extractThemeStyles(
  projectRoot: string,
  outputPath: string,
  options: ThemeAnalyzerOptions = {}
): Promise<ExtractedStyles> {
  const opts = { ...options, verbose: options.verbose ?? false };

  if (opts.verbose) {
    console.log("\n🎨 Analyzing theme styles...");
  }

  const styles = await analyzeTheme(projectRoot, opts);

  if (opts.verbose) {
    console.log(`  ✓ Found ${styles.cssVariables.length} CSS variable blocks`);
    console.log(`  ✓ Found ${styles.keyframes.length} keyframe animations`);
    console.log(`  ✓ Found ${styles.fontFaces.length} font faces`);
    console.log(`  ✓ Found ${styles.themeSelectors.length} theme selectors`);
    console.log(`  ✓ Found ${styles.mediaQueries.length} media queries`);
  }

  await writeExtractedStyles(outputPath, styles);

  if (opts.verbose) {
    console.log(`  ✓ Written to: ${outputPath}`);
  }

  return styles;
}
