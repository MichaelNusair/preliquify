# Solution for Linting and useTarget() Duplication Issues

## Summary

We've addressed both issues:

1. ✅ **Linting Solution**: Created a `<Target>` component that eliminates the need for manual `useTarget()` checks and prevents linting warnings about conditional hooks
2. ✅ **Avoiding Code Duplication**: The `<Target>` component abstracts the dual-rendering pattern, making code cleaner and more maintainable

## What Was Done

### 1. Created `<Target>` Component

A new helper component that abstracts the dual-rendering pattern:

```tsx
import { Target, For, $ } from '@preliquify/preact';

function MyComponent({ gallery }) {
  return (
    <Target
      liquid={
        <For each={$.var('gallery')} as="item">
          <div>{{ item.title }}</div>
        </For>
      }
      client={
        <div>
          {gallery.map(item => (
            <div key={item.id}>{item.title}</div>
          ))}
        </div>
      }
    />
  );
}
```

**Benefits:**
- ✅ No linting warnings about conditional hooks
- ✅ No manual `useTarget()` calls needed
- ✅ Clear separation of liquid vs client rendering
- ✅ Hooks can be used safely in client path

### 2. Updated Documentation

- Added `<Target>` to primitives documentation
- Updated best practices guide with recommended pattern
- Updated refactoring guide with linting solutions
- Added examples showing how to avoid linting issues

## How to Use

### Before (Manual Pattern - Causes Linting Issues)

```tsx
function MyComponent({ gallery }) {
  const target = useTarget(); // Manual check
  if (target === 'liquid') {
    return <For each={$.var('gallery')} as="item">...</For>;
  }
  const [state, setState] = useState(0); // ❌ Linting warning!
  return <div>...</div>;
}
```

### After (Using `<Target>` - No Linting Issues)

```tsx
import { Target, For, $ } from '@preliquify/preact';

function MyComponent({ gallery }) {
  return (
    <Target
      liquid={<For each={$.var('gallery')} as="item">...</For>}
      client={<ComponentWithHooks gallery={gallery} />}
    />
  );
}

function ComponentWithHooks({ gallery }) {
  const [state, setState] = useState(0); // ✅ Safe - always called
  return <div>...</div>;
}
```

## Answering Your Questions

### 1. CAN WE SHIP A SOLUTION FOR LINTING?

**Yes!** The `<Target>` component solves this by:
- Keeping hooks in separate component trees (not conditionally called)
- Eliminating the need for manual `useTarget()` checks that lead to conditional hook calls
- Providing a clean, type-safe API

### 2. CAN WE HELP HIM AVOID CALLING USETARGET AND CODING TWICE?

**Yes!** The `<Target>` component:
- Eliminates manual `useTarget()` calls
- Provides a cleaner abstraction for dual rendering
- Still allows full control when needed (but with better patterns)

### 2.a. IS IT AN ISSUE IN THIS REPO OR IN THE USER OR BOTH?

**Both, but now fixed in the repo:**

**In the repo:**
- ✅ Fixed: Added `<Target>` component to abstract the pattern
- ✅ Fixed: Updated documentation to show the recommended approach
- ✅ Fixed: Added linting guidance

**In the user's code:**
- They were using the manual `useTarget()` pattern which is valid but:
  - Leads to linting warnings when hooks are used
  - Requires more boilerplate
  - Can lead to conditional hook calls

**Solution:**
- Tell them to use `<Target>` component instead
- This is a better pattern that avoids both issues
- The component is now available in `@preliquify/preact`

## Migration Guide

For users with existing code using manual `useTarget()`:

### Step 1: Replace Manual Pattern

**Before:**
```tsx
function MyComponent({ gallery }) {
  const target = useTarget();
  if (target === 'liquid') {
    return <For each={$.var('gallery')} as="item">...</For>;
  }
  return <div>{gallery.map(...)}</div>;
}
```

**After:**
```tsx
function MyComponent({ gallery }) {
  return (
    <Target
      liquid={<For each={$.var('gallery')} as="item">...</For>}
      client={<div>{gallery.map(...)}</div>}
    />
  );
}
```

### Step 2: Extract Hooks to Separate Components

If you have hooks in the client path, extract them:

**Before:**
```tsx
function MyComponent({ gallery }) {
  const target = useTarget();
  if (target === 'liquid') {
    return <For each={$.var('gallery')} as="item">...</For>;
  }
  const [state, setState] = useState(0); // ❌ Linting warning
  return <div>...</div>;
}
```

**After:**
```tsx
function MyComponent({ gallery }) {
  return (
    <Target
      liquid={<For each={$.var('gallery')} as="item">...</For>}
      client={<ComponentWithHooks gallery={gallery} />}
    />
  );
}

function ComponentWithHooks({ gallery }) {
  const [state, setState] = useState(0); // ✅ Safe
  return <div>...</div>;
}
```

## Files Changed

1. `packages/core/src/primitives/Target.tsx` - New component
2. `packages/core/src/index.ts` - Export new component
3. `docs/primitives.md` - Added `<Target>` documentation
4. `docs/best-practices.md` - Updated with recommended pattern
5. `REFACTORING_GUIDE.md` - Added linting section and `<Target>` examples

## Next Steps for Users

1. **Update imports**: `import { Target } from '@preliquify/preact'`
2. **Replace manual `useTarget()` patterns** with `<Target>` component
3. **Extract hooks to separate components** if needed (to avoid conditional calls)
4. **Linting warnings should disappear** after migration

## Additional Notes

- The `<Target>` component is backward compatible - existing code still works
- Users can still use manual `useTarget()` if they need more control, but `<Target>` is recommended
- All linting issues are resolved by using `<Target>` and extracting hooks to separate components

