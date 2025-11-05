# Entry Points and Smart Compilation

## Overview

Preliquify uses an **intelligent compilation strategy**: only files that use `createLiquidSnippet` are compiled to `.liquid` files. All other files are treated as library components and automatically bundled into the snippets that use them.

This solves the common problem of generating dozens of unused `.liquid` files for every component in your codebase.

## How It Works

### 1. Entry Point Scanning

When you configure an entry point, Preliquify scans for `.tsx` files:

```typescript
// preliquify.config.ts
export default {
  entryPoint: './src/snippets',  // Scans this directory
  outLiquidDir: './snippets',
  outClientDir: './assets',
};
```

### 2. Snippet Detection

Preliquify analyzes each file and detects which ones use `createLiquidSnippet`:

```tsx
// ✅ This WILL be compiled to .liquid
import { createLiquidSnippet } from '@preliquify/preact';

function ProductCard({ product }) {
  return <div>{product.title}</div>;
}

export default createLiquidSnippet(ProductCard, {
  product: 'product'
});
```

```tsx
// ❌ This will NOT be compiled separately
export function ProductImage({ src, alt }) {
  return <img src={src} alt={alt} />;
}
```

### 3. Automatic Bundling

Library components are automatically bundled into snippets that use them:

```tsx
// src/components/ProductImage.tsx (library component)
export function ProductImage({ src }) {
  return <img src={src} />;
}

// src/snippets/ProductCard.tsx (snippet - will be compiled)
import { ProductImage } from '../components/ProductImage';
import { createLiquidSnippet } from '@preliquify/preact';

function ProductCard({ product }) {
  return (
    <div>
      <ProductImage src={product.image} />
      <h3>{product.title}</h3>
    </div>
  );
}

export default createLiquidSnippet(ProductCard, {
  product: 'product'
});
```

**Result**: Only `ProductCard.liquid` is generated. `ProductImage` is bundled into it.

## Entry Point Options

### Directory Scanning

```typescript
// Scan a single directory
entryPoint: './src/snippets'
```

### Multiple Directories

```typescript
// Scan multiple directories
entryPoint: [
  './src/snippets',
  './src/blocks',
  './src/sections'
]
```

### Specific Files

```typescript
// Only compile these files
entryPoint: [
  './src/ProductCard.tsx',
  './src/Hero.tsx',
  './src/MediaGallery.tsx'
]
```

### Glob Patterns

```typescript
// Use glob patterns
entryPoint: './src/**/*.snippet.tsx'
```

## Configuration Validation

The `entryPoint` config serves as **documentation and lint validation**. The actual source of truth is the **scan results**.

### How Validation Works

```typescript
// preliquify.config.ts
export default {
  entryPoint: [
    './src/ProductCard.tsx',  // Listed in config
    './src/Hero.tsx',         // Listed in config
  ]
};
```

**Case 1: File listed but doesn't use createLiquidSnippet**
```
⚠️  Configuration Validation Warning:
   The following files are listed in entryPoint but don't use createLiquidSnippet:
   - ProductCard.tsx
   These files will NOT be compiled to .liquid files.
   (Scan results override config - this is just a lint warning)
```

**Case 2: File uses createLiquidSnippet but not listed**
```
⚠️  Configuration Validation Warning:
   Found files with createLiquidSnippet that aren't listed in entryPoint:
   - MediaGallery.tsx
   These WILL be compiled (scan finds all snippets).
   Consider adding them to your config for better documentation.
```

### Why Scan is Source of Truth

1. **No manual tracking** - You don't need to remember to update config when adding snippets
2. **Automatic discovery** - New snippets are automatically compiled
3. **Safety** - You can't accidentally skip a snippet by forgetting to add it to config
4. **Validation** - Config helps you catch mistakes (e.g., forgetting to add `createLiquidSnippet`)

## Build Output

With verbose mode, you'll see detailed scan results:

```bash
$ pnpm preliquify build --verbose

🔍 Scanning for Liquid snippets...

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
   - SliderLayouts.tsx
   ... (37 more)

✅ Found 5 snippet(s) to compile
```

## Migration Guide

### From srcDir to entryPoint

**Old config:**
```typescript
export default {
  srcDir: './src/snippets',  // ⚠️ Deprecated
};
```

**New config:**
```typescript
export default {
  entryPoint: './src/snippets',  // ✅ Recommended
};
```

You'll see a deprecation warning:
```
⚠️  Warning: 'srcDir' is deprecated and will be removed in v2.0.0.
   Please use 'entryPoint' instead.
```

### Organize Your Code

**Before** (all files compiled):
```
src/
  snippets/
    ProductCard.tsx       → ProductCard.liquid
    ProductImage.tsx      → ProductImage.liquid (unused!)
    ProductPrice.tsx      → ProductPrice.liquid (unused!)
    Gallery.tsx           → Gallery.liquid (unused!)
    Slider.tsx            → Slider.liquid (unused!)
```

**After** (only snippets compiled):
```
src/
  snippets/              # Entry points only
    ProductCard.tsx      → ProductCard.liquid ✅
    MediaGallery.tsx     → MediaGallery.liquid ✅
  components/            # Library components (not in entryPoint)
    ProductImage.tsx     (bundled)
    ProductPrice.tsx     (bundled)
    Gallery.tsx          (bundled)
    Slider.tsx           (bundled)
```

```typescript
// preliquify.config.ts
export default {
  entryPoint: './src/snippets',  // Only scans this directory
};
```

## Best Practices

### 1. Separate Entry Points from Library Code

```
src/
  snippets/      # Only files with createLiquidSnippet
  components/    # Reusable components
  hooks/         # Custom hooks
  utils/         # Utility functions
```

### 2. Use createLiquidSnippet Only for Shopify Snippets

```tsx
// ✅ Good - This is rendered by Shopify
export default createLiquidSnippet(ProductCard, {...});

// ❌ Bad - This is just a component
export function ProductImage() { ... }
export default createLiquidSnippet(ProductImage, {...});  // Unnecessary!
```

### 3. Document Your Entry Points

```typescript
export default {
  // Explicit list helps other developers understand what's compiled
  entryPoint: [
    './src/snippets/ProductCard.tsx',     // Product display
    './src/snippets/MediaGallery.tsx',    // Image galleries
    './src/snippets/ChooseModelModal.tsx' // Modal dialogs
  ]
};
```

## Troubleshooting

### No Files Found

```
⚠️  No files with 'createLiquidSnippet' found in entry points:
   - ./src/snippets

💡 Tip: Only files that call createLiquidSnippet() are compiled to .liquid files.
```

**Solution**: Make sure your entry point files export `createLiquidSnippet`:

```tsx
export default createLiquidSnippet(MyComponent, {...});
```

### File Not Compiling

If a file with `createLiquidSnippet` isn't being compiled:

1. Check it's in a directory covered by your `entryPoint`
2. Verify the import is correct:
   ```tsx
   import { createLiquidSnippet } from '@preliquify/preact';
   // or
   import { createLiquidSnippet } from '@preliquify/core';
   ```
3. Make sure it's actually called in the file

### Too Many Files Compiling

If library components are being compiled:

1. Move them outside your `entryPoint` directories
2. Remove `createLiquidSnippet` from components that don't need to be Shopify snippets

## Summary

- **Smart**: Only compiles files with `createLiquidSnippet`
- **Automatic**: Discovers snippets by scanning, not config
- **Efficient**: No unused `.liquid` files cluttering your theme
- **Validated**: Config helps catch mistakes but scan is source of truth
- **Fast**: Only compiles what's needed (5 files vs 45 files in a typical project)

