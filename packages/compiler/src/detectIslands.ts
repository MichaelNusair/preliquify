/**
 * Detects if a component needs client-side hydration runtime
 *
 * Returns true if the code contains:
 * - <Hydrate> components (explicit islands)
 * - createLiquidSnippet (implicit islands)
 *
 * @param tsxContent - Source code content to analyze
 * @returns true if client runtime is needed
 */
export function needsClientRuntime(tsxContent: string): boolean {
  // Check for explicit Hydrate components
  if (tsxContent.includes("<Hydrate")) {
    return true;
  }

  // Check for createLiquidSnippet which generates hydration islands
  if (tsxContent.includes("createLiquidSnippet")) {
    return true;
  }

  return false;
}
