# Entry Points

## Overview

Preliquify scans entry points and compiles only files using `createLiquidSnippet`. Other files are bundled as library components.

## Configuration

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

## File Detection

**Compiled:**
```tsx
export default createLiquidSnippet(MyComponent, {...});
```

**Not compiled:**
```tsx
export function MyComponent() { return <div>...</div>; }
```

## Build Output

```bash
📊 Scan Results:
   Total files: 45
   Snippet files: 5    # Compiled to .liquid + .bundle.js
   Library files: 40   # Bundled into snippets
```

## Validation

Config validates but scan is source of truth. Warnings when:
- Config lists file without `createLiquidSnippet` → not compiled
- Scan finds file not in config → still compiled

## Organization

```
src/
  snippets/         # Scanned - compile to .liquid
  components/       # Not scanned - bundle only
  hooks/            # Not scanned - bundle only
```

```typescript
export default {
  entryPoint: './src/snippets',  // Only scan this
};
```
