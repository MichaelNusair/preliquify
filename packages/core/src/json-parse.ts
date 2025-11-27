/**
 * Helper to check if a value is a Liquid expression string
 * @internal
 */
function isLiquidExpression(value: unknown): boolean {
  return (
    typeof value === "string" && (value.includes("{{") || value.includes("{%"))
  );
}

/**
 * Safely parses a JSON string, handling Liquid expression strings at build time.
 *
 * This function is designed to work in both build-time (Liquid) and runtime contexts.
 * When a prop contains a Liquid expression string (e.g., `"{{ data | json | escape }}"`),
 * it returns a safe default value at build time instead of attempting to parse it.
 *
 * **How it works:**
 * - At build time: If the value is a Liquid expression string or undefined, returns the default value
 * - At runtime: Parses the actual JSON string and returns the parsed value
 *
 * @template T - The expected type after parsing (defaults to unknown)
 * @param jsonString - The JSON string to parse, or a Liquid expression string, or undefined
 * @param defaultValue - The default value to return if parsing fails or at build time (defaults to empty array)
 * @returns The parsed JSON value, or the default value if parsing fails or at build time
 *
 * @example
 * ```tsx
 * import { jsonParse, createLiquidSnippet } from '@preliquify/preact';
 *
 * interface Props {
 *   mediaCSR?: string; // JSON string from Liquid
 * }
 *
 * function MediaGallery({ mediaCSR }: Props) {
 *   // Safely parse JSON - works at both build time and runtime
 *   const media = jsonParse(mediaCSR, []);
 *
 *   return (
 *     <div>
 *       {media.map(item => (
 *         <img key={item.id} src={item.url} alt={item.alt} />
 *       ))}
 *     </div>
 *   );
 * }
 *
 * export default createLiquidSnippet(MediaGallery, {
 *   mediaCSR: 'mediaCSR',
 * });
 * ```
 *
 * @example
 * With object default:
 * ```tsx
 * interface Props {
 *   design?: string; // JSON object string
 * }
 *
 * function Component({ design }: Props) {
 *   const settings = jsonParse(design, { theme: 'light' });
 *   return <div className={settings.theme}>Content</div>;
 * }
 * ```
 */
export function jsonParse<T = unknown>(
  jsonString: string | undefined | null,
  defaultValue: T = [] as T
): T {
  // Handle null/undefined
  if (jsonString == null) {
    return defaultValue;
  }

  // At build time, if we receive a Liquid expression string, return the default
  // This prevents JSON.parse() from failing on strings like "{{ data | json | escape }}"
  if (isLiquidExpression(jsonString)) {
    return defaultValue;
  }

  // At runtime, parse the actual JSON string
  try {
    return JSON.parse(jsonString) as T;
  } catch {
    // If parsing fails, return the default value
    return defaultValue;
  }
}
