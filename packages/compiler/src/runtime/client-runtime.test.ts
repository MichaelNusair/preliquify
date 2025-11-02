import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { JSDOM } from "jsdom";

describe("Client Runtime", () => {
  let dom: JSDOM;
  let window: any;
  let document: any;

  beforeEach(() => {
    // Set up DOM environment
    dom = new JSDOM(
      `
      <!DOCTYPE html>
      <html>
        <body>
          <div data-preliq-island="TestComponent" data-preliq-id="test-1" data-preliq-props='{"name":"Test"}'></div>
          <div data-preliq-island="MissingComponent" data-preliq-id="test-2"></div>
          <div data-preliq-island="ErrorComponent" data-preliq-id="test-3" data-preliq-props='invalid-json'></div>
        </body>
      </html>
    `,
      {
        runScripts: "dangerously",
        resources: "usable",
      }
    );

    window = dom.window;
    document = window.document;

    // Mock Preact
    window.preact = {
      h: vi.fn((type, props) => ({ type, props })),
      render: vi.fn(),
    };

    // Mock IntersectionObserver
    window.IntersectionObserver = vi.fn().mockImplementation((callback) => ({
      observe: vi.fn(),
      unobserve: vi.fn(),
      disconnect: vi.fn(),
    }));

    // Mock requestIdleCallback
    window.requestIdleCallback = vi.fn((cb) => setTimeout(cb, 0));

    // Make window global for the runtime
    global.window = window;
    global.document = document;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should parse props correctly", () => {
    const runtime = `
      function parseProps(el) {
        const propsAttr = el.getAttribute('data-preliq-props');
        if (!propsAttr) return {};
        try {
          return JSON.parse(propsAttr);
        } catch (error) {
          console.warn('[Preliquify] Failed to parse props:', propsAttr, error);
          return {};
        }
      }
    `;

    window.eval(runtime);

    const el = document.querySelector('[data-preliq-id="test-1"]');
    const props = window.parseProps(el);
    expect(props).toEqual({ name: "Test" });
  });

  it("should handle invalid JSON props gracefully", () => {
    const runtime = `
      function parseProps(el) {
        const propsAttr = el.getAttribute('data-preliq-props');
        if (!propsAttr) return {};
        try {
          return JSON.parse(propsAttr);
        } catch (error) {
          console.warn('[Preliquify] Failed to parse props:', propsAttr, error);
          return {};
        }
      }
    `;

    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    window.eval(runtime);

    const el = document.querySelector('[data-preliq-id="test-3"]');
    const props = window.parseProps(el);

    expect(props).toEqual({});
    expect(warnSpy).toHaveBeenCalledWith(
      "[Preliquify] Failed to parse props:",
      "invalid-json",
      expect.any(Error)
    );
  });

  it("should check element visibility correctly", () => {
    const runtime = `
      function isElementVisible(element) {
        const rect = element.getBoundingClientRect();
        const viewHeight = Math.max(document.documentElement.clientHeight, window.innerHeight);
        const viewWidth = Math.max(document.documentElement.clientWidth, window.innerWidth);
        const margin = 100;
        return !(
          rect.bottom < -margin ||
          rect.top > viewHeight + margin ||
          rect.right < -margin ||
          rect.left > viewWidth + margin
        );
      }
    `;

    window.eval(runtime);

    const el = document.createElement("div");
    el.getBoundingClientRect = vi.fn(() => ({
      top: 100,
      bottom: 200,
      left: 0,
      right: 100,
    }));

    expect(window.isElementVisible(el)).toBe(true);

    // Test element below viewport
    el.getBoundingClientRect = vi.fn(() => ({
      top: 2000,
      bottom: 2100,
      left: 0,
      right: 100,
    }));

    expect(window.isElementVisible(el)).toBe(false);
  });

  it("should handle missing components gracefully", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    // Simple runtime that tries to hydrate
    const runtime = `
      window.Preliquify = {};
      
      function hydrateIsland(element) {
        const componentName = element.getAttribute('data-preliq-island');
        const Component = window.Preliquify[componentName];
        
        if (!Component) {
          console.warn('[Preliquify] Component "' + componentName + '" not found');
          element.setAttribute('data-preliq-error', 'component-not-found');
          return;
        }
      }
      
      const el = document.querySelector('[data-preliq-island="MissingComponent"]');
      hydrateIsland(el);
    `;

    window.eval(runtime);

    const el = document.querySelector(
      '[data-preliq-island="MissingComponent"]'
    );
    expect(el.getAttribute("data-preliq-error")).toBe("component-not-found");
    expect(warnSpy).toHaveBeenCalledWith(
      '[Preliquify] Component "MissingComponent" not found'
    );
  });

  it("should dispatch hydration events", () => {
    let hydratedEvent: any = null;

    const el = document.querySelector('[data-preliq-id="test-1"]');
    el.addEventListener("preliquify:hydrated", (e: any) => {
      hydratedEvent = e;
    });

    // Simulate hydration
    el.setAttribute("data-preliq-hydrated", "true");
    el.dispatchEvent(
      new window.CustomEvent("preliquify:hydrated", {
        detail: { id: "test-1", component: "TestComponent" },
        bubbles: true,
      })
    );

    expect(hydratedEvent).toBeTruthy();
    expect(hydratedEvent.detail).toEqual({
      id: "test-1",
      component: "TestComponent",
    });
  });

  it("should support progressive enhancement with IntersectionObserver", () => {
    const observeMock = vi.fn();
    window.IntersectionObserver = vi.fn().mockImplementation((callback) => ({
      observe: observeMock,
      unobserve: vi.fn(),
      disconnect: vi.fn(),
    }));

    const runtime = `
      function setupLazyHydration() {
        if ('IntersectionObserver' in window) {
          const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
              if (entry.isIntersecting) {
                console.log('Hydrating:', entry.target);
              }
            });
          }, { rootMargin: '100px' });
          
          const islands = document.querySelectorAll('[data-preliq-island]');
          islands.forEach(island => observer.observe(island));
          return observer;
        }
      }
      
      window.observer = setupLazyHydration();
    `;

    window.eval(runtime);

    expect(window.IntersectionObserver).toHaveBeenCalled();
    expect(observeMock).toHaveBeenCalledTimes(3); // 3 islands in the test DOM
  });
});
