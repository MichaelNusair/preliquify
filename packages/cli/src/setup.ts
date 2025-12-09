#!/usr/bin/env node
/**
 * Preliquify Setup Script
 *
 * Auto-configures a Shopify theme for use with Preliquify.
 * This runs automatically on `npm install @preliquify/cli` (via postinstall)
 * or can be run manually with `npx preliquify init`.
 *
 * Features:
 * - Detects existing Shopify theme structure
 * - Creates necessary directories
 * - Generates default configuration
 * - Updates theme.liquid with script tags
 * - Creates example component
 * - Sets up schema fragments directory
 */

import { promises as fs } from "node:fs";
import { join, dirname } from "node:path";

const DEFAULT_CONFIG = `import type { PreliquifyConfig } from "@preliquify/cli";

const config: PreliquifyConfig = {
  // Entry point(s) - directory or specific files
  entryPoint: "./src/snippets",

  // Output directories
  outLiquidDir: "./snippets",
  outClientDir: "./assets",

  // Enable Tailwind CSS processing
  tailwind: true,

  // Schema fragments directory (optional)
  // fragmentsDir: "./src/schema-fragments",

  // Suffix output files with -prlq (default: true)
  suffixDistFiles: true,

  // Generate client bundles for hydration (default: true)
  generateClientBundles: true,

  // Minify client bundles in production (default: true)
  minify: true,
};

export default config;
`;

const EXAMPLE_COMPONENT = `import { createLiquidSnippet, Conditional, $ } from "@preliquify/preact";

interface HelloWorldProps {
  title: string;
  showButton: boolean;
}

function HelloWorld({ title, showButton }: HelloWorldProps) {
  return (
    <div className="preliquify-container max-w-md mx-auto p-6">
      <div className="bg-blue-500 text-white p-6 rounded-lg shadow-lg text-center">
        <h1 className="text-2xl font-bold mb-4">{"{{ title }}"}</h1>
        <Conditional when={$.var("showButton")}>
          <button className="bg-white text-blue-500 px-4 py-2 rounded hover:bg-gray-100 transition-colors font-semibold">
            👋 Click me
          </button>
        </Conditional>
      </div>
    </div>
  );
}

export default createLiquidSnippet(HelloWorld, {
  title: "title",
  showButton: "showButton",
});
`;

const TAILWIND_CONFIG = `/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/**/*.{ts,tsx}",
    "./snippets/**/*.liquid",
    "./sections/**/*.liquid",
  ],
  theme: {
    extend: {
      // Add custom theme extensions here
    },
  },
  plugins: [],
  // Important: Scope Tailwind styles to avoid conflicts with theme
  important: "[data-preliquify]",
};
`;

const INPUT_CSS = `@tailwind base;
@tailwind components;
@tailwind utilities;

/* Custom Preliquify styles */
.preliquify-container {
  /* Container styles */
}
`;

const DEFAULT_FRAGMENT_COLOR_SCHEME = `{
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
}
`;

const THEME_LIQUID_SNIPPET = `
  <!-- Preliquify Runtime -->
  {{ 'preliquify-prlq.runtime.js' | asset_url | script_tag }}
`;

interface SetupOptions {
  cwd?: string;
  force?: boolean;
  verbose?: boolean;
  skipExamples?: boolean;
}

/**
 * Detects if the current directory is a Shopify theme
 */
async function isShopifyTheme(cwd: string): Promise<boolean> {
  const requiredDirs = ["layout", "sections", "snippets"];
  let foundDirs = 0;

  for (const dir of requiredDirs) {
    try {
      const stat = await fs.stat(join(cwd, dir));
      if (stat.isDirectory()) {
        foundDirs++;
      }
    } catch {
      // Directory doesn't exist
    }
  }

  // Need at least 2 of the required directories
  return foundDirs >= 2;
}

/**
 * Creates a directory if it doesn't exist
 */
async function ensureDir(path: string): Promise<void> {
  try {
    await fs.mkdir(path, { recursive: true });
  } catch {
    // Directory might already exist
  }
}

/**
 * Writes a file if it doesn't exist (unless force is true)
 */
async function writeIfNotExists(
  path: string,
  content: string,
  force: boolean = false
): Promise<boolean> {
  try {
    if (!force) {
      await fs.access(path);
      return false; // File exists, skip
    }
  } catch {
    // File doesn't exist, continue
  }

  await ensureDir(dirname(path));
  await fs.writeFile(path, content, "utf8");
  return true;
}

/**
 * Updates theme.liquid to include Preliquify runtime
 */
async function updateThemeLiquid(
  cwd: string,
  verbose: boolean
): Promise<boolean> {
  const themeLiquidPath = join(cwd, "layout", "theme.liquid");

  try {
    let content = await fs.readFile(themeLiquidPath, "utf8");

    // Check if already updated
    if (content.includes("preliquify-prlq.runtime.js")) {
      if (verbose) {
        console.log("  ℹ theme.liquid already includes Preliquify runtime");
      }
      return false;
    }

    // Find </head> and insert before it
    const headCloseIndex = content.lastIndexOf("</head>");
    if (headCloseIndex === -1) {
      console.warn(
        "  ⚠️  Could not find </head> in theme.liquid. Please add runtime manually."
      );
      return false;
    }

    const before = content.slice(0, headCloseIndex);
    const after = content.slice(headCloseIndex);
    content = before + THEME_LIQUID_SNIPPET + after;

    await fs.writeFile(themeLiquidPath, content, "utf8");
    return true;
  } catch (error) {
    if (verbose) {
      console.warn("  ⚠️  Could not update theme.liquid:", error);
    }
    return false;
  }
}

/**
 * Main setup function
 */
export async function setup(options: SetupOptions = {}): Promise<void> {
  const {
    cwd = process.cwd(),
    force = false,
    verbose = false,
    skipExamples = false,
  } = options;

  console.log("\n🚀 Preliquify Setup\n");

  // 1. Check if this is a Shopify theme
  const isTheme = await isShopifyTheme(cwd);
  if (!isTheme) {
    console.log(
      "⚠️  Warning: This doesn't appear to be a Shopify theme directory."
    );
    console.log("   Expected directories: layout/, sections/, snippets/");
    console.log("   Setup will continue, but you may need to adjust paths.\n");
  } else {
    console.log("✅ Detected Shopify theme structure\n");
  }

  // 2. Create source directories
  console.log("📁 Creating directories...");
  const srcDirs = [
    join(cwd, "src"),
    join(cwd, "src", "snippets"),
    join(cwd, "src", "components"),
    join(cwd, "src", "schema-fragments"),
    join(cwd, "src", "styles"),
  ];

  for (const dir of srcDirs) {
    await ensureDir(dir);
    if (verbose) {
      console.log(`  ✓ ${dir.replace(cwd, ".")}`);
    }
  }
  console.log("  ✓ Source directories created\n");

  // 3. Create configuration file
  console.log("⚙️  Creating configuration...");
  const configCreated = await writeIfNotExists(
    join(cwd, "preliquify.config.ts"),
    DEFAULT_CONFIG,
    force
  );
  if (configCreated) {
    console.log("  ✓ preliquify.config.ts created");
  } else {
    console.log("  ℹ preliquify.config.ts already exists (skipped)");
  }

  // 4. Create Tailwind config
  const tailwindCreated = await writeIfNotExists(
    join(cwd, "tailwind.config.js"),
    TAILWIND_CONFIG,
    force
  );
  if (tailwindCreated) {
    console.log("  ✓ tailwind.config.js created");
  } else {
    console.log("  ℹ tailwind.config.js already exists (skipped)");
  }

  // 5. Create input.css
  const cssCreated = await writeIfNotExists(
    join(cwd, "src", "input.css"),
    INPUT_CSS,
    force
  );
  if (cssCreated) {
    console.log("  ✓ src/input.css created");
  } else {
    console.log("  ℹ src/input.css already exists (skipped)");
  }

  // 6. Create example component (unless skipped)
  if (!skipExamples) {
    console.log("\n📝 Creating example component...");
    const exampleCreated = await writeIfNotExists(
      join(cwd, "src", "snippets", "HelloWorld.tsx"),
      EXAMPLE_COMPONENT,
      force
    );
    if (exampleCreated) {
      console.log("  ✓ src/snippets/HelloWorld.tsx created");
    } else {
      console.log("  ℹ Example component already exists (skipped)");
    }
  }

  // 7. Create default schema fragment
  console.log("\n🧩 Creating schema fragments...");
  const fragmentCreated = await writeIfNotExists(
    join(cwd, "src", "schema-fragments", "color-scheme.liquid"),
    DEFAULT_FRAGMENT_COLOR_SCHEME,
    force
  );
  if (fragmentCreated) {
    console.log("  ✓ src/schema-fragments/color-scheme.liquid created");
  } else {
    console.log("  ℹ Schema fragment already exists (skipped)");
  }

  // 8. Update theme.liquid
  if (isTheme) {
    console.log("\n🎨 Updating theme.liquid...");
    const themeUpdated = await updateThemeLiquid(cwd, verbose);
    if (themeUpdated) {
      console.log("  ✓ Added Preliquify runtime to theme.liquid");
    }
  }

  // 9. Add scripts to package.json if it exists
  console.log("\n📦 Checking package.json...");
  const pkgPath = join(cwd, "package.json");
  try {
    const pkgContent = await fs.readFile(pkgPath, "utf8");
    const pkg = JSON.parse(pkgContent);

    let modified = false;
    if (!pkg.scripts) {
      pkg.scripts = {};
    }

    if (!pkg.scripts["preliquify:build"]) {
      pkg.scripts["preliquify:build"] = "preliquify build";
      modified = true;
    }
    if (!pkg.scripts["preliquify:watch"]) {
      pkg.scripts["preliquify:watch"] = "preliquify build --watch";
      modified = true;
    }

    if (modified) {
      await fs.writeFile(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`, "utf8");
      console.log("  ✓ Added preliquify scripts to package.json");
    } else {
      console.log("  ℹ Scripts already exist in package.json");
    }
  } catch {
    console.log("  ℹ No package.json found (skipped)");
  }

  // Done!
  console.log(`\n${"─".repeat(50)}`);
  console.log("\n✅ Preliquify setup complete!\n");
  console.log("Next steps:");
  console.log("  1. Run: npm run preliquify:build");
  console.log("  2. Check generated snippets/ and assets/");
  console.log("  3. Use in Shopify: {% render 'HelloWorld-prlq' %}\n");
  console.log("Documentation: https://github.com/MichaelNusair/preliquify");
  console.log("");
}

// Run setup if called directly
if (process.argv[1]?.includes("setup")) {
  const args = process.argv.slice(2);
  const options: SetupOptions = {
    force: args.includes("--force") || args.includes("-f"),
    verbose: args.includes("--verbose") || args.includes("-v"),
    skipExamples: args.includes("--no-examples"),
  };

  setup(options).catch((error) => {
    console.error("\n❌ Setup failed:", error.message);
    process.exit(1);
  });
}
