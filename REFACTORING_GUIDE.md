# Preliquify Component Refactoring Guide

## Overview

Preliquify supports two approaches:

### Approach 1: Placeholder at Build Time (Default)
- ✅ Simplest: Write components normally
- ✅ Works with any component (hooks, `.map()`, etc.)
- ❌ Shows placeholder until JS loads (requires hydration)

### Approach 2: Server-Side Rendering Without JS (Advanced)
- ✅ Works without JavaScript (true SSR)
- ✅ SEO-friendly, accessible
- ❌ Requires refactoring: Use Preliquify primitives instead of JS methods

## Choose Your Approach

**If you want components to work without JavaScript:**
→ Use Approach 2 (refactor to use Preliquify primitives)

**If you're okay with placeholders until hydration:**
→ Use Approach 1 (write components normally, no changes needed)

## Approach 1: Placeholder Mode (Default - No Refactoring Needed)

By default, `createLiquidSnippet` renders a placeholder at build time. Your component only runs after hydration:

```tsx
// ✅ YOUR COMPONENT - WRITE IT NORMALLY
function MyComponent({ gallery, ...props }) {
  // Use hooks normally
  const [state, setState] = useState(0);
  
  // Use .map() normally - this only runs at runtime
  return (
    <div>
      {gallery.map(item => <div>{item.title}</div>)}
    </div>
  );
}

// createLiquidSnippet handles everything automatically
export default createLiquidSnippet(MyComponent, {
  gallery: 'gallery',
  // ...
});
```

**This works because:**
- At build time: `createLiquidSnippet` renders a placeholder (your component never runs)
- At runtime: Hydration replaces placeholder with your component (props are real data)

## Approach 2: Server-Side Rendering (Refactoring Required)

If you want your component to render server-side without JavaScript, you need to refactor to use Preliquify primitives:

### Converting JavaScript Methods to Preliquify Primitives

To render server-side without JS, replace JavaScript array methods with Preliquify primitives:

**Recommended: Use the `<Target>` component** to avoid manual `useTarget()` checks and prevent linting issues:

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
          {gallery.map(item => <div key={item.id}>{item.title}</div>)}
        </div>
      }
    />
  );
}
```

**Why use `<Target>`?**
- ✅ Avoids linting warnings about conditional hooks
- ✅ Cleaner code - no manual `useTarget()` calls needed
- ✅ Hooks can be used in client path without issues

**Alternative: Separate components with manual `useTarget()`** (when you need more control):

```tsx
function MyComponentLiquid({ gallery }) {
  // Use Preliquify primitives for Liquid rendering
  return (
    <For each={$.var('gallery')} as="item">
      <div>{{ item.title }}</div>
    </For>
  );
}

function MyComponentClient({ gallery }) {
  // Use regular JavaScript for client-side
  // ✅ Hooks are safe here - always called
  const [state, setState] = useState(0);
  return (
    <div>
      {gallery.map(item => <div key={item.id}>{item.title}</div>)}
    </div>
  );
}

function MyComponent({ gallery, ...props }) {
  const target = useTarget();
  return target === 'liquid' 
    ? <MyComponentLiquid {...props} />
    : <MyComponentClient gallery={gallery} {...props} />;
}
```

## Common Refactoring Patterns

### Pattern 1: Array Iteration (.map() → <For />)

```tsx
// ❌ BEFORE (won't work at build time - props are Liquid expression strings)
{gallery.map((item, index) => (
  <MediaItem key={index} item={item} />
))}

// ✅ AFTER (works at build time - transforms to Liquid {% for %})
import { For, $ } from '@preliquify/preact';

<For each={$.var('gallery')} as="item">
  <MediaItem item={item} />
</For>
```

**Key points:**
- `each={$.var('gallery')}` - References the Liquid variable
- `as="item"` - The loop variable name
- Inside the loop, use Liquid syntax: `{{ item.title }}`

### Pattern 2: Conditional Rendering (&& → <Conditional />)

```tsx
// ❌ BEFORE (won't work at build time)
{isMobile && <MobileView />}
{!isMobile && <DesktopView />}

// ✅ AFTER (works at build time - transforms to Liquid {% if %})
import { Conditional, $ } from '@preliquify/preact';

<Conditional when={$.var('isMobile')}>
  <MobileView />
</Conditional>

// For if/else, use <Choose />
import { Choose, When, Otherwise } from '@preliquify/preact';

<Choose>
  <When is={$.var('isMobile')}>
    <MobileView />
  </When>
  <Otherwise>
    <DesktopView />
  </Otherwise>
</Choose>
```

### Pattern 3: Hooks (useState/useEffect)

**Important:** Hooks don't work at build time. You have two options:

**Option A: Keep hooks, use placeholder (Approach 1)**
```tsx
// Hooks only work at runtime, so component shows placeholder at build time
// This is fine if you're okay with hydration
const [currentGallery, setCurrentGallery] = useState(initialGallery);
useEffect(() => {
  // ... hook logic
}, [deps]);
```

**Option B: Replace hook logic with Liquid (Approach 2)**
```tsx
// If you need SSR without JS, replace hook logic with Liquid expressions
// Example: Instead of useState for variant gallery, use Liquid conditionals

<Choose>
  <When is={$.eq($.var('galleryAssignmentMode'), $.lit('variant'))}>
    <For each={$.var('galleryByVariant')} as="variantGallery">
      {/* Use Liquid to select variant gallery */}
    </For>
  </When>
  <Otherwise>
    <For each={$.var('gallery')} as="item">
      {/* Default gallery */}
    </For>
  </Otherwise>
</Choose>
```

**Note:** Complex hook logic may not be easily converted to Liquid. Consider keeping those components client-only.

### Pattern 4: Object Property Access

```tsx
// ❌ BEFORE (won't work at build time)
const layoutType = designSettings?.desktopSettings?.desktopLayoutType;

// ✅ AFTER (use Liquid expressions)
import { $ } from '@preliquify/preact';

// Access nested properties using dot notation
const layoutTypeExpr = $.var('designSettings.desktopSettings.desktopLayoutType');

// Then use in conditionals
<Choose>
  <When is={$.eq(layoutTypeExpr, $.lit('slider'))}>
    <SliderComponent {...props} />
  </When>
  <When is={$.eq(layoutTypeExpr, $.lit('masonry'))}>
    <MasonryComponent {...props} />
  </When>
  <Otherwise>
    <SliderComponent {...props} />
  </Otherwise>
</Choose>
```

### Pattern 5: Switch Statements (→ <Choose />)

```tsx
// ❌ BEFORE (won't work at build time)
switch (layoutType) {
  case 'slider':
    return <SliderComponent {...props} />;
  case 'masonry':
    return <MasonryComponent {...props} />;
  default:
    return <SliderComponent {...props} />;
}

// ✅ AFTER (use <Choose /> with multiple <When />)
import { Choose, When, Otherwise, $ } from '@preliquify/preact';

<Choose>
  <When is={$.eq($.var('layoutType'), $.lit('slider'))}>
    <SliderComponent {...props} />
  </When>
  <When is={$.eq($.var('layoutType'), $.lit('masonry'))}>
    <MasonryComponent {...props} />
  </When>
  <Otherwise>
    <SliderComponent {...props} />
  </Otherwise>
</Choose>
```

## Specific Refactoring for GalleryComponent

**If using Approach 1 (placeholder mode):** No refactoring needed - component works as-is.

**If using Approach 2 (SSR without JS):** Refactor to use Preliquify primitives. Example:

```tsx
// ✅ REFACTORED FOR SSR WITHOUT JS (Approach 2)
import { Choose, When, Otherwise, For, $, useTarget } from '@preliquify/preact';
// ... other imports

export function GalleryComponent({
  gallery,
  galleryByVariant,
  currentVariantId,
  galleryAssignmentMode = 'product',
  designSettings,
  productId,
  sectionId,
  // ... other props
}: GalleryComponentProps) {
  const target = useTarget();
  
  // Determine which gallery to use (variant vs product)
  const galleryExpr = $.eq($.var('galleryAssignmentMode'), $.lit('variant'))
    ? $.var(`galleryByVariant.${currentVariantId}`)
    : $.var('gallery');
  
  // Get layout type from design settings
  const layoutTypeExpr = $.var('designSettings.desktopSettings.desktopLayoutType');
  const mobileLayoutTypeExpr = $.var('designSettings.mobileSettings.mobileLayoutType');
  const isMobileExpr = $.var('isMobile');
  
  // Choose layout based on mobile vs desktop
  return (
    <Choose>
      <When is={isMobileExpr}>
        {/* Mobile layouts */}
        <Choose>
          <When is={$.eq(mobileLayoutTypeExpr, $.lit('two-columns'))}>
            <TwoColumnsComponent isMobile={true} gallery={galleryExpr} {...props} />
          </When>
          <Otherwise>
            <SliderComponent gallery={galleryExpr} {...props} />
          </Otherwise>
        </Choose>
      </When>
      <Otherwise>
        {/* Desktop layouts */}
        <Choose>
          <When is={$.eq(layoutTypeExpr, $.lit('slider'))}>
            <SliderComponent gallery={galleryExpr} {...props} />
          </When>
          <When is={$.eq(layoutTypeExpr, $.lit('slider-full-width'))}>
            <SliderFullWidthComponent gallery={galleryExpr} {...props} />
          </When>
          <When is={$.eq(layoutTypeExpr, $.lit('slider-with-thumbnails'))}>
            <SliderWithThumbnailsComponent gallery={galleryExpr} isDesktop={true} {...props} />
          </When>
          <When is={$.eq(layoutTypeExpr, $.lit('masonry'))}>
            <MasonryComponent gallery={galleryExpr} {...props} />
          </When>
          <When is={$.eq(layoutTypeExpr, $.lit('editorial'))}>
            <EditorialComponent gallery={galleryExpr} {...props} />
          </When>
          <Otherwise>
            <SliderComponent gallery={galleryExpr} {...props} />
          </Otherwise>
        </Choose>
      </Otherwise>
    </Choose>
  );
}
```

**Note:** This is a simplified example. In practice:
- Complex hook logic (useState/useEffect) may need to stay client-only
- Event handlers (onClick, etc.) only work client-side
- Consider splitting into Liquid component (SSR) + Client component (interactivity)

## Checklist for Refactoring (Approach 2 - SSR Without JS)

- [ ] **Decide**: Do you need SSR without JS? (If no, use Approach 1)
- [ ] Find all `.map()`, `.filter()`, `.forEach()` calls
- [ ] Replace with `<For each={$.var('collection')} as="item">`
- [ ] Find all conditional rendering (`&&`, ternary)
- [ ] Replace with `<Conditional />` or `<Choose />`
- [ ] Find all switch statements
- [ ] Replace with `<Choose><When />` pattern
- [ ] Handle hooks: Keep only for client-side interactivity
- [ ] Test that component builds without errors
- [ ] Verify component renders in generated Liquid file
- [ ] Verify component works without JavaScript in browser

## Handling Linting Warnings

### "React Hooks called conditionally" Warnings

If you see linting warnings about hooks being called conditionally, it's because you're calling hooks after a `useTarget()` check. 

**Solution: Use the `<Target>` component** (recommended):

```tsx
// ✅ Good - No linting issues
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

**Alternative: Extract hooks to separate component**:

```tsx
// ✅ Good - No linting issues
function MyComponent({ gallery }) {
  const target = useTarget();
  if (target === 'liquid') {
    return <For each={$.var('gallery')} as="item">...</For>;
  }
  // Extract to separate component - hooks are always called
  return <ComponentWithHooks gallery={gallery} />;
}

function ComponentWithHooks({ gallery }) {
  const [state, setState] = useState(0); // ✅ Safe - always called
  return <div>...</div>;
}
```

**❌ Bad - Causes linting warnings**:

```tsx
// ❌ Don't do this - hooks called conditionally
function MyComponent({ gallery }) {
  const target = useTarget();
  if (target === 'liquid') {
    return <For each={$.var('gallery')} as="item">...</For>;
  }
  const [state, setState] = useState(0); // ❌ Called conditionally!
  return <div>...</div>;
}
```

**Suppressing warnings (if needed)**:

If you must use the manual pattern and can't refactor, you can suppress the warning with a comment:

```tsx
function MyComponent({ gallery }) {
  const target = useTarget();
  if (target === 'liquid') {
    return <For each={$.var('gallery')} as="item">...</For>;
  }
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [state, setState] = useState(0);
  return <div>...</div>;
}
```

However, **using `<Target>` is the recommended approach** as it avoids this issue entirely.

## Key Principles

### Approach 1 (Placeholder Mode - Default)
1. **Write components normally** - No refactoring needed
2. **`createLiquidSnippet` handles everything** - Placeholder at build time
3. **Components only run at runtime** - After hydration with real data
4. **Works with any component** - Hooks, `.map()`, etc. all work

### Approach 2 (SSR Without JS - Advanced)
1. **Use Preliquify primitives** - `<For />`, `<Conditional />`, `<Choose />`
2. **Replace JS methods** - `.map()` → `<For />`, `&&` → `<Conditional />`
3. **Use `<Target>` component** - Avoids linting issues and code duplication
4. **Hooks are runtime-only** - Use for client-side interactivity only
5. **Test without JS** - Verify component works with JavaScript disabled

## Testing

After refactoring:

1. **Build should succeed**: No `.map is not a function` errors
2. **Placeholder visible**: At build time, placeholder should render
3. **Component hydrates**: After page load, placeholder should be replaced with actual component
4. **Functionality works**: All features should work after hydration

## Need Help?

If you encounter build errors:
1. **Check enhanced error messages** - They'll tell you exactly what to fix
2. **Ensure component is wrapped** - Make sure you're using `createLiquidSnippet`
3. **Write component normally** - No `useTarget()` checks needed
4. **If error persists** - The component might be imported/executed outside the wrapper

