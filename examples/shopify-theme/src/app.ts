import { render } from "preact";

declare global {
  interface Window {
    Preliquify?: Record<string, any>;
    preact?: any;
  }
}

// eslint-disable-next-line no-undef
window.preact = { h, render };
