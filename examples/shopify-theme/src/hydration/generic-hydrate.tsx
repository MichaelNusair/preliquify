/**
 * Generic Hydration Pattern
 *
 * This demonstrates how hydration scripts read data attributes
 * and hydrate Preact components on the client.
 *
 * Pattern:
 * 1. Server renders HTML with data attributes containing JSON
 * 2. This script finds elements with matching class/selector
 * 3. Reads data attributes and parses JSON
 * 4. Renders your component with parsed props
 */

// TODO: Import your actual component
// import { YourComponent } from "../components/YourComponent";

// Component interface should match your props
interface ComponentProps {
  [key: string]: any;
}

/**
 * Parse JSON from data attribute
 */
function parseDataAttribute(element: Element, attribute: string): any {
  const value = element.getAttribute(attribute);
  if (!value) return null;

  try {
    // Decode URI-encoded JSON (if escaped)
    const decoded = decodeURIComponent(value);
    return JSON.parse(decoded);
  } catch (error) {
    console.warn(`[Hydration] Failed to parse ${attribute}:`, error);
    return null;
  }
}

/**
 * Hydrate a single component instance
 */
function hydrateComponent(
  element: Element,
  Component: any,
  getProps: (el: Element) => ComponentProps
): void {
  // Check if already hydrated
  if (element.hasAttribute("data-hydrated")) {
    return;
  }

  try {
    const preact = (window as any).preact;
    if (!preact) {
      throw new Error("Preact not found. Make sure preact is loaded.");
    }

    // Get props from data attributes
    const props = getProps(element);

    // Render component
    const vnode = preact.h(Component, props);
    preact.render(vnode, element);

    // Mark as hydrated
    element.setAttribute("data-hydrated", "true");

    // Dispatch event
    element.dispatchEvent(
      new CustomEvent("component:hydrated", {
        detail: { element, props },
        bubbles: true,
      })
    );
  } catch (error) {
    console.error("[Hydration] Error:", error);
    element.setAttribute("data-hydration-error", "true");
  }
}

/**
 * Find and hydrate all component instances
 */
function hydrateAll(
  selector: string,
  Component: any,
  getProps: (el: Element) => ComponentProps
): void {
  const elements = document.querySelectorAll(
    `${selector}:not([data-hydrated])`
  );

  elements.forEach((element) => {
    // Use IntersectionObserver for performance
    if ("IntersectionObserver" in window) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              hydrateComponent(entry.target, Component, getProps);
              observer.unobserve(entry.target);
            }
          });
        },
        { rootMargin: "100px" }
      );
      observer.observe(element);
    } else {
      // Fallback: hydrate immediately
      hydrateComponent(element, Component, getProps);
    }
  });
}

/**
 * Example usage for a component with specific props
 */
function hydrateYourComponent(): void {
  // TODO: Replace with your actual component
  const YourComponent = (window as any).YourComponent;
  if (!YourComponent) {
    console.warn("[Hydration] YourComponent not found");
    return;
  }

  // Define how to read props from data attributes
  const getProps = (element: Element): ComponentProps => {
    return {
      metafieldData: parseDataAttribute(element, "data-metafield"),
      shopSettings: parseDataAttribute(element, "data-shop-settings"),
      fallbackData: parseDataAttribute(element, "data-fallback"),
    };
  };

  // Hydrate all instances
  hydrateAll(".your-component-ssr-root", YourComponent, getProps);
}

// Auto-hydrate on DOM ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", hydrateYourComponent);
} else {
  if ("requestIdleCallback" in window) {
    (window as any).requestIdleCallback(hydrateYourComponent);
  } else {
    setTimeout(hydrateYourComponent, 0);
  }
}

// Export for manual hydration
export const GenericHydration = {
  hydrate: hydrateComponent,
  hydrateAll,
  hydrateYourComponent,
};

if (typeof window !== "undefined") {
  (window as any).GenericHydration = GenericHydration;
}

/**
 * Pattern Summary:
 *
 * 1. Component renders server-side with data attributes:
 *    <div class="your-component-ssr-root"
 *         data-metafield='{"key":"value"}'
 *         data-shop-settings='{"setting":true}'>
 *      <!-- server-rendered HTML -->
 *    </div>
 *
 * 2. This script finds all `.your-component-ssr-root` elements
 *
 * 3. Reads data attributes and parses JSON:
 *    const metafieldData = JSON.parse(element.getAttribute('data-metafield'));
 *
 * 4. Renders component with parsed props:
 *    preact.render(preact.h(YourComponent, { metafieldData, ... }), element);
 *
 * 5. Component becomes interactive on the client
 */
