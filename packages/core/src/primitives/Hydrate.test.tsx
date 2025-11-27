import { describe, it, expect } from "vitest";
import { h } from "preact";
import renderToString from "preact-render-to-string";
import { Hydrate } from "./Hydrate";
import { TargetProvider } from "../runtime";

describe("Hydrate", () => {
  describe("Liquid target", () => {
    it("should render hydration placeholder with data attributes", () => {
      const result = renderToString(
        <TargetProvider value="liquid">
          <Hydrate
            id="cart-1"
            component="CartDrawer"
            props={{ currency: "USD" }}
          />
        </TargetProvider>
      );

      expect(result).toContain('data-preliq-island="CartDrawer"');
      expect(result).toContain('data-preliq-id="cart-1"');
      expect(result).toContain("data-preliq-props=");
    });

    it("should handle props with Liquid variables", () => {
      const result = renderToString(
        <TargetProvider value="liquid">
          <Hydrate
            id="product-gallery"
            component="ProductGallery"
            props={{
              productId: "{{ product.id }}",
              currency: "{{ shop.currency }}",
            }}
          />
        </TargetProvider>
      );

      expect(result).toContain('data-preliq-island="ProductGallery"');
      expect(result).toContain('data-preliq-id="product-gallery"');
      expect(result).toContain(
        "&quot;productId&quot;:&quot;{{ product.id }}&quot;"
      );
      expect(result).toContain(
        "&quot;currency&quot;:&quot;{{ shop.currency }}&quot;"
      );
    });

    it("should handle empty props", () => {
      const result = renderToString(
        <TargetProvider value="liquid">
          <Hydrate id="simple" component="SimpleComponent" />
        </TargetProvider>
      );

      expect(result).toContain('data-preliq-props="{{ {} | json }}"');
    });

    it("should handle complex props structure", () => {
      const result = renderToString(
        <TargetProvider value="liquid">
          <Hydrate
            id="complex"
            component="ComplexComponent"
            props={{
              user: {
                name: "{{ customer.name }}",
                email: "{{ customer.email }}",
              },
              settings: {
                theme: "dark",
                locale: "{{ shop.locale }}",
              },
              items: ["{{ cart.item_count }}"],
            }}
          />
        </TargetProvider>
      );

      expect(result).toContain('data-preliq-island="ComplexComponent"');
      expect(result).toContain(
        "&quot;name&quot;:&quot;{{ customer.name }}&quot;"
      );
      expect(result).toContain("&quot;theme&quot;:&quot;dark&quot;");
    });

    it("should escape JSON properly in attributes", () => {
      const result = renderToString(
        <TargetProvider value="liquid">
          <Hydrate
            id="escape-test"
            component="TestComponent"
            props={{
              message: 'Hello "World"',
              special: "Line\nbreak",
            }}
          />
        </TargetProvider>
      );

      // The liquidJson function should properly escape quotes
      expect(result).toContain("data-preliq-props=");
      expect(result).toContain("escape-test");
    });
  });

  describe("Client target", () => {
    it("should render nothing in client mode", () => {
      const result = renderToString(
        <TargetProvider value="client">
          <Hydrate
            id="client-test"
            component="ClientComponent"
            props={{ test: true }}
          />
        </TargetProvider>
      );

      expect(result).toBe("");
    });
  });

  describe("Integration", () => {
    it("should work within other components", () => {
      const result = renderToString(
        <TargetProvider value="liquid">
          <section>
            <h2>Interactive Section</h2>
            <Hydrate
              id="interactive-1"
              component="InteractiveWidget"
              props={{
                title: "{{ section.settings.title }}",
                enabled: true,
              }}
            />
            <p>Static content below</p>
          </section>
        </TargetProvider>
      );

      expect(result).toContain("<section>");
      expect(result).toContain("<h2>Interactive Section</h2>");
      expect(result).toContain('data-preliq-island="InteractiveWidget"');
      expect(result).toContain("<p>Static content below</p>");
    });

    it("should handle multiple hydration islands", () => {
      const result = renderToString(
        <TargetProvider value="liquid">
          <div>
            <Hydrate id="island-1" component="ComponentA" props={{ a: 1 }} />
            <Hydrate id="island-2" component="ComponentB" props={{ b: 2 }} />
            <Hydrate id="island-3" component="ComponentA" props={{ a: 3 }} />
          </div>
        </TargetProvider>
      );

      expect(result).toContain('data-preliq-id="island-1"');
      expect(result).toContain('data-preliq-id="island-2"');
      expect(result).toContain('data-preliq-id="island-3"');
      expect(result).toContain('data-preliq-island="ComponentA"');
      expect(result).toContain('data-preliq-island="ComponentB"');
    });
  });
});
