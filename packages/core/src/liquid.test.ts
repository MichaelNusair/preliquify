import { describe, it, expect } from "vitest";
import { liquidJson } from "./liquid";

describe("liquidJson", () => {
  it("should convert simple objects to JSON", () => {
    const result = liquidJson({ key: "value" });
    expect(result).toBe('{{ {"key":"value"} | json }}');
  });

  it("should handle nested objects", () => {
    const result = liquidJson({
      user: {
        name: "John",
        settings: {
          theme: "dark",
        },
      },
    });
    expect(result).toBe(
      '{{ {"user":{"name":"John","settings":{"theme":"dark"}}} | json }}'
    );
  });

  it("should preserve Liquid variables in double curly braces", () => {
    const result = liquidJson({
      title: "{{ product.title }}",
      price: "{{ product.price | money }}",
    });
    expect(result).toBe(
      '{{ {"title":"{{ product.title }}","price":"{{ product.price | money }}"} | json }}'
    );
  });

  it("should handle mixed content", () => {
    const result = liquidJson({
      static: "Hello",
      dynamic: "{{ customer.name }}",
      number: 42,
      boolean: true,
    });
    expect(result).toBe(
      '{{ {"static":"Hello","dynamic":"{{ customer.name }}","number":42,"boolean":true} | json }}'
    );
  });

  it("should handle arrays", () => {
    const result = liquidJson({
      items: ["{{ item1 }}", "static", "{{ item2 }}"],
    });
    expect(result).toBe(
      '{{ {"items":["{{ item1 }}","static","{{ item2 }}"]} | json }}'
    );
  });

  it("should handle complex Liquid expressions", () => {
    const result = liquidJson({
      condition: "{% if product.available %}true{% else %}false{% endif %}",
      loop: "{% for item in collection.products %}{{ item.id }}{% endfor %}",
    });
    expect(result).toContain(
      "{% if product.available %}true{% else %}false{% endif %}"
    );
    expect(result).toContain(
      "{% for item in collection.products %}{{ item.id }}{% endfor %}"
    );
  });

  it("should handle null and undefined values", () => {
    const result = liquidJson({
      nullValue: null,
      undefinedValue: undefined,
    });
    expect(result).toBe('{{ {"nullValue":null} | json }}');
  });

  it("should escape quotes properly", () => {
    const result = liquidJson({
      message: 'Hello "World"',
      quote: "It's great",
    });
    expect(result).toContain('"Hello \\"World\\""');
    expect(result).toContain('"It\'s great"');
  });

  it("should handle empty objects and arrays", () => {
    expect(liquidJson({})).toBe("{{ {} | json }}");
    expect(liquidJson({ empty: [] })).toBe('{{ {"empty":[]} | json }}');
  });

  it("should handle Liquid filters in values", () => {
    const result = liquidJson({
      formattedPrice: "{{ product.price | money }}",
      uppercaseTitle: "{{ product.title | upcase }}",
      dateFormatted: '{{ order.created_at | date: "%B %d, %Y" }}',
    });
    expect(result).toContain("{{ product.price | money }}");
    expect(result).toContain("{{ product.title | upcase }}");
    // JSON.stringify escapes quotes, so we need to check for the escaped version
    expect(result).toContain("order.created_at | date:");
    expect(result).toContain("%B %d, %Y");
  });

  it("should handle nested Liquid tags", () => {
    const result = liquidJson({
      complexValue:
        "{% assign x = {{ product.variants.first.price }} %}{{ x | money }}",
    });
    expect(result).toContain(
      "{% assign x = {{ product.variants.first.price }} %}{{ x | money }}"
    );
  });
});
