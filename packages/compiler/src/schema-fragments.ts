/**
 * Schema Fragment System
 *
 * Allows users to create reusable Liquid schema fragments that can be injected
 * into Shopify section schemas using FRAGMENT.name syntax.
 *
 * @example
 * ```liquid
 * {% schema %}
 * {
 *   "settings": [
 *     FRAGMENT.color-scheme,
 *     FRAGMENT.section-spacing
 *   ]
 * }
 * {% endschema %}
 * ```
 */

import { promises as fs } from "node:fs";
import { join, basename, extname } from "node:path";
import fg from "fast-glob";

export interface SchemaFragment {
  name: string;
  content: string;
  /** File path where fragment was defined */
  source: string;
}

export interface FragmentRegistry {
  fragments: Map<string, SchemaFragment>;
}

/**
 * Default schema fragments provided by Preliquify
 * These are commonly used Shopify theme settings
 */
export const DEFAULT_FRAGMENTS: Record<string, string> = {
  "color-scheme": `{
    "type": "select",
    "id": "color_scheme",
    "label": "Color scheme",
    "options": [
      { "value": "default", "label": "Default" },
      { "value": "inverse", "label": "Inverse" },
      { "value": "accent-1", "label": "Accent 1" },
      { "value": "accent-2", "label": "Accent 2" }
    ],
    "default": "default"
  }`,

  "section-spacing": `{
    "type": "range",
    "id": "padding_top",
    "label": "Top padding",
    "min": 0,
    "max": 100,
    "step": 4,
    "default": 36,
    "unit": "px"
  },
  {
    "type": "range",
    "id": "padding_bottom",
    "label": "Bottom padding",
    "min": 0,
    "max": 100,
    "step": 4,
    "default": 36,
    "unit": "px"
  }`,

  "section-visibility": `{
    "type": "header",
    "content": "Visibility"
  },
  {
    "type": "checkbox",
    "id": "show_on_mobile",
    "label": "Show on mobile",
    "default": true
  },
  {
    "type": "checkbox",
    "id": "show_on_desktop",
    "label": "Show on desktop",
    "default": true
  }`,

  animation: `{
    "type": "select",
    "id": "animation",
    "label": "Animation",
    "options": [
      { "value": "none", "label": "None" },
      { "value": "fade", "label": "Fade in" },
      { "value": "slide-up", "label": "Slide up" },
      { "value": "slide-left", "label": "Slide left" },
      { "value": "zoom", "label": "Zoom in" }
    ],
    "default": "none"
  }`,

  "custom-css": `{
    "type": "textarea",
    "id": "custom_css",
    "label": "Custom CSS",
    "info": "Add custom CSS for this section"
  }`,

  heading: `{
    "type": "text",
    "id": "heading",
    "label": "Heading",
    "default": "Section heading"
  },
  {
    "type": "select",
    "id": "heading_size",
    "label": "Heading size",
    "options": [
      { "value": "h2", "label": "Medium" },
      { "value": "h1", "label": "Large" },
      { "value": "h0", "label": "Extra large" }
    ],
    "default": "h2"
  }`,

  "media-settings": `{
    "type": "select",
    "id": "media_aspect_ratio",
    "label": "Aspect ratio",
    "options": [
      { "value": "auto", "label": "Adapt to media" },
      { "value": "square", "label": "Square" },
      { "value": "portrait", "label": "Portrait" },
      { "value": "landscape", "label": "Landscape" }
    ],
    "default": "auto"
  },
  {
    "type": "checkbox",
    "id": "media_fit",
    "label": "Fit media to container",
    "default": false
  }`,

  button: `{
    "type": "text",
    "id": "button_label",
    "label": "Button label",
    "default": "Learn more"
  },
  {
    "type": "url",
    "id": "button_link",
    "label": "Button link"
  },
  {
    "type": "select",
    "id": "button_style",
    "label": "Button style",
    "options": [
      { "value": "primary", "label": "Primary" },
      { "value": "secondary", "label": "Secondary" },
      { "value": "link", "label": "Link" }
    ],
    "default": "primary"
  }`,
};

/**
 * Scans a directory for custom fragment files (.liquid or .json)
 */
export async function scanForFragments(
  fragmentsDir: string
): Promise<Map<string, SchemaFragment>> {
  const fragments = new Map<string, SchemaFragment>();

  try {
    await fs.access(fragmentsDir);
  } catch {
    // Directory doesn't exist, return empty map
    return fragments;
  }

  const files = await fg("**/*.{liquid,json}", {
    cwd: fragmentsDir,
    absolute: true,
    ignore: ["**/node_modules/**"],
  });

  for (const file of files) {
    try {
      const content = await fs.readFile(file, "utf8");
      const name = basename(file, extname(file));

      // Clean up the content - remove comments and trim
      const cleanedContent = content
        .replace(/<!--[\s\S]*?-->/g, "") // Remove HTML comments
        .replace(/\{%\s*comment\s*%\}[\s\S]*?\{%\s*endcomment\s*%\}/g, "") // Remove Liquid comments
        .trim();

      fragments.set(name, {
        name,
        content: cleanedContent,
        source: file,
      });
    } catch (error) {
      console.warn(`⚠️  Failed to load fragment from ${file}:`, error);
    }
  }

  return fragments;
}

/**
 * Creates a fragment registry with default and custom fragments
 */
export async function createFragmentRegistry(
  customFragmentsDir?: string
): Promise<FragmentRegistry> {
  const fragments = new Map<string, SchemaFragment>();

  // Add default fragments
  for (const [name, content] of Object.entries(DEFAULT_FRAGMENTS)) {
    fragments.set(name, {
      name,
      content,
      source: "preliquify:default",
    });
  }

  // Override with custom fragments if provided
  if (customFragmentsDir) {
    const customFragments = await scanForFragments(customFragmentsDir);
    for (const [name, fragment] of customFragments) {
      fragments.set(name, fragment);
    }
  }

  return { fragments };
}

/**
 * Processes Liquid content and replaces FRAGMENT.name references with actual fragment content
 *
 * @param content - The Liquid template content
 * @param registry - Fragment registry to use
 * @returns Content with fragments injected
 */
export function injectFragments(
  content: string,
  registry: FragmentRegistry
): string {
  // Match FRAGMENT.name pattern (with optional quotes around it)
  const fragmentPattern = /["']?FRAGMENT\.([a-zA-Z0-9_-]+)["']?/g;

  return content.replace(fragmentPattern, (match, fragmentName) => {
    const fragment = registry.fragments.get(fragmentName);

    if (!fragment) {
      console.warn(
        `⚠️  Unknown fragment: FRAGMENT.${fragmentName}. Available fragments: ${Array.from(registry.fragments.keys()).join(", ")}`
      );
      // Return a comment indicating the missing fragment
      return `/* MISSING FRAGMENT: ${fragmentName} */`;
    }

    return fragment.content;
  });
}

/**
 * Extracts {% schema %} block from Liquid content
 */
export function extractSchemaBlock(content: string): {
  before: string;
  schema: string;
  after: string;
} | null {
  const schemaMatch = content.match(
    /(\{%\s*schema\s*%\})([\s\S]*?)(\{%\s*endschema\s*%\})/
  );

  if (!schemaMatch) {
    return null;
  }

  const [fullMatch, schemaStart, schemaContent, schemaEnd] = schemaMatch;
  const matchIndex = content.indexOf(fullMatch);

  return {
    before: content.slice(0, matchIndex),
    schema: schemaContent,
    after: content.slice(matchIndex + fullMatch.length),
  };
}

/**
 * Processes a Liquid file and injects fragments into its schema
 */
export function processLiquidWithFragments(
  content: string,
  registry: FragmentRegistry
): string {
  const schemaBlock = extractSchemaBlock(content);

  if (!schemaBlock) {
    // No schema block, just return content as-is
    return content;
  }

  // Inject fragments into schema content
  const processedSchema = injectFragments(schemaBlock.schema, registry);

  // Reconstruct the content
  return `${schemaBlock.before}{% schema %}${processedSchema}{% endschema %}${schemaBlock.after}`;
}

/**
 * Lists all available fragments
 */
export function listFragments(registry: FragmentRegistry): string[] {
  return Array.from(registry.fragments.keys()).sort();
}

/**
 * Gets a single fragment by name
 */
export function getFragment(
  registry: FragmentRegistry,
  name: string
): SchemaFragment | undefined {
  return registry.fragments.get(name);
}
