import { describe, it, expect } from "vitest";
import renderToString from "preact-render-to-string";
import { For } from "./For";
import { $ } from "../expr";
import { TargetProvider } from "../runtime";

describe("For", () => {
  describe("Liquid target", () => {
    it("should render Liquid for loop", () => {
      const result = renderToString(
        <TargetProvider value="liquid">
          <For each={$.var("collection.products")} as="product">
            <div>{"{{ product.title }}"}</div>
          </For>
        </TargetProvider>
      );

      expect(result).toBe(
        "{% for product in collection.products %}<div>{{ product.title }}</div>{% endfor %}"
      );
    });

    it("should handle nested properties", () => {
      const result = renderToString(
        <TargetProvider value="liquid">
          <For each={$.var("shop.collections.all.products")} as="p">
            <li>{"{{ p.price }}"}</li>
          </For>
        </TargetProvider>
      );

      expect(result).toBe(
        "{% for p in shop.collections.all.products %}<li>{{ p.price }}</li>{% endfor %}"
      );
    });

    it("should handle nested loops", () => {
      const result = renderToString(
        <TargetProvider value="liquid">
          <For each={$.var("collections")} as="collection">
            <div>
              <h2>{"{{ collection.title }}"}</h2>
              <For each={$.var("collection.products")} as="product">
                <p>{"{{ product.title }}"}</p>
              </For>
            </div>
          </For>
        </TargetProvider>
      );

      expect(result).toBe(
        "{% for collection in collections %}<div><h2>{{ collection.title }}</h2>{% for product in collection.products %}<p>{{ product.title }}</p>{% endfor %}</div>{% endfor %}"
      );
    });

    it("should work with literal arrays", () => {
      const result = renderToString(
        <TargetProvider value="liquid">
          <For each={$.lit(["a", "b", "c"])} as="letter">
            <span>{"{{ letter }}"}</span>
          </For>
        </TargetProvider>
      );

      expect(result).toBe(
        "{% for letter in [&quot;a&quot;,&quot;b&quot;,&quot;c&quot;] %}<span>{{ letter }}</span>{% endfor %}"
      );
    });
  });

  describe("Client target", () => {
    it("should render children for each item", () => {
      const result = renderToString(
        <TargetProvider value="client">
          <For each={$.lit(["item1", "item2", "item3"])} as="item">
            <li>Item</li>
          </For>
        </TargetProvider>
      );

      // In client mode, it renders the children once for each item
      expect(result).toBe("<li>Item</li><li>Item</li><li>Item</li>");
    });

    it("should handle empty arrays", () => {
      const result = renderToString(
        <TargetProvider value="client">
          <For each={$.lit([])} as="item">
            <li>Item</li>
          </For>
        </TargetProvider>
      );

      expect(result).toBe("");
    });

    it("should handle null/undefined collections", () => {
      const result = renderToString(
        <TargetProvider value="client">
          <For each={$.var("nonexistent")} as="item">
            <li>Item</li>
          </For>
        </TargetProvider>
      );

      expect(result).toBe("");
    });
  });

  describe("Edge cases", () => {
    it("should handle special characters in loop variable name", () => {
      const result = renderToString(
        <TargetProvider value="liquid">
          <For each={$.var("items")} as="my_item">
            <div>{"{{ my_item.name }}"}</div>
          </For>
        </TargetProvider>
      );

      expect(result).toBe(
        "{% for my_item in items %}<div>{{ my_item.name }}</div>{% endfor %}"
      );
    });

    it("should handle complex children structures", () => {
      const result = renderToString(
        <TargetProvider value="liquid">
          <For each={$.var("products")} as="product">
            <article>
              <h3>{"{{ product.title }}"}</h3>
              <p>Price: {"{{ product.price | money }}"}</p>
              <button>Add to cart</button>
            </article>
          </For>
        </TargetProvider>
      );

      expect(result).toBe(
        "{% for product in products %}<article><h3>{{ product.title }}</h3><p>Price: {{ product.price | money }}</p><button>Add to cart</button></article>{% endfor %}"
      );
    });

    it("should handle fragments as children", () => {
      const result = renderToString(
        <TargetProvider value="liquid">
          <For each={$.var("items")} as="item">
            <>
              <dt>{"{{ item.key }}"}</dt>
              <dd>{"{{ item.value }}"}</dd>
            </>
          </For>
        </TargetProvider>
      );

      expect(result).toBe(
        "{% for item in items %}<dt>{{ item.key }}</dt><dd>{{ item.value }}</dd>{% endfor %}"
      );
    });
  });
});
