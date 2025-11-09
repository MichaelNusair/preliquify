/** @jsx h */
import { describe, it, expect } from "vitest";
import { h } from "preact";
import renderToString from "preact-render-to-string";
import { Choose } from "./Choose";
import { $ } from "../expr";
import { TargetProvider } from "../runtime";

describe("Choose", () => {
  describe("Liquid target", () => {
    it("should render Liquid case statement", () => {
      const result = renderToString(
        <TargetProvider value="liquid">
          <Choose
            value={$.var("product.type")}
            cases={{
              shirt: <div>This is a shirt</div>,
              pants: <div>These are pants</div>,
            }}
          />
        </TargetProvider>
      );

      expect(result).toBe(
        "{% case product.type %}{% when 'shirt' %}<div>This is a shirt</div>{% when 'pants' %}<div>These are pants</div>{% endcase %}"
      );
    });

    it("should render with default case", () => {
      const result = renderToString(
        <TargetProvider value="liquid">
          <Choose
            value={$.var("product.type")}
            cases={{
              shirt: <div>This is a shirt</div>,
              pants: <div>These are pants</div>,
            }}
            default={<div>Other product type</div>}
          />
        </TargetProvider>
      );

      expect(result).toBe(
        "{% case product.type %}{% when 'shirt' %}<div>This is a shirt</div>{% when 'pants' %}<div>These are pants</div>{% else %}<div>Other product type</div>{% endcase %}"
      );
    });

    it("should handle numeric cases", () => {
      const result = renderToString(
        <TargetProvider value="liquid">
          <Choose
            value={$.var("order.status")}
            cases={{
              1: <span>Pending</span>,
              2: <span>Processing</span>,
              3: <span>Shipped</span>,
            }}
            default={<span>Unknown</span>}
          />
        </TargetProvider>
      );

      expect(result).toBe(
        "{% case order.status %}{% when '1' %}<span>Pending</span>{% when '2' %}<span>Processing</span>{% when '3' %}<span>Shipped</span>{% else %}<span>Unknown</span>{% endcase %}"
      );
    });

    it("should escape single quotes in case keys", () => {
      const result = renderToString(
        <TargetProvider value="liquid">
          <Choose
            value={$.var("product.type")}
            cases={{
              "men's": <div>Men's clothing</div>,
              "women's": <div>Women's clothing</div>,
            }}
          />
        </TargetProvider>
      );

      expect(result).toBe(
        "{% case product.type %}{% when 'men''s' %}<div>Men's clothing</div>{% when 'women''s' %}<div>Women's clothing</div>{% endcase %}"
      );
    });

    it("should handle complex value expressions", () => {
      const result = renderToString(
        <TargetProvider value="liquid">
          <Choose
            value={$.prop(
              $.var("designSettings.desktopSettings"),
              "desktopLayoutType"
            )}
            cases={{
              slider: <div>Slider layout</div>,
              grid: <div>Grid layout</div>,
            }}
          />
        </TargetProvider>
      );

      expect(result).toBe(
        "{% case designSettings.desktopSettings.desktopLayoutType %}{% when 'slider' %}<div>Slider layout</div>{% when 'grid' %}<div>Grid layout</div>{% endcase %}"
      );
    });
  });

  describe("Client target", () => {
    it("should render matching case at runtime", () => {
      const result = renderToString(
        <TargetProvider value="client">
          <Choose
            value={$.lit("shirt")}
            cases={{
              shirt: <div>This is a shirt</div>,
              pants: <div>These are pants</div>,
            }}
          />
        </TargetProvider>
      );

      expect(result).toBe("<div>This is a shirt</div>");
    });

    it("should render default case when no match", () => {
      const result = renderToString(
        <TargetProvider value="client">
          <Choose
            value={$.lit("shoes")}
            cases={{
              shirt: <div>This is a shirt</div>,
              pants: <div>These are pants</div>,
            }}
            default={<div>Other product type</div>}
          />
        </TargetProvider>
      );

      expect(result).toBe("<div>Other product type</div>");
    });

    it("should render null when no match and no default", () => {
      const result = renderToString(
        <TargetProvider value="client">
          <Choose
            value={$.lit("shoes")}
            cases={{
              shirt: <div>This is a shirt</div>,
              pants: <div>These are pants</div>,
            }}
          />
        </TargetProvider>
      );

      expect(result).toBe("");
    });
  });
});
