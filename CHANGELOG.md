# Changelog

## [1.1.15] - 2024-11-05

### Fixed
- Runtime properly exposes `window.__PRELIQUIFY__`
- Self-contained bundles (all dependencies bundled)
- Auto-registration works correctly
- `<For />` loops generate Liquid correctly

### Added
- Automatic client bundle generation
- Auto-registration code
- Smart compilation (only `createLiquidSnippet` files)
- Entry point scanning
- Render function support in `<For />`
