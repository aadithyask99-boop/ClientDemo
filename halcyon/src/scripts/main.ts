import { playIntro } from './intro';
import { mountGlass } from './glass';

declare global {
  interface Window { __halcyon?: boolean }
}

window.__halcyon = true;

const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (document.documentElement.classList.contains('js') && !reduce) {
  playIntro().catch(() => document.documentElement.classList.remove('js'));
}

// Three.js is large, so it loads after the page is up. Static fallbacks show until then.
const idle = (cb: () => void) =>
  'requestIdleCallback' in window ? window.requestIdleCallback(cb, { timeout: 2500 }) : window.setTimeout(cb, 600);
idle(() => { mountGlass(reduce).catch(() => {}); });
