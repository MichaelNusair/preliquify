# Changelog

## [1.1.16] - 2024-11-05

### Fixed
- Runtime uses `window.__PRELIQUIFY__` consistently (not mangled to `window.e`)
- Fallback runtime updated to use `__PRELIQUIFY__`
- Auto-registration now works correctly

## [1.1.15] - 2024-11-05

### Fixed
- Runtime properly exposes `window.__PRELIQUIFY__` with all methods
- Self-contained bundles (all dependencies bundled)
- `<For />` loops generate Liquid correctly
