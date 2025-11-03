# SSR Compatibility Guide

This guide explains how to write SSR-safe components for Preliquify and how Preliquify handles server-side rendering (SSR) during the build process.

## Overview

During the Preliquify build process, components are rendered server-side using `preact-render-to-string`. This means any code that accesses browser-only APIs (like `window`, `document`, `localStorage`, etc.) needs to be guarded to prevent build failures.

## Built-in Protections

Preliquify automatically provides polyfills for common browser APIs during SSR:

- ✅ `window` - Mock window object with basic properties
- ✅ `document` - Mock document object with query methods
- ✅ `localStorage` - In-memory Map-based storage during SSR
- ✅ `HTMLElement` - Mock HTMLElement class for `instanceof` checks
- ✅ `Element` - Mock Element class
- ✅ `IntersectionObserver` - Mock observer
- ✅ `requestIdleCallback` - Fallback to setTimeout

## SSR Detection

Preliquify sets a global flag during SSR that you can check:

```typescript
// Check if running in SSR context
if (typeof globalThis.__PRELIQUIFY_SSR__ !== 'undefined' && 
    globalThis.__PRELIQUIFY_SSR__ === true) {
  // Running during SSR
}
```

## Using SSR-Safe Utilities

Preliquify provides SSR-safe utilities in `@preliquify/core`:

```typescript
import { 
  isSSR, 
  isBrowser, 
  getLocalStorage, 
  getWindow, 
  getDocument,
  isHTMLElement,
  parseDataAttribute,
  safeGet
} from '@preliquify/core';
```

### Examples

#### 1. LocalStorage Access

**Before (SSR-unsafe):**
```typescript
const value = localStorage.getItem('key');
localStorage.setItem('key', 'value');
```

**After (SSR-safe):**
```typescript
import { getLocalStorage } from '@preliquify/core';

const storage = getLocalStorage(); // Returns no-op during SSR
const value = storage.getItem('key');
storage.setItem('key', 'value');
```

#### 2. Window Access

**Before (SSR-unsafe):**
```typescript
const width = window.innerWidth;
window.addEventListener('resize', handler);
```

**After (SSR-safe):**
```typescript
import { getWindow } from '@preliquify/core';

const window = getWindow(); // Returns mock during SSR
const width = window.innerWidth;
if (isBrowser()) {
  window.addEventListener('resize', handler);
}
```

#### 3. HTMLElement instanceof Check

**Before (SSR-unsafe):**
```typescript
function parseDataAttribute(element: Element, attr: string) {
  if (element instanceof HTMLElement) {
    return element.getAttribute(attr);
  }
}
```

**After (SSR-safe):**
```typescript
import { isHTMLElement, parseDataAttribute } from '@preliquify/core';

function parseDataAttribute(element: Element, attr: string) {
  if (isHTMLElement(element)) {
    return element.getAttribute(attr);
  }
}

// Or use the built-in utility:
const value = parseDataAttribute(element, 'data-prop');
```

#### 4. Document Access

**Before (SSR-unsafe):**
```typescript
const element = document.querySelector('.my-element');
```

**After (SSR-safe):**
```typescript
import { getDocument, isBrowser } from '@preliquify/core';

const doc = getDocument(); // Returns mock during SSR
if (isBrowser()) {
  const element = doc.querySelector('.my-element');
}
```

#### 5. Safe Property Access

**Before (SSR-unsafe):**
```typescript
// This crashes if media is undefined or media.type doesn't exist
const type = media.type;
```

**After (SSR-safe):**
```typescript
import { safeGet } from '@preliquify/core';

const type = safeGet(media, 'type', 'unknown');
```

## Manual Guards

If you prefer manual guards (without using utilities), here are common patterns:

### Pattern 1: Type Guards

```typescript
// localStorage
if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
  localStorage.setItem('key', 'value');
}

// window
if (typeof window !== 'undefined') {
  window.addEventListener('resize', handler);
}

// document
if (typeof document !== 'undefined') {
  const el = document.querySelector('.element');
}
```

### Pattern 2: HTMLElement instanceof

```typescript
// Check for HTMLElement availability first
if (typeof HTMLElement !== 'undefined' && element instanceof HTMLElement) {
  // Use HTMLElement APIs
}
```

### Pattern 3: Method Existence

```typescript
// Check if method exists before calling
if (typeof element?.getAttribute === 'function') {
  const value = element.getAttribute('data-prop');
}
```

## Context Providers During SSR

Context providers (like Zoom, Theme, etc.) should provide default values during SSR:

```typescript
import { createContext } from 'preact';
import { useContext } from 'preact/hooks';
import { isSSR } from '@preliquify/core';

const ZoomContext = createContext<ZoomValue>({
  // Provide safe defaults for SSR
  zoom: 1,
  setZoom: () => {},
});

export function ZoomProvider({ children, value }) {
  const defaultValue = isSSR() 
    ? { zoom: 1, setZoom: () => {} } // SSR-safe default
    : value; // Use actual value in browser
  
  return (
    <ZoomContext.Provider value={defaultValue}>
      {children}
    </ZoomContext.Provider>
  );
}

export function useZoom() {
  const context = useContext(ZoomContext);
  
  // Return safe default if context not available (shouldn't happen, but be safe)
  if (!context) {
    return { zoom: 1, setZoom: () => {} };
  }
  
  return context;
}
```

## Error Handling During Build

Preliquify's build process now:

1. **Warns instead of failing** for common browser API errors
2. **Provides polyfills** for missing browser APIs
3. **Continues compilation** when possible, only failing on critical errors

Common browser API errors that are handled gracefully:
- `window is not defined`
- `document is not defined`
- `localStorage is not defined`
- `HTMLElement is not defined`

## Best Practices

1. **Use SSR-safe utilities** from `@preliquify/core` when possible
2. **Guard browser APIs** at the top of functions that use them
3. **Provide defaults** for context values during SSR
4. **Test your components** during build to catch SSR issues early
5. **Use safe property access** (`safeGet`) for nested property access
6. **Check method existence** before calling element methods

## Common Issues and Solutions

### Issue: `parseDataAttribute` fails with HTMLElement instanceof

**Solution:**
```typescript
import { parseDataAttribute } from '@preliquify/core';
// Or use isHTMLElement() check first
```

### Issue: `getUserDetails` uses window/localStorage

**Solution:**
```typescript
import { getLocalStorage, getWindow, isBrowser } from '@preliquify/core';

function getUserDetails() {
  if (!isBrowser()) return null;
  
  const window = getWindow();
  const storage = getLocalStorage();
  // ... rest of function
}
```

### Issue: `useLocalStorageModel` accesses localStorage directly

**Solution:**
```typescript
import { getLocalStorage } from '@preliquify/core';

function useLocalStorageModel(key: string) {
  const storage = getLocalStorage();
  // storage.getItem/setItem work in both SSR and browser
}
```

### Issue: `MediaItem` accesses `media.type` which might be undefined

**Solution:**
```typescript
import { safeGet } from '@preliquify/core';

function MediaItem({ media }) {
  const type = safeGet(media, 'type', 'unknown');
  // ...
}
```

### Issue: Zoom components require context during SSR

**Solution:**
```typescript
// In your context provider, provide SSR-safe defaults
const ZoomContext = createContext({
  zoom: 1, // Safe default
  setZoom: () => {}, // No-op function
});
```

## Debugging SSR Issues

1. **Enable verbose mode** in preliquify config:
   ```typescript
   export default {
     verbose: true,
     // ...
   };
   ```

2. **Check build warnings** - Preliquify will warn about browser API usage

3. **Test components in isolation** - Render components during build to catch issues early

4. **Use SSR detection** - Add logging to see when code runs during SSR:
   ```typescript
   import { isSSR } from '@preliquify/core';
   
   if (isSSR()) {
     console.log('Running during SSR');
   }
   ```

## Migration Checklist

For existing components, check:

- [ ] All `localStorage` access uses `getLocalStorage()`
- [ ] All `window` access uses `getWindow()` or `typeof window !== 'undefined'`
- [ ] All `document` access uses `getDocument()` or `typeof document !== 'undefined'`
- [ ] All `instanceof HTMLElement` checks use `isHTMLElement()`
- [ ] Context providers have SSR-safe defaults
- [ ] Property access uses `safeGet()` for potentially undefined properties
- [ ] Browser-only code is wrapped in `isBrowser()` checks

## Summary

Preliquify now provides comprehensive SSR support:

✅ **Automatic polyfills** for browser APIs
✅ **SSR-safe utilities** for common patterns
✅ **Graceful error handling** during build
✅ **Better error messages** for debugging

Use the utilities and patterns described in this guide to write SSR-safe components!
