export class PreliquifyError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = "PreliquifyError";
  }
}

export class CompilationError extends PreliquifyError {
  constructor(
    message: string,
    public file: string,
    public originalError?: Error,
    details?: any
  ) {
    super(message, "COMPILATION_ERROR", details);
    this.name = "CompilationError";
  }
}

export class ConfigError extends PreliquifyError {
  constructor(message: string, details?: any) {
    super(message, "CONFIG_ERROR", details);
    this.name = "ConfigError";
  }
}

export class FileSystemError extends PreliquifyError {
  constructor(
    message: string,
    public path: string,
    originalError?: Error
  ) {
    super(message, "FILESYSTEM_ERROR", { path, originalError });
    this.name = "FileSystemError";
  }
}

export class ComponentError extends PreliquifyError {
  constructor(
    message: string,
    public componentPath: string,
    details?: any
  ) {
    super(message, "COMPONENT_ERROR", { componentPath, ...details });
    this.name = "ComponentError";
  }
}

export class HydrationError extends PreliquifyError {
  constructor(
    message: string,
    public componentName: string,
    details?: any
  ) {
    super(message, "HYDRATION_ERROR", { componentName, ...details });
    this.name = "HydrationError";
  }
}

export function formatError(error: Error): string {
  if (error instanceof CompilationError) {
    const lines = [`\n❌ Compilation Error in ${error.file}`];
    
    // If this is a Liquid expression error, format it specially
    if (error.details?.type === "liquid_expression_error") {
      lines.push(`   ${error.message.split('\n')[0]}`); // First line only
      lines.push(`\n   ${error.details.hint || ""}`);
      
      // Extract the helpful message from the error
      const messageParts = error.message.split('\n\n');
      if (messageParts.length > 1) {
        lines.push("");
        messageParts.slice(1).forEach((part) => {
          lines.push(`   ${part}`);
        });
      }
    } else {
      lines.push(`   ${error.message}`);
    }

    if (error.originalError && error.originalError.stack && error.details?.type !== "liquid_expression_error") {
      const stackLines = error.originalError.stack.split("\n").slice(1, 4);
      stackLines.forEach((line) => lines.push(`   ${line.trim()}`));
    }

    if (error.details && error.details.type !== "liquid_expression_error") {
      lines.push(`\n   Details: ${JSON.stringify(error.details, null, 2)}`);
    }

    return lines.join("\n");
  }

  if (error instanceof ConfigError) {
    const lines = [`\n❌ Configuration Error`];
    lines.push(`   ${error.message}`);

    if (error.details) {
      lines.push(`\n   Details: ${JSON.stringify(error.details, null, 2)}`);
    }

    return lines.join("\n");
  }

  if (error instanceof FileSystemError) {
    return `\n❌ File System Error\n   Path: ${error.path}\n   ${error.message}`;
  }

  if (error instanceof PreliquifyError) {
    const lines = [`\n❌ ${error.name} [${error.code}]`];
    lines.push(`   ${error.message}`);

    if (error.details) {
      lines.push(`\n   Details: ${JSON.stringify(error.details, null, 2)}`);
    }

    return lines.join("\n");
  }

  return `\n❌ Error: ${error.message}`;
}

export function createErrorReporter(verbose = false) {
  const errors: Error[] = [];

  return {
    report(error: Error) {
      errors.push(error);
      console.error(formatError(error));

      if (verbose && error.stack && !(error instanceof PreliquifyError)) {
        console.error("\nStack trace:", error.stack);
      }
    },

    hasErrors() {
      return errors.length > 0;
    },

    getErrors() {
      return errors;
    },

    clear() {
      errors.length = 0;
    },

    throwIfErrors() {
      if (errors.length > 0) {
        throw new PreliquifyError(
          `Build failed with ${errors.length} error(s)`,
          "BUILD_FAILED",
          {
            errors: errors.map((e) => ({
              message: e.message,
              code: (e as any).code,
            })),
          }
        );
      }
    },
  };
}
