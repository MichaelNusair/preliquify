# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Comprehensive ESLint configuration
- Prettier configuration
- EditorConfig for consistent coding styles
- Enhanced package.json metadata (keywords, engines, descriptions)
- CONTRIBUTING.md with development guidelines
- CHANGELOG.md for tracking changes
- Better error messages for Liquid expression errors

### Changed
- Updated all package.json files with better descriptions and keywords
- Improved npm discoverability with proper metadata

### Fixed
- Various type safety improvements

## [1.0.0] - Previous Release

### Features
- CLI tool for building Liquid snippets from React/Preact components
- Core primitives: `Conditional`, `For`, `Choose`, `Hydrate`
- Liquid expression builder with `$` helper
- `createLiquidSnippet` for mapping props to Liquid variables
- SSR compatibility with browser API polyfills
- Watch mode for development
- Client-side hydration runtime
- TypeScript support
- Comprehensive error handling

### Packages
- `@preliquify/cli`: Command-line interface
- `@preliquify/compiler`: Core compilation logic
- `@preliquify/core`: Primitives and utilities
- `@preliquify/preact`: Preact bindings

## Release Categories

- **Added**: New features
- **Changed**: Changes to existing functionality
- **Deprecated**: Soon-to-be removed features
- **Removed**: Removed features
- **Fixed**: Bug fixes
- **Security**: Vulnerability fixes

