import { describe, it, expect } from "vitest";
import { $$ } from "./expr-enhanced";

describe("Enhanced Expression System ($$)", () => {
  describe("Comparison operators", () => {
    it("should handle not equal", () => {
      const expr = $$.neq($$.var("status"), $$.lit("active"));
      expect(expr.toLiquid()).toBe('status != "active"');
      expect(expr.toClient()({ status: "inactive" })).toBe(true);
      expect(expr.toClient()({ status: "active" })).toBe(false);
    });

    it("should handle greater than", () => {
      const expr = $$.gt($$.var("price"), $$.lit(100));
      expect(expr.toLiquid()).toBe("price > 100");
      expect(expr.toClient()({ price: 150 })).toBe(true);
      expect(expr.toClient()({ price: 50 })).toBe(false);
    });

    it("should handle less than or equal", () => {
      const expr = $$.lte($$.var("stock"), $$.lit(10));
      expect(expr.toLiquid()).toBe("stock <= 10");
      expect(expr.toClient()({ stock: 5 })).toBe(true);
      expect(expr.toClient()({ stock: 10 })).toBe(true);
      expect(expr.toClient()({ stock: 15 })).toBe(false);
    });
  });

  describe("Null/undefined checks", () => {
    it("should check for nil values", () => {
      const expr = $$.isNil($$.var("optional"));
      expect(expr.toLiquid()).toBe("optional == nil");
      expect(expr.toClient()({ optional: null })).toBe(true);
      expect(expr.toClient()({ optional: undefined })).toBe(true);
      expect(expr.toClient()({ optional: "" })).toBe(false);
      expect(expr.toClient()({ optional: 0 })).toBe(false);
    });

    it("should check for blank values", () => {
      const expr = $$.isBlank($$.var("value"));
      expect(expr.toLiquid()).toBe("value == blank");
      expect(expr.toClient()({ value: null })).toBe(true);
      expect(expr.toClient()({ value: undefined })).toBe(true);
      expect(expr.toClient()({ value: "" })).toBe(true);
      expect(expr.toClient()({ value: [] })).toBe(true);
      expect(expr.toClient()({ value: {} })).toBe(true);
      expect(expr.toClient()({ value: "text" })).toBe(false);
      expect(expr.toClient()({ value: [1] })).toBe(false);
    });
  });

  describe("Math operations", () => {
    it("should handle addition", () => {
      const expr = $$.plus($$.var("quantity"), $$.lit(5));
      expect(expr.toLiquid()).toBe("quantity | plus: 5");
      expect(expr.toClient()({ quantity: 10 })).toBe(15);
    });

    it("should handle multiplication", () => {
      const expr = $$.times($$.var("price"), $$.var("quantity"));
      expect(expr.toLiquid()).toBe("price | times: quantity");
      expect(expr.toClient()({ price: 20, quantity: 3 })).toBe(60);
    });

    it("should handle modulo", () => {
      const expr = $$.modulo($$.var("index"), $$.lit(3));
      expect(expr.toLiquid()).toBe("index | modulo: 3");
      expect(expr.toClient()({ index: 10 })).toBe(1);
    });

    it("should handle absolute value", () => {
      const expr = $$.abs($$.var("diff"));
      expect(expr.toLiquid()).toBe("diff | abs");
      expect(expr.toClient()({ diff: -15 })).toBe(15);
      expect(expr.toClient()({ diff: 15 })).toBe(15);
    });

    it("should handle rounding", () => {
      const expr = $$.round($$.var("price"), $$.lit(2));
      expect(expr.toLiquid()).toBe("price | round: 2");
      expect(expr.toClient()({ price: 3.14159 })).toBe(3.14);
    });
  });

  describe("String operations", () => {
    it("should handle capitalize", () => {
      const expr = $$.capitalize($$.var("name"));
      expect(expr.toLiquid()).toBe("name | capitalize");
      expect(expr.toClient()({ name: "john doe" })).toBe("John doe");
    });

    it("should handle truncate", () => {
      const expr = $$.truncate($$.var("description"), $$.lit(20));
      expect(expr.toLiquid()).toBe("description | truncate: 20");
      expect(
        expr.toClient()({ description: "This is a very long description" })
      ).toBe("This is a very lo...");
    });

    it("should handle replace", () => {
      const expr = $$.replace($$.var("text"), $$.lit(" "), $$.lit("-"));
      expect(expr.toLiquid()).toBe('text | replace: " ", "-"');
      expect(expr.toClient()({ text: "hello world test" })).toBe(
        "hello-world-test"
      );
    });

    it("should handle split", () => {
      const expr = $$.split($$.var("csv"), $$.lit(","));
      expect(expr.toLiquid()).toBe('csv | split: ","');
      expect(expr.toClient()({ csv: "a,b,c" })).toEqual(["a", "b", "c"]);
    });
  });

  describe("Array operations", () => {
    it("should handle sort with property", () => {
      const expr = $$.sort($$.var("products"), $$.lit("price"));
      expect(expr.toLiquid()).toBe('products | sort: "price"');

      const products = [
        { name: "C", price: 30 },
        { name: "A", price: 10 },
        { name: "B", price: 20 },
      ];

      const sorted = expr.toClient()({ products }) as typeof products;
      expect(sorted[0].price).toBe(10);
      expect(sorted[1].price).toBe(20);
      expect(sorted[2].price).toBe(30);
    });

    it("should handle compact", () => {
      const expr = $$.compact($$.var("items"));
      expect(expr.toLiquid()).toBe("items | compact");
      expect(expr.toClient()({ items: [1, null, 2, undefined, 3] })).toEqual([
        1, 2, 3,
      ]);
    });

    it("should handle map", () => {
      const expr = $$.map($$.var("products"), $$.lit("title"));
      expect(expr.toLiquid()).toBe('products | map: "title"');

      const products = [
        { title: "Product A", price: 10 },
        { title: "Product B", price: 20 },
      ];

      expect(expr.toClient()({ products })).toEqual(["Product A", "Product B"]);
    });

    it("should handle where with value", () => {
      const expr = $$.where(
        $$.var("products"),
        $$.lit("available"),
        $$.lit(true)
      );
      expect(expr.toLiquid()).toBe('products | where: "available", true');

      const products = [
        { name: "A", available: true },
        { name: "B", available: false },
        { name: "C", available: true },
      ];

      const filtered = expr.toClient()({ products }) as typeof products;
      expect(filtered).toHaveLength(2);
      expect(filtered[0].name).toBe("A");
      expect(filtered[1].name).toBe("C");
    });

    it("should handle where without value (truthy check)", () => {
      const expr = $$.where($$.var("items"), $$.lit("featured"));
      expect(expr.toLiquid()).toBe('items | where: "featured"');

      const items = [
        { name: "A", featured: true },
        { name: "B", featured: false },
        { name: "C", featured: "yes" },
      ];

      const filtered = expr.toClient()({ items });
      expect(filtered).toHaveLength(2);
    });
  });

  describe("Date operations", () => {
    it("should format dates", () => {
      const expr = $$.date($$.var("created_at"), $$.lit("%Y-%m-%d"));
      expect(expr.toLiquid()).toBe('created_at | date: "%Y-%m-%d"');

      const date = new Date("2026-03-15T10:30:00");
      expect(expr.toClient()({ created_at: date })).toBe("2026-03-15");
    });

    it("should handle date format patterns", () => {
      const expr = $$.date($$.var("date"), $$.lit("%B %d, %Y"));
      const date = new Date("2026-03-15");
      expect(expr.toClient()({ date })).toContain("March");
      expect(expr.toClient()({ date })).toContain("15");
      expect(expr.toClient()({ date })).toContain("2026");
    });
  });

  describe("Shopify-specific filters", () => {
    it("should format money", () => {
      const expr = $$.money($$.var("price"));
      expect(expr.toLiquid()).toBe("price | money");
      expect(expr.toClient()({ price: 1999 })).toBe("$19.99");
      expect(expr.toClient()({ price: 100 })).toBe("$1.00");
    });

    it("should format money without currency", () => {
      const expr = $$.moneyWithoutCurrency($$.var("price"));
      expect(expr.toLiquid()).toBe("price | money_without_currency");
      expect(expr.toClient()({ price: 1999 })).toBe("19.99");
    });

    it("should create handles", () => {
      const expr = $$.handle($$.var("title"));
      expect(expr.toLiquid()).toBe("title | handle");
      expect(expr.toClient()({ title: "Hello World!" })).toBe("hello-world");
      expect(expr.toClient()({ title: "  Test--Product  " })).toBe(
        "test-product"
      );
    });

    it("should pluralize text", () => {
      const expr = $$.pluralize(
        $$.var("count"),
        $$.lit("item"),
        $$.lit("items")
      );
      expect(expr.toLiquid()).toBe('count | pluralize: "item", "items"');
      expect(expr.toClient()({ count: 1 })).toBe("item");
      expect(expr.toClient()({ count: 2 })).toBe("items");
      expect(expr.toClient()({ count: 0 })).toBe("items");
    });
  });

  describe("Default values", () => {
    it("should provide fallback for nil/empty values", () => {
      const expr = $$.default($$.var("name"), $$.lit("Anonymous"));
      expect(expr.toLiquid()).toBe('name | default: "Anonymous"');
      expect(expr.toClient()({ name: null })).toBe("Anonymous");
      expect(expr.toClient()({ name: undefined })).toBe("Anonymous");
      expect(expr.toClient()({ name: "" })).toBe("Anonymous");
      expect(expr.toClient()({ name: "John" })).toBe("John");
    });
  });

  describe("Complex compositions", () => {
    it("should compose multiple operations", () => {
      // Price formatting with fallback
      const priceExpr = $$.money(
        $$.default($$.var("product.price"), $$.lit(0))
      );

      expect(priceExpr.toLiquid()).toBe("product.price | default: 0 | money");
      expect(priceExpr.toClient()({ product: {} })).toBe("$0.00");
      expect(priceExpr.toClient()({ product: { price: 2499 } })).toBe("$24.99");
    });

    it("should filter and sort products", () => {
      // Get available products sorted by price
      const expr = $$.sort(
        $$.where($$.var("products"), $$.lit("available"), $$.lit(true)),
        $$.lit("price")
      );

      const products = [
        { name: "C", price: 30, available: false },
        { name: "B", price: 20, available: true },
        { name: "A", price: 10, available: true },
      ];

      const result = expr.toClient()({ products }) as typeof products;
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe("A");
      expect(result[1].name).toBe("B");
    });
  });
});
