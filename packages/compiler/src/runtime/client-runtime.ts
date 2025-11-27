interface PreliquifyIsland {
  id: string;
  component: string;
  props: Record<string, any>;
}

interface PreliquifyRuntime {
  components: Map<string, any>;
  mounted: Map<string, any>;
  errors: Error[];
  debug: boolean;
}

// Global runtime instance
declare global {
  interface Window {
    Preliquify: Record<string, any>;
    __preliquifyRuntime: PreliquifyRuntime;
  }
}

// Lightweight error boundary for hydration
function safeHydrate(
  element: Element,
  Component: any,
  props: any,
  runtime: PreliquifyRuntime
): void {
  try {
    const preact = (window as any).preact;
    if (!preact) {
      throw new Error(
        "Preact not found. Make sure preact is loaded before hydration."
      );
    }

    // Render component
    const vnode = preact.h(Component, props);
    preact.render(vnode, element);

    // Track mounted component
    const id = element.getAttribute("data-preliq-id");
    if (id) {
      runtime.mounted.set(id, { element, Component, props });
    }
  } catch (error) {
    runtime.errors.push(error as Error);

    if (runtime.debug) {
      console.error("[Preliquify] Hydration error:", error);
      console.error("Element:", element);
      console.error("Component:", Component);
      console.error("Props:", props);
    }

    // Add error indicator to element
    element.setAttribute("data-preliq-error", "true");

    // Dispatch custom event for error monitoring
    element.dispatchEvent(
      new CustomEvent("preliquify:error", {
        detail: { error, component: Component.name || "Unknown", props },
        bubbles: true,
      })
    );
  }
}

// Parse props with error handling
function parseProps(element: Element): Record<string, any> {
  const propsAttr = element.getAttribute("data-preliq-props");
  if (!propsAttr) return {};

  try {
    return JSON.parse(propsAttr);
  } catch (error) {
    console.warn("[Preliquify] Failed to parse props:", propsAttr, error);
    return {};
  }
}

// Progressive enhancement: only hydrate visible components
function isElementVisible(element: Element): boolean {
  const rect = element.getBoundingClientRect();
  const viewHeight = Math.max(
    document.documentElement.clientHeight,
    window.innerHeight
  );
  const viewWidth = Math.max(
    document.documentElement.clientWidth,
    window.innerWidth
  );

  // Check if element is in viewport with some margin
  const margin = 100;
  return !(
    rect.bottom < -margin ||
    rect.top > viewHeight + margin ||
    rect.right < -margin ||
    rect.left > viewWidth + margin
  );
}

// Main hydration function
function hydrateIslands(runtime: PreliquifyRuntime): void {
  const islands = document.querySelectorAll(
    "[data-preliq-island]:not([data-preliq-hydrated])"
  );
  const visibleIslands: Element[] = [];
  const deferredIslands: Element[] = [];

  // Sort islands by visibility
  islands.forEach((island) => {
    if (isElementVisible(island)) {
      visibleIslands.push(island);
    } else {
      deferredIslands.push(island);
    }
  });

  // Hydrate visible islands immediately
  visibleIslands.forEach((island) => {
    hydrateIsland(island, runtime);
  });

  // Set up intersection observer for deferred islands
  if (deferredIslands.length > 0 && "IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            hydrateIsland(entry.target, runtime);
            observer.unobserve(entry.target);
          }
        });
      },
      {
        rootMargin: "100px", // Start hydrating 100px before element comes into view
      }
    );

    deferredIslands.forEach((island) => observer.observe(island));
  } else {
    // Fallback: hydrate all if IntersectionObserver not supported
    deferredIslands.forEach((island) => hydrateIsland(island, runtime));
  }
}

// Hydrate a single island
function hydrateIsland(element: Element, runtime: PreliquifyRuntime): void {
  if (element.hasAttribute("data-preliq-hydrated")) return;

  const componentName = element.getAttribute("data-preliq-island");
  const id = element.getAttribute("data-preliq-id");

  if (!componentName) {
    console.warn("[Preliquify] Island missing component name:", element);
    return;
  }

  // Find component
  const Component =
    runtime.components.get(componentName) || window.Preliquify?.[componentName];

  if (!Component) {
    console.warn(`[Preliquify] Component "${componentName}" not found`);
    element.setAttribute("data-preliq-error", "component-not-found");
    return;
  }

  // Parse props and hydrate
  const props = parseProps(element);
  safeHydrate(element, Component, props, runtime);

  // Mark as hydrated
  element.setAttribute("data-preliq-hydrated", "true");

  // Dispatch hydration complete event
  element.dispatchEvent(
    new CustomEvent("preliquify:hydrated", {
      detail: { id, component: componentName },
      bubbles: true,
    })
  );
}

// Initialize runtime
function initRuntime(): PreliquifyRuntime {
  if (window.__preliquifyRuntime) {
    return window.__preliquifyRuntime;
  }

  const runtime: PreliquifyRuntime = {
    components: new Map(),
    mounted: new Map(),
    errors: [],
    debug: (window as any).__PRELIQUIFY_DEBUG__ || false,
  };

  window.__preliquifyRuntime = runtime;

  // Initialize Preliquify namespace if not exists
  if (!window.Preliquify) {
    window.Preliquify = {};
  }

  return runtime;
}

// Public API
const runtime = initRuntime();

// Auto-hydrate on DOM ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => hydrateIslands(runtime));
} else {
  // Use requestIdleCallback for better performance if available
  if ("requestIdleCallback" in window) {
    (window as any).requestIdleCallback(() => hydrateIslands(runtime));
  } else {
    setTimeout(() => hydrateIslands(runtime), 0);
  }
}

// Export public API
export const Preliquify = {
  // Register a component
  register(name: string, component: any): void {
    runtime.components.set(name, component);
    window.Preliquify[name] = component;
  },

  // Manually hydrate new islands (useful for dynamic content)
  hydrate(container?: Element): void {
    const searchRoot = container || document.body;
    const islands = searchRoot.querySelectorAll(
      "[data-preliq-island]:not([data-preliq-hydrated])"
    );
    islands.forEach((island) => hydrateIsland(island, runtime));
  },

  // Get mounted component by ID
  getComponent(id: string): any {
    return runtime.mounted.get(id);
  },

  // Get all hydration errors
  getErrors(): Error[] {
    return [...runtime.errors];
  },

  // Enable/disable debug mode
  setDebug(enabled: boolean): void {
    runtime.debug = enabled;
  },

  // Unmount a component
  unmount(id: string): boolean {
    const mounted = runtime.mounted.get(id);
    if (!mounted) return false;

    const preact = (window as any).preact;
    if (preact) {
      preact.render(null, mounted.element);
      runtime.mounted.delete(id);
      mounted.element.removeAttribute("data-preliq-hydrated");
      return true;
    }
    return false;
  },

  // Re-hydrate a component with new props
  update(id: string, newProps: Record<string, any>): boolean {
    const mounted = runtime.mounted.get(id);
    if (!mounted) return false;

    const mergedProps = { ...mounted.props, ...newProps };
    safeHydrate(mounted.element, mounted.Component, mergedProps, runtime);
    mounted.props = mergedProps;
    return true;
  },
};

// Make API available globally
(window as any).__PRELIQUIFY__ = Preliquify;
