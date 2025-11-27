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

declare global {
  interface Window {
    Preliquify: Record<string, any>;
    __preliquifyRuntime: PreliquifyRuntime;
  }
}

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
        "Preact not found. Make sure preact is bundled or loaded before hydration."
      );
    }

    const vnode = preact.h(Component, props);
    preact.render(vnode, element);

    const id = element.getAttribute("data-preliq-id");
    if (id) {
      runtime.mounted.set(id, { element, Component, props });
    }
  } catch (error) {
    runtime.errors.push(error as Error);

    if (runtime.debug) {
      console.error("[__PRELIQUIFY__] Hydration error:", error);
      console.error("Element:", element);
      console.error("Component:", Component);
      console.error("Props:", props);
    }

    element.setAttribute("data-preliq-error", "true");

    element.dispatchEvent(
      new CustomEvent("preliquify:error", {
        detail: { error, component: Component.name || "Unknown", props },
        bubbles: true,
      })
    );
  }
}

function parseProps(element: Element): Record<string, any> {
  // First try to read from script tag (avoids HTML escaping issues)
  const scriptTag = element.querySelector("script[data-preliq-props]");
  if (scriptTag) {
    try {
      const content = scriptTag.textContent || "";
      const trimmed = content.trim();
      if (trimmed) {
        // Check if content still has Liquid tags (means Liquid wasn't processed)
        if (trimmed.includes("{%") || trimmed.includes("{{")) {
          console.warn(
            "[Preliquify] Script tag contains Liquid expressions - Liquid may not have processed this template. Content:",
            trimmed.substring(0, 200)
          );
          return {};
        }
        return JSON.parse(trimmed);
      }
    } catch (error) {
      console.warn("[Preliquify] Failed to parse props from script:", error);
      console.warn(
        "[Preliquify] Script content:",
        scriptTag.textContent?.substring(0, 200)
      );
    }
  }

  // Fallback to data attribute (backward compatibility)
  const propsAttr = element.getAttribute("data-preliq-props");
  if (!propsAttr) return {};

  try {
    return JSON.parse(propsAttr);
  } catch (error) {
    console.warn("[Preliquify] Failed to parse props:", propsAttr, error);
    return {};
  }
}

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

  const margin = 100;
  return !(
    rect.bottom < -margin ||
    rect.top > viewHeight + margin ||
    rect.right < -margin ||
    rect.left > viewWidth + margin
  );
}

function hydrateIslands(runtime: PreliquifyRuntime): void {
  const islands = document.querySelectorAll(
    "[data-preliq-island]:not([data-preliq-hydrated])"
  );
  const visibleIslands: Element[] = [];
  const deferredIslands: Element[] = [];

  islands.forEach((island) => {
    if (isElementVisible(island)) {
      visibleIslands.push(island);
    } else {
      deferredIslands.push(island);
    }
  });

  visibleIslands.forEach((island) => {
    hydrateIsland(island, runtime);
  });

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
        rootMargin: "100px",
      }
    );

    deferredIslands.forEach((island) => observer.observe(island));
  } else {
    deferredIslands.forEach((island) => hydrateIsland(island, runtime));
  }
}

function hydrateIsland(element: Element, runtime: PreliquifyRuntime): void {
  if (element.hasAttribute("data-preliq-hydrated")) return;

  const componentName = element.getAttribute("data-preliq-island");
  const id = element.getAttribute("data-preliq-id");

  if (!componentName) {
    console.warn("[Preliquify] Island missing component name:", element);
    return;
  }

  const Component =
    runtime.components.get(componentName) ||
    (window as any).__PRELIQUIFY__?.[componentName];

  if (!Component) {
    console.warn(`[Preliquify] Component "${componentName}" not found`);
    console.warn(
      `[Preliquify] Available components:`,
      Array.from(runtime.components.keys())
    );
    console.warn(
      `[Preliquify] Available in window.__PRELIQUIFY__:`,
      Object.keys((window as any).__PRELIQUIFY__ || {})
    );
    element.setAttribute("data-preliq-error", "component-not-found");
    return;
  }

  const props = parseProps(element);
  safeHydrate(element, Component, props, runtime);

  element.setAttribute("data-preliq-hydrated", "true");

  element.dispatchEvent(
    new CustomEvent("preliquify:hydrated", {
      detail: { id, component: componentName },
      bubbles: true,
    })
  );
}

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

  if (!(window as any).__PRELIQUIFY__) {
    (window as any).__PRELIQUIFY__ = {};
  }

  return runtime;
}

const runtime = initRuntime();

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => hydrateIslands(runtime));
} else {
  if ("requestIdleCallback" in window) {
    (window as any).requestIdleCallback(() => hydrateIslands(runtime));
  } else {
    setTimeout(() => hydrateIslands(runtime), 0);
  }
}

export const Preliquify = {
  register(name: string, component: any): void {
    runtime.components.set(name, component);
    (window as any).__PRELIQUIFY__[name] = component;
  },

  hydrate(container?: Element): void {
    const searchRoot = container || document.body;
    const islands = searchRoot.querySelectorAll(
      "[data-preliq-island]:not([data-preliq-hydrated])"
    );
    islands.forEach((island) => hydrateIsland(island, runtime));
  },

  getComponent(id: string): any {
    return runtime.mounted.get(id);
  },

  getErrors(): Error[] {
    return [...runtime.errors];
  },

  setDebug(enabled: boolean): void {
    runtime.debug = enabled;
  },

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

  update(id: string, newProps: Record<string, any>): boolean {
    const mounted = runtime.mounted.get(id);
    if (!mounted) return false;

    const mergedProps = { ...mounted.props, ...newProps };
    safeHydrate(mounted.element, mounted.Component, mergedProps, runtime);
    mounted.props = mergedProps;
    return true;
  },
};

(window as any).__PRELIQUIFY__ = Preliquify;
