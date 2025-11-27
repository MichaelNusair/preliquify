import { describe, it, expect } from "vitest";
import { $ } from "./expr";

describe("Expression System ($)", () => {
  describe("$.lit", () => {
    it("should create literal expressions for strings", () => {
      const expr = $.lit("hello");
      expect(expr.toLiquid()).toBe('"hello"');
      expect(expr.toClient()({})).toBe("hello");
    });

    it("should create literal expressions for numbers", () => {
      const expr = $.lit(42);
      expect(expr.toLiquid()).toBe("42");
      expect(expr.toClient()({})).toBe(42);
    });

    it("should create literal expressions for booleans", () => {
      const exprTrue = $.lit(true);
      expect(exprTrue.toLiquid()).toBe("true");
      expect(exprTrue.toClient()({})).toBe(true);

      const exprFalse = $.lit(false);
      expect(exprFalse.toLiquid()).toBe("false");
      expect(exprFalse.toClient()({})).toBe(false);
    });

    it("should create literal expressions for arrays", () => {
      const expr = $.lit(["a", "b", "c"]);
      expect(expr.toLiquid()).toBe('["a","b","c"]');
      expect(expr.toClient()({})).toEqual(["a", "b", "c"]);
    });
  });

  describe("$.var", () => {
    it("should create variable expressions", () => {
      const expr = $.var("product.title");
      expect(expr.toLiquid()).toBe("product.title");
    });

    it("should resolve nested variables on client", () => {
      const expr = $.var("customer.email");
      const context = { customer: { email: "test@example.com" } };
      expect(expr.toClient()(context)).toBe("test@example.com");
    });

    it("should return undefined for missing variables", () => {
      const expr = $.var("missing.property");
      expect(expr.toClient()({})).toBeUndefined();
    });

    it("should handle deep nesting", () => {
      const expr = $.var("a.b.c.d");
      const context = { a: { b: { c: { d: "deep" } } } };
      expect(expr.toClient()(context)).toBe("deep");
    });
  });

  describe("$.not", () => {
    it("should negate boolean expressions", () => {
      const expr = $.not($.lit(true));
      expect(expr.toLiquid()).toBe("not true");
      expect(expr.toClient()({})).toBe(false);
    });

    it("should work with variable expressions", () => {
      const expr = $.not($.var("isActive"));
      expect(expr.toLiquid()).toBe("not isActive");
      expect(expr.toClient()({ isActive: true })).toBe(false);
      expect(expr.toClient()({ isActive: false })).toBe(true);
    });
  });

  describe("$.and", () => {
    it("should create AND expressions", () => {
      const expr = $.and($.lit(true), $.lit(false));
      expect(expr.toLiquid()).toBe("true and false");
      expect(expr.toClient()({})).toBe(false);
    });

    it("should handle multiple conditions correctly", () => {
      const expr = $.and($.var("a"), $.var("b"));
      expect(expr.toLiquid()).toBe("a and b");
      expect(expr.toClient()({ a: true, b: true })).toBe(true);
      expect(expr.toClient()({ a: true, b: false })).toBe(false);
      expect(expr.toClient()({ a: false, b: true })).toBe(false);
    });
  });

  describe("$.or", () => {
    it("should create OR expressions", () => {
      const expr = $.or($.lit(true), $.lit(false));
      expect(expr.toLiquid()).toBe("true or false");
      expect(expr.toClient()({})).toBe(true);
    });

    it("should handle multiple conditions correctly", () => {
      const expr = $.or($.var("a"), $.var("b"));
      expect(expr.toLiquid()).toBe("a or b");
      expect(expr.toClient()({ a: true, b: false })).toBe(true);
      expect(expr.toClient()({ a: false, b: true })).toBe(true);
      expect(expr.toClient()({ a: false, b: false })).toBe(false);
    });
  });

  describe("$.eq", () => {
    it("should create equality expressions", () => {
      const expr = $.eq($.lit(5), $.lit(5));
      expect(expr.toLiquid()).toBe("5 == 5");
      expect(expr.toClient()({})).toBe(true);
    });

    it("should compare variables", () => {
      const expr = $.eq($.var("count"), $.lit(0));
      expect(expr.toLiquid()).toBe("count == 0");
      expect(expr.toClient()({ count: 0 })).toBe(true);
      expect(expr.toClient()({ count: 1 })).toBe(false);
    });
  });

  describe("$.contains", () => {
    it("should create contains expressions", () => {
      const expr = $.contains($.var("tags"), $.lit("sale"));
      expect(expr.toLiquid()).toBe('tags contains "sale"');
    });

    it("should check array containment on client", () => {
      const expr = $.contains($.var("tags"), $.lit("vip"));
      expect(expr.toClient()({ tags: ["customer", "vip", "gold"] })).toBe(true);
      expect(expr.toClient()({ tags: ["customer", "regular"] })).toBe(false);
    });

    it("should handle empty or missing arrays", () => {
      const expr = $.contains($.var("tags"), $.lit("any"));
      expect(expr.toClient()({ tags: [] })).toBe(false);
      expect(expr.toClient()({})).toBe(false);
    });
  });

  describe("Complex expressions", () => {
    it("should compose multiple operations", () => {
      const isVipAndActive = $.and(
        $.contains($.var("customer.tags"), $.lit("vip")),
        $.eq($.var("customer.active"), $.lit(true))
      );

      expect(isVipAndActive.toLiquid()).toBe(
        '(customer.tags contains "vip") and (customer.active == true)'
      );

      const context = {
        customer: {
          tags: ["vip", "gold"],
          active: true,
        },
      };
      expect(isVipAndActive.toClient()(context)).toBe(true);
    });

    it("should handle nested logical operations", () => {
      const complexExpr = $.or(
        $.and($.var("a"), $.var("b")),
        $.and($.var("c"), $.not($.var("d")))
      );

      expect(complexExpr.toLiquid()).toBe(
        "((a) and (b)) or ((c) and ((not d)))"
      );

      expect(
        complexExpr.toClient()({ a: true, b: true, c: false, d: false })
      ).toBe(true);
      expect(
        complexExpr.toClient()({ a: false, b: true, c: true, d: false })
      ).toBe(true);
      expect(
        complexExpr.toClient()({ a: false, b: true, c: false, d: false })
      ).toBe(false);
    });
  });

  describe("$.map", () => {
    it("should map array with simple property extraction", () => {
      const products = $.var("products");
      const titles = $.map(products, (item) => item.var("title"));

      // Should use Liquid's map filter for simple property access
      expect(titles.toLiquid()).toContain("map: 'title'");

      // Should work at runtime
      const context = {
        products: [
          { title: "Product 1", price: 10 },
          { title: "Product 2", price: 20 },
        ],
      };
      const result = titles.toClient()(context);
      expect(result).toEqual(["Product 1", "Product 2"]);
    });

    it("should map array with object transformation at runtime", () => {
      const media = $.var("media");
      const processed = $.map(media, (item) => ({
        src: item.var("src"),
        alt: item.var("alt"),
      }));

      const context = {
        media: [
          { src: "image1.jpg", alt: "Image 1", type: "image" },
          { src: "image2.jpg", alt: "Image 2", type: "image" },
        ],
      };
      const result = processed.toClient()(context);
      expect(result).toEqual([
        { src: "image1.jpg", alt: "Image 1" },
        { src: "image2.jpg", alt: "Image 2" },
      ]);
    });

    it("should generate Liquid code for object transformations", () => {
      const media = $.var("media");
      const processed = $.map(media, (item) => ({
        src: item.var("src"),
        alt: item.var("alt"),
      }));

      const liquid = processed.toLiquid();
      expect(liquid).toContain("for _map_item in media");
      expect(liquid).toContain("_map_result");
    });
  });

  describe("$.filter", () => {
    it("should filter array with simple equality (uses where filter)", () => {
      const media = $.var("media");
      const videos = $.filter(media, (item) =>
        $.eq(item.var("type"), $.lit("video"))
      );

      // Should use Liquid's where filter for simple equality
      const liquid = videos.toLiquid();
      expect(liquid).toContain("where:");

      // Should work at runtime
      const context = {
        media: [
          { type: "video", src: "video1.mp4" },
          { type: "image", src: "image1.jpg" },
          { type: "video", src: "video2.mp4" },
        ],
      };
      const result = videos.toClient()(context);
      expect(result).toEqual([
        { type: "video", src: "video1.mp4" },
        { type: "video", src: "video2.mp4" },
      ]);
    });

    it("should filter array with complex predicate (generates loop)", () => {
      const products = $.var("products");
      // Use $.not with $.eq for a complex predicate (since $.gt is in $enhanced)
      const notCheap = $.filter(products, (item) =>
        $.not($.eq(item.var("price"), $.lit(50)))
      );

      // Should generate loop with conditional for complex predicates
      const liquid = notCheap.toLiquid();
      expect(liquid).toContain("for _filter_item in products");
      expect(liquid).toContain("if");

      // Should work at runtime
      const context = {
        products: [
          { price: 50, name: "Cheap" },
          { price: 150, name: "Expensive" },
          { price: 200, name: "Very Expensive" },
        ],
      };
      const result = notCheap.toClient()(context);
      expect(result).toEqual([
        { price: 150, name: "Expensive" },
        { price: 200, name: "Very Expensive" },
      ]);
    });

    it("should handle empty arrays", () => {
      const products = $.var("products");
      const filtered = $.filter(products, (item) =>
        $.eq(item.var("type"), $.lit("sale"))
      );

      const context = { products: [] };
      const result = filtered.toClient()(context);
      expect(result).toEqual([]);
    });
  });
});
