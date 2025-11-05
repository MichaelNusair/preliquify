# Contributing to Preliquify

Thank you for your interest in contributing to Preliquify! This document provides guidelines and instructions for contributing.

## Code of Conduct

Please be respectful and constructive in all interactions with the community.

## Getting Started

### Prerequisites

- Node.js >= 18.0.0
- pnpm >= 8.0.0

### Development Setup

1. **Fork and clone the repository**

```bash
git clone https://github.com/YOUR_USERNAME/preliquify.git
cd preliquify
```

2. **Install dependencies**

```bash
pnpm install
```

3. **Build all packages**

```bash
pnpm build
```

4. **Run tests**

```bash
pnpm test
```

## Project Structure

```
preliquify/
├── packages/
│   ├── cli/          # CLI tool
│   ├── compiler/     # Core compiler logic
│   ├── core/         # Core primitives and utilities
│   └── preact/       # Preact-specific bindings
├── examples/         # Example projects
├── docs/            # Documentation
└── test/            # Shared test utilities
```

## Development Workflow

### Making Changes

1. **Create a new branch**

```bash
git checkout -b feature/your-feature-name
```

2. **Make your changes**

- Write clear, concise commit messages
- Follow the existing code style
- Add tests for new features
- Update documentation as needed

3. **Run linting and formatting**

```bash
pnpm lint:fix
pnpm format
```

4. **Run tests**

```bash
pnpm test
```

5. **Build the packages**

```bash
pnpm build
```

### Testing Your Changes

For CLI changes, you can test locally using:

```bash
cd examples/shopify-theme
pnpm install
node ../../packages/cli/dist/index.js build --verbose
```

### Code Style

- **TypeScript**: Use TypeScript for all new code
- **Formatting**: We use Prettier for code formatting
- **Linting**: ESLint is configured for code quality
- **Types**: Avoid using `any` when possible, prefer proper typing

### Commit Messages

Use clear and descriptive commit messages:

```
feat: add new feature X
fix: resolve issue with Y
docs: update README with Z
refactor: improve code structure in W
test: add tests for V
chore: update dependencies
```

## Pull Request Process

1. **Update the README** if you've added new features or changed behavior
2. **Update tests** to cover your changes
3. **Ensure all tests pass** and there are no linting errors
4. **Update the CHANGELOG.md** with your changes
5. **Create a Pull Request** with a clear description of your changes

### PR Checklist

- [ ] Code follows the project's style guidelines
- [ ] Tests added/updated and passing
- [ ] Documentation updated if needed
- [ ] CHANGELOG.md updated
- [ ] All CI checks pass

## Reporting Bugs

When reporting bugs, please include:

1. **Description**: Clear description of the bug
2. **Steps to reproduce**: Minimal steps to reproduce the issue
3. **Expected behavior**: What you expected to happen
4. **Actual behavior**: What actually happened
5. **Environment**: 
   - Node.js version
   - pnpm version
   - OS
   - Preliquify version

## Suggesting Enhancements

We welcome feature suggestions! Please:

1. Check if the feature has already been suggested
2. Create an issue with a clear description
3. Explain the use case and benefits
4. Provide examples if possible

## Package Publishing

**Note**: Only maintainers can publish packages.

To publish all packages:

```bash
pnpm publish-all-packages
```

This script will:
1. Build all packages
2. Bump versions
3. Publish to npm
4. Restore workspace dependencies

## Testing

### Running Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test --watch

# Run with coverage
pnpm test:coverage
```

### Writing Tests

- Use Vitest for unit tests
- Place tests alongside the source code (`.test.ts` or `.test.tsx`)
- Test both success and error cases
- Mock external dependencies when appropriate

## Documentation

### Code Documentation

- Add JSDoc comments to all public APIs
- Include parameter descriptions and return types
- Provide examples when helpful

Example:

```typescript
/**
 * Creates a Liquid expression from a variable name
 * @param name - The Liquid variable name (e.g., "product.title")
 * @returns An Expr object that can be used in Liquid primitives
 * @example
 * ```ts
 * const expr = $.var("product.title")
 * <Conditional when={expr}>...</Conditional>
 * ```
 */
export function var(name: string): Expr<any> {
  // ...
}
```

### README and Docs

- Keep the main README up to date
- Add detailed docs in the `docs/` folder for complex features
- Include code examples
- Explain common use cases and patterns

## Questions?

If you have questions, feel free to:

- Open an issue for discussion
- Check existing issues and PRs
- Review the documentation

Thank you for contributing to Preliquify! 🎉

