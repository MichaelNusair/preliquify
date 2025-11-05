# Version 1.1.11 - Feature Summary

## New Features

### Auto-Bundling
- Generates `.bundle.js` files automatically
- One command: `preliquify build`
- No Vite/Rollup needed

### Auto-Registration
- Components self-register with runtime
- Handles race conditions
- No manual registration code

### Smart Compilation
- Only compiles files with `createLiquidSnippet`
- Library components auto-bundled
- 5-10x faster builds

### Entry Points
- `entryPoint` config (replaces `srcDir`)
- Supports arrays and globs
- Automatic snippet detection

## Build Output

**Before (v1.1.7):**
```
45 files scanned → 45 .liquid files generated
Manual Vite build required
Manual registration code needed
```

**After (v1.1.11):**
```
45 files scanned → 5 .liquid files + 5 .bundle.js files
Everything automatic
No manual code
```

## Configuration

```typescript
// preliquify.config.ts
export default {
  entryPoint: './src/snippets',      // New: smart scanning
  generateClientBundles: true,       // New: auto-bundling
  minify: true,                      // New: minification
  outLiquidDir: './snippets',
  outClientDir: './assets',
};
```

## Files Generated

```
snippets/
  MediaGallery-prlq.liquid           # SSR template
  
assets/
  preliquify-prlq.runtime.js         # Hydration framework (shared)
  MediaGallery-prlq.bundle.js        # Component + auto-registration
```

## Theme Integration

```liquid
<!-- theme.liquid -->
<script src="https://unpkg.com/preact@10/dist/preact.umd.js"></script>
<script>window.preact = { h: preactUmd.h, render: preactUmd.render };</script>
<script src="{{ 'preliquify-prlq.runtime.js' | asset_url }}" defer></script>
<script src="{{ 'MediaGallery-prlq.bundle.js' | asset_url }}" defer></script>
```

## Bundle Sizes

- Runtime: ~4 KB (shared)
- Per component: ~1-2 KB
- Preact: ~4 KB (CDN)
- Total: ~10-15 KB for typical page

## Migration

**From v1.1.7:**
1. Update `srcDir` → `entryPoint` in config
2. Remove Vite/Rollup configuration
3. Delete manual registration code
4. Rebuild with `preliquify build`

## Breaking Changes

None. Fully backwards compatible with deprecation warnings.
