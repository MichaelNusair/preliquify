import { FunctionComponent } from "preact";

interface ComponentProps {
  [key: string]: any;
}

declare global {
  interface Window {
    preact: typeof import("preact");
    YourComponent: FunctionComponent;
    GenericHydration: {
      hydrate: (
        element: Element,
        Component: any,
        getProps: (el: Element) => ComponentProps
      ) => void;
      hydrateAll: (
        selector: string,
        Component: any,
        getProps: (el: Element) => ComponentProps
      ) => void;
      hydrateYourComponent: () => void;
    };
  }
}

function parseDataAttribute(element: Element, attribute: string): any {
  if (!element || typeof element.getAttribute !== "function") {
    return null;
  }

  const value = element.getAttribute(attribute);
  if (!value) return null;

  try {
    const decoded = decodeURIComponent(value);
    return JSON.parse(decoded);
  } catch (error) {
    if (typeof window !== "undefined") {
      console.warn(`[Hydration] Failed to parse ${attribute}:`, error);
    }
    return null;
  }
}

function hydrateComponent(
  element: Element,
  Component: any,
  getProps: (el: Element) => ComponentProps
): void {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return;
  }

  if (
    typeof element.hasAttribute === "function" &&
    element.hasAttribute("data-hydrated")
  ) {
    return;
  }

  try {
    const preact = window.preact;
    if (!preact) {
      throw new Error("Preact not found. Make sure preact is loaded.");
    }

    const props = getProps(element);

    const vnode = preact.h(Component, props);
    preact.render(vnode, element);

    if (typeof element.setAttribute === "function") {
      element.setAttribute("data-hydrated", "true");
    }

    if (typeof element.dispatchEvent === "function") {
      element.dispatchEvent(
        new CustomEvent("component:hydrated", {
          detail: { element, props },
          bubbles: true,
        })
      );
    }
  } catch (error) {
    if (typeof window !== "undefined") {
      console.error("[Hydration] Error:", error);
    }
    if (typeof element.setAttribute === "function") {
      element.setAttribute("data-hydration-error", "true");
    }
  }
}

function hydrateAll(
  selector: string,
  Component: any,
  getProps: (el: Element) => ComponentProps
): void {
  if (
    typeof document === "undefined" ||
    typeof document.querySelectorAll !== "function"
  ) {
    return;
  }

  const elements = document.querySelectorAll(
    `${selector}:not([data-hydrated])`
  );

  elements.forEach((element) => {
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
      hydrateComponent(element, Component, getProps);
    }
  });
}

function hydrateYourComponent(): void {
  if (typeof window === "undefined") {
    return;
  }

  const YourComponent = window.YourComponent;
  if (!YourComponent) {
    console.warn("[Hydration] YourComponent not found");
    return;
  }

  const getProps = (element: Element): ComponentProps => {
    return {
      metafieldData: parseDataAttribute(element, "data-metafield"),
      shopSettings: parseDataAttribute(element, "data-shop-settings"),
      fallbackData: parseDataAttribute(element, "data-fallback"),
    };
  };

  hydrateAll(".your-component-ssr-root", YourComponent, getProps);
}

if (typeof window !== "undefined" && typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", hydrateYourComponent);
  } else {
    if ("requestIdleCallback" in window) {
      window.requestIdleCallback(hydrateYourComponent);
    } else {
      setTimeout(hydrateYourComponent, 0);
    }
  }
}

export const GenericHydration = {
  hydrate: hydrateComponent,
  hydrateAll,
  hydrateYourComponent,
};

if (typeof window !== "undefined") {
  window.GenericHydration = GenericHydration;
}
