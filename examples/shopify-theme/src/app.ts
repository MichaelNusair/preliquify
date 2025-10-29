// Example: expose hydrated components globally for runtime bootstrap
import { h } from 'preact';
import { render } from 'preact';
// import CartDrawer from './components/CartDrawer';

declare global {
  interface Window { Preliquify?: Record<string, any>; preact?: any; }
}
window.preact = { h, render };
// window.Preliquify = { CartDrawer };
