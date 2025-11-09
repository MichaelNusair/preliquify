"use strict";
var PreliquifyRuntime = (() => {
  var w = Object.defineProperty;
  var f = Object.getOwnPropertySymbols;
  var _ = Object.prototype.hasOwnProperty,
    g = Object.prototype.propertyIsEnumerable;
  var y = (e, t, n) =>
      t in e
        ? w(e, t, { enumerable: !0, configurable: !0, writable: !0, value: n })
        : (e[t] = n),
    u = (e, t) => {
      for (var n in t || (t = {})) _.call(t, n) && y(e, n, t[n]);
      if (f) for (var n of f(t)) g.call(t, n) && y(e, n, t[n]);
      return e;
    };
  function m(e, t, n, o) {
    try {
      let r = window.preact;
      if (!r)
        throw new Error(
          "Preact not found. Make sure preact is bundled or loaded before hydration."
        );
      let i = r.h(t, n);
      r.render(i, e);
      let s = e.getAttribute("data-preliq-id");
      return (
        s && o.mounted.set(s, { element: e, Component: t, props: n }),
        !0
      );
    } catch (r) {
      return (
        o.errors.push(r),
        o.debug &&
          (console.error("[__PRELIQUIFY__] Hydration error:", r),
          console.error("Element:", e),
          console.error("Component:", t),
          console.error("Props:", n)),
        e.setAttribute("data-preliq-error", "true"),
        e.dispatchEvent(
          new CustomEvent("preliquify:error", {
            detail: { error: r, component: t.name || "Unknown", props: n },
            bubbles: !0,
          })
        ),
        !1
      );
    }
  }
  function l(e) {
    let t = document.createElement("textarea");
    return ((t.innerHTML = e), t.value);
  }
  function b(e) {
    var o;
    let t = e.querySelector("script[data-preliq-props]");
    if (t)
      try {
        let i = (t.textContent || "").trim();
        if (i) {
          if (i.includes("{%") || i.includes("{{"))
            return (
              console.warn(
                "[Preliquify] Script tag contains Liquid expressions - Liquid may not have processed this template. Content:",
                i.substring(0, 200)
              ),
              {}
            );
          let s = l(i);
          return JSON.parse(s);
        }
      } catch (r) {
        (console.warn("[Preliquify] Failed to parse props from script:", r),
          console.warn(
            "[Preliquify] Script content:",
            (o = t.textContent) == null ? void 0 : o.substring(0, 200)
          ));
        try {
          let i = t.textContent || "",
            s = l(i.trim());
          return JSON.parse(s);
        } catch (i) {}
      }
    let n = e.getAttribute("data-preliq-props");
    if (!n) return {};
    try {
      let r = l(n);
      return JSON.parse(r);
    } catch (r) {
      return (console.warn("[Preliquify] Failed to parse props:", n, r), {});
    }
  }
  function h(e) {
    let t = e.getBoundingClientRect(),
      n = Math.max(document.documentElement.clientHeight, window.innerHeight),
      o = Math.max(document.documentElement.clientWidth, window.innerWidth),
      r = 100;
    return !(t.bottom < -r || t.top > n + r || t.right < -r || t.left > o + r);
  }
  function d(e) {
    let t = document.querySelectorAll(
        "[data-preliq-island]:not([data-preliq-hydrated])"
      ),
      n = [],
      o = [];
    if (
      (t.forEach((r) => {
        h(r) ? n.push(r) : o.push(r);
      }),
      n.forEach((r) => {
        c(r, e);
      }),
      o.length > 0 && "IntersectionObserver" in window)
    ) {
      let r = new IntersectionObserver(
        (i) => {
          i.forEach((s) => {
            s.isIntersecting && (c(s.target, e), r.unobserve(s.target));
          });
        },
        { rootMargin: "100px" }
      );
      o.forEach((i) => r.observe(i));
    } else o.forEach((r) => c(r, e));
  }
  function c(e, t) {
    var p;
    if (e.hasAttribute("data-preliq-hydrated")) return;
    let n = e.getAttribute("data-preliq-island"),
      o = e.getAttribute("data-preliq-id");
    if (!n) {
      console.warn("[Preliquify] Island missing component name:", e);
      return;
    }
    let r =
      t.components.get(n) ||
      ((p = window.__PRELIQUIFY__) == null ? void 0 : p[n]);
    if (!r) {
      (console.warn(`[Preliquify] Component "${n}" not found`),
        console.warn(
          "[Preliquify] Available components:",
          Array.from(t.components.keys())
        ),
        console.warn(
          "[Preliquify] Available in window.__PRELIQUIFY__:",
          Object.keys(window.__PRELIQUIFY__ || {})
        ),
        e.setAttribute("data-preliq-error", "component-not-found"));
      return;
    }
    let i = b(e);
    m(e, r, i, t) &&
      (e.setAttribute("data-preliq-hydrated", "true"),
      e.dispatchEvent(
        new CustomEvent("preliquify:hydrated", {
          detail: { id: o, component: n },
          bubbles: !0,
        })
      ));
  }
  function q() {
    if (window.__preliquifyRuntime) return window.__preliquifyRuntime;
    let e = {
      components: new Map(),
      mounted: new Map(),
      errors: [],
      debug: window.__PRELIQUIFY_DEBUG__ || !1,
    };
    return (
      (window.__preliquifyRuntime = e),
      window.__PRELIQUIFY__ || (window.__PRELIQUIFY__ = {}),
      e
    );
  }
  var a = q();
  document.readyState === "loading"
    ? document.addEventListener("DOMContentLoaded", () => {
        document.body && d(a);
      })
    : document.body &&
      ("requestIdleCallback" in window
        ? window.requestIdleCallback(() => d(a))
        : setTimeout(() => d(a), 0));
  window.__PRELIQUIFY__ || (window.__PRELIQUIFY__ = {});
  var E = {
    register(e, t) {
      (a.components.set(e, t),
        (window.__PRELIQUIFY__[e] = t),
        document.body && d(a));
    },
    hydrate(e) {
      (e || document.body)
        .querySelectorAll("[data-preliq-island]:not([data-preliq-hydrated])")
        .forEach((o) => c(o, a));
    },
    getComponent(e) {
      return a.mounted.get(e);
    },
    getErrors() {
      return [...a.errors];
    },
    setDebug(e) {
      a.debug = e;
    },
    unmount(e) {
      let t = a.mounted.get(e);
      if (!t) return !1;
      let n = window.preact;
      return n
        ? (n.render(null, t.element),
          a.mounted.delete(e),
          t.element.removeAttribute("data-preliq-hydrated"),
          !0)
        : !1;
    },
    update(e, t) {
      let n = a.mounted.get(e);
      if (!n) return !1;
      let o = u(u({}, n.props), t);
      return (m(n.element, n.Component, o, a), (n.props = o), !0);
    },
  };
  Object.assign(window.__PRELIQUIFY__, E);
})();
