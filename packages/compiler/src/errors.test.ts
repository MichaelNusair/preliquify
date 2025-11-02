import { describe, it, expect } from "vitest";
import {
  PreliquifyError,
  CompilationError,
  ConfigError,
  FileSystemError,
  ComponentError,
  HydrationError,
  formatError,
  createErrorReporter,
} from "./errors";

describe("Error Classes", () => {
  describe("PreliquifyError", () => {
    it("should create base error with code and details", () => {
      const error = new PreliquifyError("Test error", "TEST_CODE", {
        foo: "bar",
      });
      expect(error.message).toBe("Test error");
      expect(error.code).toBe("TEST_CODE");
      expect(error.details).toEqual({ foo: "bar" });
      expect(error.name).toBe("PreliquifyError");
    });
  });

  describe("CompilationError", () => {
    it("should create compilation error with file info", () => {
      const originalError = new Error("Syntax error");
      const error = new CompilationError(
        "Failed to compile",
        "/path/to/file.tsx",
        originalError,
        { line: 10 }
      );

      expect(error.message).toBe("Failed to compile");
      expect(error.file).toBe("/path/to/file.tsx");
      expect(error.originalError).toBe(originalError);
      expect(error.code).toBe("COMPILATION_ERROR");
      expect(error.details).toEqual({ line: 10 });
    });
  });

  describe("ConfigError", () => {
    it("should create config error", () => {
      const error = new ConfigError("Invalid config", { field: "srcDir" });
      expect(error.message).toBe("Invalid config");
      expect(error.code).toBe("CONFIG_ERROR");
      expect(error.details).toEqual({ field: "srcDir" });
    });
  });

  describe("FileSystemError", () => {
    it("should create filesystem error with path", () => {
      const originalError = new Error("ENOENT");
      const error = new FileSystemError(
        "File not found",
        "/missing/file",
        originalError
      );

      expect(error.message).toBe("File not found");
      expect(error.path).toBe("/missing/file");
      expect(error.code).toBe("FILESYSTEM_ERROR");
      expect(error.details).toHaveProperty("originalError");
    });
  });

  describe("ComponentError", () => {
    it("should create component error", () => {
      const error = new ComponentError(
        "Invalid component",
        "/src/Component.tsx",
        { reason: "No default export" }
      );

      expect(error.message).toBe("Invalid component");
      expect(error.componentPath).toBe("/src/Component.tsx");
      expect(error.code).toBe("COMPONENT_ERROR");
      expect(error.details).toEqual({
        componentPath: "/src/Component.tsx",
        reason: "No default export",
      });
    });
  });

  describe("HydrationError", () => {
    it("should create hydration error", () => {
      const error = new HydrationError("Hydration failed", "CartDrawer", {
        reason: "Component not found",
      });

      expect(error.message).toBe("Hydration failed");
      expect(error.componentName).toBe("CartDrawer");
      expect(error.code).toBe("HYDRATION_ERROR");
      expect(error.details).toEqual({
        componentName: "CartDrawer",
        reason: "Component not found",
      });
    });
  });
});

describe("formatError", () => {
  it("should format CompilationError nicely", () => {
    const originalError = new Error("Syntax error");
    originalError.stack = `Error: Syntax error
    at parseComponent (file.ts:10:5)
    at compile (compiler.ts:20:10)
    at build (build.ts:30:15)`;

    const error = new CompilationError(
      "Failed to parse JSX",
      "/src/Component.tsx",
      originalError
    );

    const formatted = formatError(error);
    expect(formatted).toContain("❌ Compilation Error in /src/Component.tsx");
    expect(formatted).toContain("Failed to parse JSX");
    expect(formatted).toContain("at parseComponent");
  });

  it("should format ConfigError", () => {
    const error = new ConfigError("srcDir not found", {
      provided: "./missing",
    });
    const formatted = formatError(error);

    expect(formatted).toContain("❌ Configuration Error");
    expect(formatted).toContain("srcDir not found");
    expect(formatted).toContain('"provided": "./missing"');
  });

  it("should format FileSystemError", () => {
    const error = new FileSystemError(
      "Cannot read directory",
      "/src/components"
    );
    const formatted = formatError(error);

    expect(formatted).toContain("❌ File System Error");
    expect(formatted).toContain("Path: /src/components");
    expect(formatted).toContain("Cannot read directory");
  });

  it("should format generic PreliquifyError", () => {
    const error = new PreliquifyError("Something went wrong", "GENERIC_ERROR", {
      debug: true,
    });
    const formatted = formatError(error);

    expect(formatted).toContain("❌ PreliquifyError [GENERIC_ERROR]");
    expect(formatted).toContain("Something went wrong");
    expect(formatted).toContain('"debug": true');
  });

  it("should format unknown errors", () => {
    const error = new Error("Unknown error");
    const formatted = formatError(error);

    expect(formatted).toBe("\n❌ Error: Unknown error");
  });
});

describe("createErrorReporter", () => {
  it("should collect and report errors", () => {
    const reporter = createErrorReporter();
    const error1 = new Error("First error");
    const error2 = new Error("Second error");

    expect(reporter.hasErrors()).toBe(false);

    reporter.report(error1);
    expect(reporter.hasErrors()).toBe(true);
    expect(reporter.getErrors()).toHaveLength(1);

    reporter.report(error2);
    expect(reporter.getErrors()).toHaveLength(2);
    expect(reporter.getErrors()).toEqual([error1, error2]);
  });

  it("should clear errors", () => {
    const reporter = createErrorReporter();
    reporter.report(new Error("Test"));

    expect(reporter.hasErrors()).toBe(true);
    reporter.clear();
    expect(reporter.hasErrors()).toBe(false);
    expect(reporter.getErrors()).toHaveLength(0);
  });

  it("should throw aggregated error when errors exist", () => {
    const reporter = createErrorReporter();
    reporter.report(new PreliquifyError("Error 1", "CODE1"));
    reporter.report(new PreliquifyError("Error 2", "CODE2"));

    expect(() => reporter.throwIfErrors()).toThrow(
      "Build failed with 2 error(s)"
    );

    try {
      reporter.throwIfErrors();
    } catch (error: any) {
      expect(error).toBeInstanceOf(PreliquifyError);
      expect(error.code).toBe("BUILD_FAILED");
      expect(error.details.errors).toHaveLength(2);
      expect(error.details.errors[0]).toEqual({
        message: "Error 1",
        code: "CODE1",
      });
    }
  });

  it("should not throw when no errors", () => {
    const reporter = createErrorReporter();
    expect(() => reporter.throwIfErrors()).not.toThrow();
  });
});
