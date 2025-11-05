export function isSSR(): boolean {
  return (
    typeof window === "undefined" ||
    (typeof globalThis !== "undefined" &&
      (globalThis as any).__PRELIQUIFY_SSR__ === true)
  );
}

export function isBrowser(): boolean {
  return typeof window !== "undefined" && !isSSR();
}

export function getLocalStorage():
  | Storage
  | {
      getItem: (key: string) => null;
      setItem: (key: string, value: string) => void;
      removeItem: (key: string) => void;
      clear: () => void;
      length: number;
      key: (index: number) => null;
    } {
  if (isSSR() || typeof localStorage === "undefined") {
    return {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
      clear: () => {},
      get length() {
        return 0;
      },
      key: () => null,
    };
  }
  return localStorage;
}

export function getWindow():
  | Window
  | {
      location: Location;
      innerWidth: number;
      innerHeight: number;
      addEventListener: () => void;
      removeEventListener: () => void;
      [key: string]: any;
    } {
  if (isSSR() || typeof window === "undefined") {
    return {
      location: {
        href: "",
        pathname: "",
        reload: () => {},
        origin: "",
        search: "",
        hash: "",
      } as Location,
      innerWidth: 1024,
      innerHeight: 768,
      addEventListener: () => {},
      removeEventListener: () => {},
    } as any;
  }
  return window;
}

export function getDocument():
  | Document
  | {
      querySelector: () => null;
      querySelectorAll: () => never[];
      readyState: string;
      [key: string]: any;
    } {
  if (isSSR() || typeof document === "undefined") {
    return {
      querySelector: () => null,
      querySelectorAll: () => [],
      readyState: "complete",
    } as any;
  }
  return document;
}

export function isHTMLElement(value: any): boolean {
  if (isSSR()) {
    return (
      value !== null &&
      typeof value === "object" &&
      (typeof value.getAttribute === "function" ||
        typeof value.setAttribute === "function" ||
        typeof value.hasAttribute === "function")
    );
  }

  return typeof HTMLElement !== "undefined" && value instanceof HTMLElement;
}

export function parseDataAttribute(
  element: Element | { getAttribute?: (attr: string) => string | null } | null,
  attribute: string
): any {
  if (!element) return null;

  const getAttr =
    typeof element.getAttribute === "function"
      ? element.getAttribute.bind(element)
      : () => null;

  const value = getAttr(attribute);
  if (!value) return null;

  try {
    const decoded = decodeURIComponent(value);
    return JSON.parse(decoded);
  } catch (error) {
    if (isBrowser()) {
      console.warn(`[SSR-Safe] Failed to parse ${attribute}:`, error);
    }
    return null;
  }
}

export function safeGet<T>(obj: any, path: string, defaultValue: T): T {
  if (!obj) return defaultValue;

  const keys = path.split(".");
  let current: any = obj;

  for (const key of keys) {
    if (current === null || current === undefined) {
      return defaultValue;
    }
    current = current[key];
  }

  return current !== undefined && current !== null ? current : defaultValue;
}
