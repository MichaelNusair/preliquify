// Naive scan for Hydrate usage to include a generic client runtime.
// You can improve this to per-island chunking later.
export function needsClientRuntime(tsxContent: string): boolean {
  return tsxContent.includes("<Hydrate");
}

