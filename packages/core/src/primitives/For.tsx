import { Fragment, type JSX } from "preact";
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
 * @param props.children - Content to render for each item (JSX or render function)
 *
 * @example
 * ```tsx
 * import { For, $ } from '@preliquify/preact';
 *
 * // Loop over products with direct JSX children
 * <For each={$.var("products")} as="product">
 *   <div>
 *     <h3>{{ product.title }}</h3>
 *     <p>{{ product.price }}</p>
 *   </div>
 * </For>
 *
 * // Loop with render function (use Liquid expressions for properties)
 * <For each={$.var("products")} as="product">
 *   {(product, index) => (
 *     <div>
 *       <img src={"{{ product.image }}"} alt={"{{ product.title }}"} />
 *       <h3>{{ product.title }}</h3>
 *     </div>
 *   )}
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
    // Handle both direct JSX children and render function children
    // For render functions, we need to call it with a mock item to generate the JSX
    // The mock item's properties return Liquid expression strings so they compile correctly
    let childrenContent: JSX.Element | JSX.Element[];
    if (typeof props.children === "function") {
      // Create a mock item proxy that returns Liquid expressions for any property access
      // This allows render functions to access item.src, item.alt, etc. and get
      // "{{ item.src }}", "{{ item.alt }}" which will compile correctly
      const mockItem = new Proxy({} as object, {
        get(_target, prop: string | symbol) {
          if (typeof prop === "string") {
            return `{{ ${props.as}.${prop} }}`;
          }
          return undefined;
        },
      }) as T;
      const mockIndex = 0;
      childrenContent = (
        props.children as (item: T, index: number) => JSX.Element
      )(mockItem, mockIndex);
    } else {
      childrenContent = props.children;
    }
    return (
      <Fragment>
        {`{% for ${props.as} in ${coll} %}`}
        {childrenContent}
        {`{% endfor %}`}
      </Fragment>
    );
  }

  const list = props.each.toClient()({}) ?? [];
  // Handle render function children in client mode
  if (typeof props.children === "function") {
    return (
      <Fragment>
        {(list as unknown[]).map((item, index) =>
          (props.children as (item: T, index: number) => JSX.Element)(
            item as T,
            index
          )
        )}
      </Fragment>
    );
  }
  return (
    <Fragment>{(list as unknown[]).map((_it, _i) => props.children)}</Fragment>
  );
}
