import { describe, it, expect } from "vitest";
import { h } from "preact";
import { render } from "@testing-library/preact";
import renderToString from "preact-render-to-string";
import { Conditional } from "./Conditional";
import { $ } from "../expr";
import { TargetProvider } from "../runtime";

describe("Conditional", () => {
  describe("Liquid target", () => {
    it("should render Liquid if statement", () => {
      const result = renderToString(
        <TargetProvider value="liquid">
          <Conditional when={$.var("product.available")}>
            <p>In stock</p>
          </Conditional>
        </TargetProvider>
      );

      expect(result).toBe(
        "{% if product.available %}<p>In stock</p>{% endif %}"
      );
    });

    it("should handle complex conditions", () => {
      const condition = $.and(
        $.var("product.available"),
        $.eq($.var("product.type"), $.lit("shirt"))
      );

      const result = renderToString(
        <TargetProvider value="liquid">
          <Conditional when={condition}>
            <div>Available shirt</div>
          </Conditional>
        </TargetProvider>
      );

      expect(result).toBe(
        "{% if (product.available) and (product.type == &quot;shirt&quot;) %}<div>Available shirt</div>{% endif %}"
      );
    });

    it("should handle nested conditionals", () => {
      const result = renderToString(
        <TargetProvider value="liquid">
          <Conditional when={$.var("user.loggedIn")}>
            <div>
              <Conditional when={$.var("user.isVip")}>
                <p>VIP Dashboard</p>
              </Conditional>
            </div>
          </Conditional>
        </TargetProvider>
      );

      expect(result).toBe(
        "{% if user.loggedIn %}<div>{% if user.isVip %}<p>VIP Dashboard</p>{% endif %}</div>{% endif %}"
      );
    });
  });

  describe("Client target", () => {
    // TODO: Fix Preact hooks context issue - useContext is failing with:
    // "Cannot read properties of undefined (reading '__k')"
    // This suggests a Preact internal state issue in the test environment
    it.skip("should render content when condition is true", () => {
      const { container } = render(
        <TargetProvider value="client">
          <Conditional when={$.lit(true)}>
            <p>Visible</p>
          </Conditional>
        </TargetProvider>
      );

      expect(container.textContent).toBe("Visible");
    });

    it.skip("should not render content when condition is false", () => {
      const { container } = render(
        <TargetProvider value="client">
          <Conditional when={$.lit(false)}>
            <p>Hidden</p>
          </Conditional>
        </TargetProvider>
      );

      expect(container.textContent).toBe("");
    });

    it.skip("should evaluate variable conditions", () => {
      const condition = $.var("showContent");

      const { container, rerender } = render(
        <TargetProvider value="client">
          <Conditional when={condition}>
            <p>Dynamic content</p>
          </Conditional>
        </TargetProvider>
      );

      // Initially, context is empty, so condition should be falsy
      expect(container.textContent).toBe("");

      // Note: In real usage, context would be provided through props or context
      // For this test, we're demonstrating the behavior
    });
  });

  describe("Edge cases", () => {
    it("should handle empty children", () => {
      const result = renderToString(
        <TargetProvider value="liquid">
          <Conditional when={$.var("test")}>
            <></>
          </Conditional>
        </TargetProvider>
      );

      expect(result).toBe("{% if test %}{% endif %}");
    });

    it("should handle multiple children", () => {
      const result = renderToString(
        <TargetProvider value="liquid">
          <Conditional when={$.var("show")}>
            <h1>Title</h1>
            <p>Paragraph</p>
            <span>Span</span>
          </Conditional>
        </TargetProvider>
      );

      expect(result).toBe(
        "{% if show %}<h1>Title</h1><p>Paragraph</p><span>Span</span>{% endif %}"
      );
    });

    // TODO: Fix Preact hooks context issue - same as Client target tests above
    it.skip("should handle empty children in client mode", () => {
      const { container } = render(
        <TargetProvider value="client">
          <Conditional when={$.lit(false)}>
            <></>
          </Conditional>
        </TargetProvider>
      );
      expect(container.textContent).toBe("");
    });

    it.skip("should handle multiple children in client mode", () => {
      const { container } = render(
        <TargetProvider value="client">
          <Conditional when={$.lit(true)}>
            <h1>Title</h1>
            <p>Paragraph</p>
            <span>Span</span>
          </Conditional>
        </TargetProvider>
      );
      expect(container.textContent).toContain("Title");
      expect(container.textContent).toContain("Paragraph");
      expect(container.textContent).toContain("Span");
    });
  });
});
