# Changelog

## [1.1.11] - 2024-11-05

### Features
- Automatic client bundle generation with auto-registration
- Smart compilation (only files with `createLiquidSnippet`)
- Entry point scanning and validation
- Render function support in `<For />` component
- Proxy-based property access for Liquid expressions

### Configuration
- `entryPoint` config (replaces `srcDir`)
- `generateClientBundles` option (default: true)
- `minify` option (default: true)

### Fixes
- `<For />` loops generate correctly
- `TargetProvider` context isolation
- `createLiquidSnippet` renders during compilation
- Runtime detection includes all hydration scenarios
