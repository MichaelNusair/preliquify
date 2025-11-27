import { vi } from "vitest";

// Mock browser globals for server-side rendering tests
vi.stubGlobal("window", {
  location: {
    href: "",
    pathname: "",
    reload: vi.fn(),
    origin: "",
    search: "",
    hash: "",
  },
  innerWidth: 1024,
  innerHeight: 768,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  getComputedStyle: vi.fn(() => ({
    display: "block",
    visibility: "visible",
  })),
  history: {
    pushState: vi.fn(),
    replaceState: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
  },
});

vi.stubGlobal("document", {
  querySelector: vi.fn(),
  querySelectorAll: vi.fn(() => []),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  createElement: vi.fn(() => ({
    setAttribute: vi.fn(),
    getAttribute: vi.fn(),
    classList: { add: vi.fn(), remove: vi.fn(), contains: vi.fn() },
    textContent: "",
    appendChild: vi.fn(),
    remove: vi.fn(),
    closest: vi.fn(),
    querySelector: vi.fn(),
    querySelectorAll: vi.fn(() => []),
  })),
  createTextNode: vi.fn(() => ({ textContent: "" })),
  head: {
    appendChild: vi.fn(),
    removeChild: vi.fn(),
  },
  body: {
    appendChild: vi.fn(),
    removeChild: vi.fn(),
  },
  readyState: "complete",
});
