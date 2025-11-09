/**
 * CSS processing utilities for Tailwind CSS support
 */
import { existsSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { promises as fs } from "node:fs";
import postcss from "postcss";
import tailwindcss from "tailwindcss";
import autoprefixer from "autoprefixer";

/**
 * Finds a config file by trying multiple extensions
 */
async function findConfigFile(
    baseName: string,
    projectRoot: string
): Promise<string | null> {
    const extensions = [".js", ".mjs", ".ts", ".cjs"];
    for (const ext of extensions) {
        const path = resolve(projectRoot, `${baseName}${ext}`);
        if (existsSync(path)) {
            return path;
        }
    }
    return null;
}

/**
 * Loads Tailwind config, trying multiple methods
 */
async function loadTailwindConfig(
    configPath: string | undefined,
    projectRoot: string
): Promise<any> {
    if (configPath) {
        const resolvedPath = resolve(projectRoot, configPath);
        if (existsSync(resolvedPath)) {
            // Try to import the config
            try {
                const configUrl = `file://${resolvedPath}`;
                const mod = await import(configUrl);
                return mod.default || mod;
            } catch (error) {
                // If import fails, try to read as JSON
                const content = await fs.readFile(resolvedPath, "utf8");
                return JSON.parse(content);
            }
        }
    }

    // Try to find default config files
    const defaultConfig = await findConfigFile("tailwind.config", projectRoot);
    if (defaultConfig) {
        try {
            const configUrl = `file://${defaultConfig}`;
            const mod = await import(configUrl);
            return mod.default || mod;
        } catch {
            // If import fails, return null to use Tailwind defaults
            return null;
        }
    }

    return null;
}

/**
 * Loads PostCSS config, trying multiple methods
 */
async function loadPostCSSConfig(
    configPath: string | undefined,
    projectRoot: string
): Promise<any> {
    if (configPath) {
        const resolvedPath = resolve(projectRoot, configPath);
        if (existsSync(resolvedPath)) {
            try {
                const configUrl = `file://${resolvedPath}`;
                const mod = await import(configUrl);
                return mod.default || mod;
            } catch (error) {
                const content = await fs.readFile(resolvedPath, "utf8");
                return JSON.parse(content);
            }
        }
    }

    // Try to find default config files
    const defaultConfig = await findConfigFile("postcss.config", projectRoot);
    if (defaultConfig) {
        try {
            const configUrl = `file://${defaultConfig}`;
            const mod = await import(configUrl);
            return mod.default || mod;
        } catch {
            return null;
        }
    }

    return null;
}

/**
 * Processes CSS with PostCSS and Tailwind
 */
export async function processCSS(
    css: string,
    from: string,
    tailwindConfig: boolean | { config?: string; postcssConfig?: string } | undefined,
    projectRoot: string
): Promise<string> {
    if (!tailwindConfig) {
        return css;
    }

    const tailwindConfigObj =
        typeof tailwindConfig === "object"
            ? await loadTailwindConfig(tailwindConfig.config, projectRoot)
            : await loadTailwindConfig(undefined, projectRoot);

    const postcssConfigObj =
        typeof tailwindConfig === "object"
            ? await loadPostCSSConfig(tailwindConfig.postcssConfig, projectRoot)
            : await loadPostCSSConfig(undefined, projectRoot);

    // Build PostCSS plugins
    const plugins: any[] = [];

    // Add Tailwind if enabled
    if (tailwindConfig) {
        plugins.push(
            tailwindcss(
                tailwindConfigObj || {
                    content: [
                        join(projectRoot, "src/**/*.{tsx,ts,jsx,js}"),
                        join(projectRoot, "**/*.{tsx,ts,jsx,js}"),
                    ],
                }
            )
        );
    }

    // Add autoprefixer
    plugins.push(autoprefixer());

    // Use custom PostCSS config if provided, otherwise use our plugins
    const finalPlugins = postcssConfigObj?.plugins || plugins;

    const result = await postcss(finalPlugins).process(css, {
        from,
        to: from,
    });

    return result.css;
}

/**
 * Finds the project root by looking for node_modules or package.json
 * Note: This is a synchronous version. The async version is in build.ts
 */
export function findProjectRootSync(startPath: string): string {
    let current = resolve(startPath);

    while (current !== dirname(current)) {
        if (
            existsSync(join(current, "node_modules")) ||
            existsSync(join(current, "package.json"))
        ) {
            return current;
        }
        current = dirname(current);
    }

    return current;
}

