# Upgrade Guide: Smart Compilation (v1.1.8)

## What's New

Version 1.1.8 introduces **Smart Compilation**: Preliquify now only compiles files that use `createLiquidSnippet`, dramatically reducing build times and eliminating unused `.liquid` files.

### Key Changes

1. **`entryPoint` replaces `srcDir`** (backwards compatible)
2. **Automatic snippet detection** - only files with `createLiquidSnippet` are compiled
3. **Config validation** - warns when config doesn't match scan results
4. **Scan is source of truth** - config serves as documentation/validation

## Migration

### Update Your Config

**Before (still works, but deprecated):**
```typescript
export default {
  srcDir: './src/snippets',
  outLiquidDir: './snippets',
  outClientDir: './assets',
};
```

**After (recommended):**
```typescript
export default {
  entryPoint: './src/snippets',  // Only scans for files with createLiquidSnippet
  outLiquidDir: './snippets',
  outClientDir: './assets',
};
```

You'll see this warning if you use `srcDir`:
```
⚠️  Warning: 'srcDir' is deprecated and will be removed in v2.0.0.
   Please use 'entryPoint' instead.
```

### Organize Your Code (Optional but Recommended)

Separate entry points from library components:

```
src/
  snippets/          # Files with createLiquidSnippet
    ProductCard.tsx  → ProductCard.liquid ✅
    Hero.tsx         → Hero.liquid ✅
  components/        # Reusable components (bundled, not compiled separately)
    ProductImage.tsx
    Gallery.tsx
    Slider.tsx
```

Update your config:
```typescript
export default {
  entryPoint: './src/snippets',  // Only scans this directory
};
```

## What You'll See

### Before (v1.1.7 and earlier)

```
Building...
✅ Successfully compiled 45 component(s)
```

**Output**: 45 `.liquid` files (many unused)

### After (v1.1.8+)

```
🔍 Scanning for Liquid snippets...
✅ Found 5 snippet(s) to compile

✅ Successfully compiled 5 component(s)
```

**Output**: 5 `.liquid` files (only the ones you need)

### With Verbose Mode

```bash
$ pnpm preliquify build --verbose

📊 Scan Results:
   Total files found: 45
   Snippet files (will compile): 5
   Library files (bundle only): 40

✨ Compiling snippets:
   - MediaGalleryWidget.tsx
   - ProductCard.tsx
   - Hero.tsx
   - ChooseModelModal.tsx
   - ProductCardSimple.tsx

📦 Library components (not compiled separately):
   - Gallery.tsx
   - Slider.tsx
   ... (38 more)
```

## Benefits

### Before

- ❌ 45 files compiled → 45 `.liquid` files generated
- ❌ Most `.liquid` files never used by Shopify
- ❌ Slow builds (compiling unnecessary files)
- ❌ Cluttered snippets folder

### After

- ✅ 5 files compiled → 5 `.liquid` files generated
- ✅ Only actual Shopify snippets compiled
- ✅ 9x faster builds (in this example)
- ✅ Clean, organized output

## Configuration Validation

The `entryPoint` config now serves as **validation and documentation**:

### Example: Missing createLiquidSnippet

If you list a file that doesn't use `createLiquidSnippet`:

```typescript
entryPoint: ['./src/ProductCard.tsx']  // But ProductCard.tsx doesn't use createLiquidSnippet
```

**Warning:**
```
⚠️  Configuration Validation Warning:
   The following files are listed in entryPoint but don't use createLiquidSnippet:
   - ProductCard.tsx
   These files will NOT be compiled to .liquid files.
   (Scan results override config - this is just a lint warning)
```

### Example: Unlisted Snippet Found

If a file uses `createLiquidSnippet` but isn't listed:

```typescript
entryPoint: ['./src/ProductCard.tsx']  // But Hero.tsx also uses createLiquidSnippet
```

**Warning:**
```
⚠️  Configuration Validation Warning:
   Found files with createLiquidSnippet that aren't listed in entryPoint:
   - Hero.tsx
   These WILL be compiled (scan finds all snippets).
   Consider adding them to your config for better documentation.
```

## Entry Point Options

```typescript
// Scan a directory
entryPoint: './src/snippets'

// Scan multiple directories
entryPoint: ['./src/snippets', './src/blocks']

// Specific files
entryPoint: ['./src/ProductCard.tsx', './src/Hero.tsx']

// Glob pattern
entryPoint: './src/**/*.snippet.tsx'
```

## Breaking Changes

### None!

This is a **backwards compatible** release:

- ✅ `srcDir` still works (with deprecation warning)
- ✅ All existing configs continue to work
- ✅ Only behavior change: automatic filtering of non-snippet files

## Troubleshooting

### "No files with 'createLiquidSnippet' found"

```
⚠️  No files with 'createLiquidSnippet' found in entry points:
   - ./src/snippets
```

**Solution**: Make sure your snippet files export `createLiquidSnippet`:

```tsx
import { createLiquidSnippet } from '@preliquify/preact';

function MyComponent(props) {
  return <div>...</div>;
}

export default createLiquidSnippet(MyComponent, {...});  // ← Add this!
```

### Library Component Being Compiled

If a file you don't want compiled is generating a `.liquid` file:

1. Remove `createLiquidSnippet` from it
2. Move it outside your `entryPoint` directory
3. Import it into snippets that need it (it will be bundled automatically)

### Snippet Not Being Compiled

If a file with `createLiquidSnippet` isn't compiling:

1. Check it's in a directory covered by your `entryPoint`
2. Verify the import:
   ```tsx
   import { createLiquidSnippet } from '@preliquify/preact';
   ```
3. Make sure it's actually called in the file

## Learn More

- [Entry Points Guide](./docs/entry-points.md) - Detailed documentation
- [Examples](./examples/shopify-theme) - Working examples

## Questions?

Open an issue on GitHub if you have questions or run into problems!

