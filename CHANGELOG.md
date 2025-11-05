# Changelog

## [1.1.11] - 2024-11-05

### Added
- Automatic client bundle generation (`.bundle.js` files)
- Auto-registration code in bundles (handles race conditions)
- Smart compilation (only files with `createLiquidSnippet`)
- Entry point scanning and validation
- Render function support in `<For />` component
- Proxy-based property access in `<For />` (auto-generates Liquid expressions)

### Changed
- `srcDir` deprecated in favor of `entryPoint`
- Scan results are source of truth (config validates)
- Build output shows snippet vs library file counts

### Fixed
- `<For />` loops now generate correctly (TargetProvider context isolation)
- `createLiquidSnippet` now renders components during compilation
- Scoped package resolution in monorepos
- Runtime detection includes `createLiquidSnippet` components

## [1.1.8] - 2024-11-05

### Fixed
- `<For />` component Liquid loop generation
- `TargetProvider` context sharing between compiler and components
- `createLiquidSnippet` rendering during Liquid compilation

## [0.2.1] - 2024-10-15

Initial release.
