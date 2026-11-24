// Bootstraps smooth scroll, then each section script that has its element on the page.
// Every section script exports a default init(). Owners: hero/nav/sheet/loader (A); statement/schools/quote (B); order/promise/footer/eggs (C).
import { startSmooth, ScrollTrigger } from './core';
import initQuoteForms from './quoteform';

const sections: [string, () => Promise<{ default: () => void }>][] = [
  ['[data-loader]', () => import('./loader')],
  ['[data-nav]', () => import('./nav')],
  ['[data-hero]', () => import('./hero')],
  ['[data-sheet]', () => import('./sheet')],
  ['[data-statement]', () => import('./statement')],
  ['[data-schools]', () => import('./schools')],
  ['[data-quote]', () => import('./quote')],
  ['[data-order]', () => import('./order')],
  ['[data-promise]', () => import('./promise')],
  ['[data-footer]', () => import('./footer')],
];

async function boot() {
  startSmooth();
  initQuoteForms();
  for (const [sel, load] of sections) {
    if (document.querySelector(sel)) {
      try { (await load()).default(); } catch (e) { console.warn('section script failed', sel, e); }
    }
  }
  // Easter eggs load last and lazily
  import('./eggs').then((m) => m.default()).catch(() => {});
  requestAnimationFrame(() => ScrollTrigger.refresh());
  window.addEventListener('load', () => ScrollTrigger.refresh());
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
