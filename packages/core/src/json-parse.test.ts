import { describe, it, expect } from "vitest";
import { jsonParse } from "./json-parse";

describe("jsonParse", () => {
  describe("with valid JSON strings", () => {
    it("should parse array JSON strings", () => {
      const result = jsonParse('[{"id": 1, "name": "test"}]');
      expect(result).toEqual([{ id: 1, name: "test" }]);
    });

    it("should parse object JSON strings", () => {
      const result = jsonParse('{"theme": "dark", "size": "large"}');
      expect(result).toEqual({ theme: "dark", size: "large" });
    });

    it("should parse primitive JSON values", () => {
      expect(jsonParse('"hello"')).toBe("hello");
      expect(jsonParse("42")).toBe(42);
      expect(jsonParse("true")).toBe(true);
      expect(jsonParse("null")).toBe(null);
    });
  });

  describe("with Liquid expression strings", () => {
    it("should return default value for Liquid variable expressions", () => {
      const result = jsonParse("{{ data | json | escape }}", []);
      expect(result).toEqual([]);
    });

    it("should return default value for Liquid tag expressions", () => {
      const result = jsonParse("{% assign parsed = data | json %}", {});
      expect(result).toEqual({});
    });

    it("should return custom default value", () => {
      const customDefault = { theme: "light", size: "medium" };
      const result = jsonParse("{{ design | json | escape }}", customDefault);
      expect(result).toEqual(customDefault);
    });
  });

  describe("with null/undefined", () => {
    it("should return default value for undefined", () => {
      const result = jsonParse(undefined, []);
      expect(result).toEqual([]);
    });

    it("should return default value for null", () => {
      const result = jsonParse(null, []);
      expect(result).toEqual([]);
    });

    it("should return custom default for undefined", () => {
      const customDefault = { empty: true };
      const result = jsonParse(undefined, customDefault);
      expect(result).toEqual(customDefault);
    });
  });

  describe("with invalid JSON", () => {
    it("should return default value for invalid JSON", () => {
      const result = jsonParse("not valid json", []);
      expect(result).toEqual([]);
    });

    it("should return custom default for invalid JSON", () => {
      const customDefault = { error: true };
      const result = jsonParse("{ invalid json }", customDefault);
      expect(result).toEqual(customDefault);
    });
  });

  describe("type safety", () => {
    it("should preserve array type with generic", () => {
      interface Item {
        id: number;
        name: string;
      }
      const result = jsonParse<Item[]>('[{"id": 1, "name": "test"}]', []);
      expect(result).toEqual([{ id: 1, name: "test" }]);
      expect(Array.isArray(result)).toBe(true);
    });

    it("should preserve object type with generic", () => {
      interface Settings {
        theme: string;
        size: string;
      }
      const defaultSettings: Settings = { theme: "light", size: "medium" };
      const result = jsonParse<Settings>(
        '{"theme": "dark", "size": "large"}',
        defaultSettings
      );
      expect(result).toEqual({ theme: "dark", size: "large" });
    });
  });

  describe("real-world scenarios", () => {
    it("should handle media gallery JSON string", () => {
      const mediaJSON = '[{"id": 1, "url": "image.jpg", "alt": "Product"}]';
      const result = jsonParse(mediaJSON, []);
      expect(result).toEqual([{ id: 1, url: "image.jpg", alt: "Product" }]);
    });

    it("should handle design settings JSON string", () => {
      const designJSON = '{"theme": "dark", "layout": "grid"}';
      const result = jsonParse(designJSON, { theme: "light" });
      expect(result).toEqual({ theme: "dark", layout: "grid" });
    });

    it("should handle build-time Liquid expression (returns default)", () => {
      // Simulates what happens at build time when prop is a Liquid expression
      const liquidExpr = "{{ mediaCSR | json | escape }}";
      const result = jsonParse(liquidExpr, []);
      expect(result).toEqual([]);
    });
  });
});
