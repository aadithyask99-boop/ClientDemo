import { playIntro } from './intro';
import { mountGlass } from './glass';
import { initSections } from './sections';

declare global {
  interface Window { __halcyon?: boolean }
}

window.__halcyon = true;

const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const sections = initSections(reduce);

// Three.js is large and compiling its shaders blocks the page for a moment, so the glass objects load only
// once the intro has finished. Static fallbacks show until then.
const idle = (cb: () => void) =>
  typeof window.requestIdleCallback === 'function' ? window.requestIdleCallback(cb, { timeout: 2500 }) : window.setTimeout(cb, 600);
const glass = () => idle(() => { mountGlass(reduce).catch(() => {}).then(() => sections.warm()); });

if (document.documentElement.classList.contains('js') && !reduce) {
  playIntro().then(glass, () => { document.documentElement.classList.remove('js'); glass(); });
} else {
  glass();
}
