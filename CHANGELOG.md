# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **Schema Fragment System**: Reusable Liquid schema fragments with `FRAGMENT.name` syntax
  - Default fragments: `color-scheme`, `section-spacing`, `section-visibility`, `animation`, `heading`, `media-settings`, `button`, `custom-css`
  - Custom fragment support via `fragmentsDir` configuration
- **Theme Style Analyzer**: Extract existing theme CSS for seamless integration
  - Extracts CSS variables, keyframes, font-faces, and theme selectors
  - Optional style scoping to prevent conflicts
- **Setup Command**: `preliquify init` to quickly set up a Shopify theme
  - Auto-detects Shopify theme structure
  - Creates config files, example components, and schema fragments
  - Updates `theme.liquid` with runtime scripts
- **GitHub Actions CI/CD**: Automated testing, linting, and publishing workflows
- **Cross-platform dev scripts**: `start-dev.sh` and `start-dev.ps1`

### Changed
- CLI now supports `init` command in addition to `build`
- Improved help output with better command documentation

## [2.0.0] - 2026-XX-XX

### Added
- Initial public release
- Preact component compilation to Liquid templates
- Expression builder (`$`) for dual-target code
- Primitives: `<For>`, `<Conditional>`, `<Choose>`, `<Target>`, `<Hydrate>`
- Enhanced expressions (`$enhanced`) for Liquid filters
- Client-side hydration with automatic component registration
- Tailwind CSS support
- Watch mode for development
- Monorepo structure with `@preliquify/core`, `@preliquify/compiler`, `@preliquify/cli`, `@preliquify/preact`

---

## Migration Guide

### From reactpify

If you're migrating from `reactpifyjs`, here's what you need to know:

1. **Install Preliquify**:
   ```bash
   npm uninstall reactpifyjs
   npm install -D @preliquify/cli @preliquify/preact
   ```

2. **Initialize your project**:
   ```bash
   npx preliquify init
   ```

3. **Key differences**:
   - Use `createLiquidSnippet()` instead of component registration
   - Use Preliquify primitives (`<For>`, `<Conditional>`) for Liquid data
   - Expression builder `$` provides type-safe Liquid expressions
   - Uses Preact instead of React (smaller bundle, same API)

4. **Feature parity**: Preliquify includes all reactpify features plus:
   - Type-safe expression system
   - Better Liquid code generation
   - More flexible primitives
   - Enhanced Liquid filter support

See the [README](./README.md) for full documentation.

