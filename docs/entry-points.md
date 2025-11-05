# Entry Points

## Smart Compilation

Preliquify scans entry points and compiles only files using `createLiquidSnippet`. Other files are treated as library components and bundled into snippets.

## Configuration

```typescript
// preliquify.config.ts
export default {
  entryPoint: './src/snippets',  // Directory, glob, or array
  outLiquidDir: './snippets',
  outClientDir: './assets',
};
```

### Options

```typescript
// Single directory
entryPoint: './src/snippets'

// Multiple directories
entryPoint: ['./src/snippets', './src/blocks']

// Specific files
entryPoint: ['./src/ProductCard.tsx', './src/Hero.tsx']

// Glob pattern
entryPoint: './src/**/*.snippet.tsx'
```

## Detection

**Compiled to .liquid:**
```tsx
export default createLiquidSnippet(MyComponent, {...});
```

**Not compiled (bundled as library):**
```tsx
export function MyComponent() { return <div>...</div>; }
```

## Build Output

```bash
📊 Scan Results:
   Total files found: 45
   Snippet files (will compile): 5
   Library files (bundle only): 40
```

## Validation

Config serves as documentation. Scan is source of truth.

**Warnings when config doesn't match scan:**

```bash
⚠️  Configuration Validation Warning:
   Files listed in entryPoint but don't use createLiquidSnippet:
   - ProductCard.tsx
   These will NOT be compiled.
```

```bash
⚠️  Configuration Validation Warning:
   Found files with createLiquidSnippet not in entryPoint:
   - MediaGallery.tsx
   These WILL be compiled (scan overrides config).
```

## Organization

```
src/
  snippets/              # Entry points - scanned
    MediaGallery.tsx     → .liquid + .bundle.js
    ProductCard.tsx      → .liquid + .bundle.js
    
  components/            # Library - not scanned
    Gallery.tsx          → Bundled into snippets
    Slider.tsx           → Bundled into snippets
```

## Migration

```typescript
// Old (deprecated)
export default {
  srcDir: './src/snippets',  // Still works, shows warning
};

// New
export default {
  entryPoint: './src/snippets',
};
```

## Deprecated

`srcDir` is deprecated and will be removed in v2.0.0. Use `entryPoint` instead.
