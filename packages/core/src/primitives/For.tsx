import { h, Fragment } from "preact";
import { useTarget } from "../runtime.js";
import type { ForProps } from "../types.js";

/**
 * Loop primitive that compiles to Liquid `{% for %}` loops
 *
 * Iterates over collections in both Liquid (at build time) and at runtime.
 * Use this instead of JavaScript's `.map()` when working with Liquid collections.
 *
 * @template T - The type of items in the collection
 * @param props - The loop props
 * @param props.each - Expression that evaluates to an array/collection
 * @param props.as - Variable name for the current item in the loop
 * @param props.children - Content to render for each item
 *
 * @example
 * ```tsx
 * import { For, $ } from '@preliquify/preact';
 *
 * // Loop over products
 * <For each={$.var("products")} as="product">
 *   <div>
 *     <h3>{{ product.title }}</h3>
 *     <p>{{ product.price }}</p>
 *   </div>
 * </For>
 *
 * // Loop over collection products
 * <For each={$.var("collections.frontpage.products")} as="p">
 *   <ProductCard product={p} />
 * </For>
 *
 * // Loop with Liquid variable access
 * <For each={$.var("blog.articles")} as="article">
 *   <article>
 *     <h2>{{ article.title }}</h2>
 *     <div>{{ article.content }}</div>
 *   </article>
 * </For>
 * ```
 *
 * @remarks
 * Compiles to:
 * ```liquid
 * {% for item in collection %}
 *   <!-- children -->
 * {% endfor %}
 * ```
 *
 * Inside the loop, you can access special Liquid variables like:
 * - `forloop.index` - Current iteration (1-indexed)
 * - `forloop.first` - True if first iteration
 * - `forloop.last` - True if last iteration
 */
export function For<T>(props: ForProps<T>) {
  const target = useTarget();
  if (target === "liquid") {
    const coll = props.each.toLiquid();
    return (
      <Fragment>
        {`{% for ${props.as} in ${coll} %}`}
        {props.children}
        {`{% endfor %}`}
      </Fragment>
    );
  }

  const list = props.each.toClient()({}) ?? [];
  return (
    <Fragment>{(list as unknown[]).map((_it, _i) => props.children)}</Fragment>
  );
}
