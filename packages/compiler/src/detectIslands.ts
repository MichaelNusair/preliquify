export function needsClientRuntime(tsxContent: string): boolean {
  return tsxContent.includes("<Hydrate");
}
