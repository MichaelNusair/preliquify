import { h } from "preact";
import { useTarget } from "../runtime.js";

/**
 * Props for the Target component
 */
interface TargetProps {
  /** Content to render when target is "liquid" (build time) */
  liquid: h.JSX.Element | null;
  /** Content to render when target is "client" (runtime) */
  client: h.JSX.Element | null;
}

/**
 * Helper component that abstracts the dual-rendering pattern
 *
 * This component eliminates the need to manually call `useTarget()` and write
 * conditional rendering logic. It automatically renders the appropriate
 * content based on the current render target.
 *
 * @example
 * ```tsx
 * import { Target, For, $ } from '@preliquify/preact';
 *
 * function MyComponent({ gallery }) {
 *   return (
 *     <Target
 *       liquid={
 *         <For each={$.var('gallery')} as="item">
 *           <div>{{ item.title }}</div>
 *         </For>
 *       }
 *       client={
 *         <div>
 *           {gallery.map(item => (
 *             <div key={item.id}>{item.title}</div>
 *           ))}
 *         </div>
 *       }
 *     />
 *   );
 * }
 * ```
 *
 * @example
 * With hooks (hooks are only called in client path, avoiding linting issues):
 * ```tsx
 * function MyComponent({ data }) {
 *   return (
 *     <Target
 *       liquid={
 *         <div>Loading...</div>
 *       }
 *       client={
 *         <ComponentWithHooks data={data} />
 *       }
 *     />
 *   );
 * }
 *
 * function ComponentWithHooks({ data }) {
 *   const [state, setState] = useState(0); // ✅ Safe - only called in client path
 *   return <div>{data.title}</div>;
 * }
 * ```
 *
 * @remarks
 * This component helps avoid:
 * - Manual `useTarget()` calls in every component
 * - Conditional hook calls (which cause linting errors)
 * - Code duplication between liquid and client rendering
 */
export function Target({ liquid, client }: TargetProps) {
  const target = useTarget();
  return target === "liquid" ? liquid : client;
}
