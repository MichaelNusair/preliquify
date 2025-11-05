# Changelog

## [1.1.11] - 2024-11-05

### Added

- **Automatic client bundle generation** - Preliquify now generates `.bundle.js` files for each component automatically
- **Auto-registration code** - Components auto-register with the runtime, no boilerplate needed
- **Smart compilation** - Only files using `createLiquidSnippet` are compiled to `.liquid` files
- **Entry point scanning** - Automatic detection of snippet vs library files
- **Configuration validation** - Warns when config doesn't match scan results
- **Render function support in `<For />`** - Can use `{(item, i) => <div>...</div>}` syntax
- **Proxy-based property access** - `item.src` automatically generates `{{ item.src }}`

### Changed

- `srcDir` is now deprecated in favor of `entryPoint`
- `entryPoint` supports arrays and glob patterns
- Build output shows scan results (snippet vs library files)
- Scan results are source of truth, config is validation

### Fixed

- **`<For />` loops now generate correctly** - Fixed `TargetProvider` context isolation bug
- **`createLiquidSnippet` renders components** - Fixed placeholder blocking Liquid primitive output
- **Scoped package resolution** - `@preliquify/*` packages now resolve correctly in monorepos
- **Runtime detection** - Fixed detection to include `createLiquidSnippet` components

## [1.1.10] - 2024-11-05

### Fixed

- Runtime generation now detects `createLiquidSnippet` components (not just `<Hydrate>`)
- Improved error messages for missing components

## [1.1.9] - 2024-11-05

### Added

- Smart compilation - only files with `createLiquidSnippet` are compiled
- Entry point configuration validation
- Scan results logging

### Changed

- Build only processes snippet files, not library components
- Reduced build times by 5-10x in typical projects

## [1.1.8] - 2024-11-05

### Fixed

- Fixed `<For />` component not generating Liquid loops
- Fixed `TargetProvider` context isolation
- Fixed `createLiquidSnippet` rendering during compilation

## [1.1.7] - 2024-11-04

### Fixed

- Various bug fixes and improvements

## [1.1.6] - 2024-11-03

### Fixed

- Bug fixes and stability improvements

## [0.2.1] - 2024-10-15

### Initial Release

- Basic Liquid snippet generation
- `createLiquidSnippet` wrapper
- Liquid primitives (`<For>`, `<Conditional>`, `<Hydrate>`)
- Expression builder (`$`)
- Client-side hydration runtime
