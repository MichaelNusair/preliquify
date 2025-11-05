/**
 * Constants used throughout the compiler
 */

/**
 * External packages that should not be bundled
 */
export const EXTERNAL_PACKAGES = [
  "preact",
  "preact/hooks",
  "preact-render-to-string",
] as const;

/**
 * Default build concurrency - number of files to process in parallel
 */
export const DEFAULT_CONCURRENCY = 4;

/**
 * Watch mode debounce delay in milliseconds
 */
export const WATCH_DEBOUNCE_MS = 300;

/**
 * Common browser API error patterns
 */
export const BROWSER_API_ERRORS = [
  "window is not defined",
  "document is not defined",
  "localStorage is not defined",
  "HTMLElement is not defined",
  "Cannot read property",
  "Cannot access",
] as const;

/**
 * Liquid expression error patterns with suggested fixes
 */
export const LIQUID_EXPRESSION_ERRORS = [
  {
    pattern: /\.map is not a function/i,
    fix: "Use <For /> primitive instead of .map() for Liquid collections",
  },
  {
    pattern: /\.filter is not a function/i,
    fix: "Use <Conditional /> or <Choose /> with Liquid expressions instead of .filter()",
  },
  {
    pattern: /\.reduce is not a function/i,
    fix: "Use Liquid filters or <For /> with accumulation instead of .reduce()",
  },
  {
    pattern: /\.forEach is not a function/i,
    fix: "Use <For /> primitive instead of .forEach() for Liquid collections",
  },
  {
    pattern: /\.length/i,
    fix: "Use Liquid's 'size' filter or render conditionally with <Conditional />",
  },
] as const;

/**
 * esbuild configuration for component bundling
 */
export const ESBUILD_COMPONENT_CONFIG = {
  format: "esm" as const,
  platform: "node" as const,
  jsx: "automatic" as const,
  jsxImportSource: "preact",
  treeShaking: true,
  minifySyntax: true,
  minifyIdentifiers: false,
  target: "node14" as const,
  legalComments: "none" as const,
};

/**
 * esbuild configuration for client runtime
 */
export const ESBUILD_RUNTIME_CONFIG = {
  format: "iife" as const,
  platform: "browser" as const,
  minify: true,
  target: ["es2015"],
  treeShaking: true,
  mangleProps: /^_/,
  legalComments: "none" as const,
  pure: ["console.log"],
  drop: ["debugger"],
  globalName: "PreliquifyRuntime",
};

/**
 * Fallback runtime for when enhanced runtime build fails
 */
export const FALLBACK_RUNTIME = `
(function(){
  function parseProps(el){
    try { return JSON.parse(el.getAttribute('data-preliq-props')); }
    catch(_) { return {}; }
  }
  function mount(){
    var nodes = document.querySelectorAll('[data-preliq-island]');
    for (var i=0;i<nodes.length;i++){
      var el = nodes[i];
      var name = el.getAttribute('data-preliq-island');
      var id = el.getAttribute('data-preliq-id');
      var Comp = (window.Preliquify||{})[name];
      if (!Comp) continue;
      var props = parseProps(el) || {};
      if (window.preact) {
        window.preact.render(window.preact.h(Comp, props), el);
      }
    }
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount);
  } else {
    mount();
  }
})();
`;
