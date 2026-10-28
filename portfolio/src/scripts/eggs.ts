import { site } from '../data/site';
import { q } from './util';

/* The small, quiet easter eggs. The bigger ones live in their own files (serp.ts) and are loaded only when found. */
export function initEggs() {
  // 1. For anyone who opens the console
  console.log('%cHi, I\'m %s.', 'font:600 22px/1.5 system-ui, sans-serif;color:#ff5a1f', site.short);
  console.log(
    '%cYou found the console. Try typing "seo" anywhere on the page, or clicking the pixel icon five times.\nOr just say hi: %s',
    'font:12px/1.7 ui-monospace, monospace',
    site.email || site.url,
  );

  // 2. The tab calls you back
  const title = document.title;
  document.addEventListener('visibilitychange', () => {
    document.title = document.hidden ? 'Come back, I optimised this for you' : title;
  });

  // 3. Type "seo" anywhere
  let typed = '';
  window.addEventListener('keydown', (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey || e.key.length !== 1) return;
    if ((e.target as Element | null)?.closest?.('input, textarea, select, [contenteditable]')) return;
    typed = (typed + e.key.toLowerCase()).slice(-3);
    if (typed === 'seo') {
      typed = '';
      void import('./serp').then((m) => m.openSerp());
    }
  });

  // 4. The same egg for phones, where there is no keyboard: click the hero pixel icon five times, quickly
  const icon = q('.hero__pixel');
  let taps: number[] = [];
  icon?.addEventListener('click', () => {
    const now = performance.now();
    taps = [...taps.filter((t) => now - t < 2200), now];
    if (taps.length >= 5) {
      taps = [];
      void import('./serp').then((m) => m.openSerp());
    }
  });
}
