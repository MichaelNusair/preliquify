import { h } from "preact";
import { render } from "preact";

declare global {
  interface Window {
    Preliquify?: Record<string, any>;
    preact?: any;
  }
}
window.preact = { h, render };
