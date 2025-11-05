# Changelog

## [1.1.14] - 2024-11-05

### Fixed
- Global name mismatch: Runtime and bundles now both use `window.__PRELIQUIFY__`
- Self-contained bundles: All dependencies bundled (no `require()` errors in browser)

## [1.1.11] - 2024-11-05

### Added
- Automatic client bundle generation (`.bundle.js` files)
- Auto-registration code in bundles
- Smart compilation (only files with `createLiquidSnippet`)
- Entry point scanning and validation
- Render function support in `<For />` component
- Proxy-based property access (auto-generates Liquid expressions)

### Changed
- `srcDir` deprecated, use `entryPoint`
- Scan results are source of truth
- Build shows snippet vs library counts

### Fixed
- `<For />` loops generate correctly
- `TargetProvider` context isolation
- `createLiquidSnippet` renders during compilation
- Runtime detection includes `createLiquidSnippet`
