import { site } from '../data/site';
import { q, fine } from './util';

/* The small, quiet easter eggs. The bigger ones live in their own files (serp.ts) and are loaded only when found. */
export function initEggs() {
  // 1. For anyone who opens the console
  console.log('%cHi, I\'m %s.', 'font:600 22px/1.5 system-ui, sans-serif;color:#ff5a1f', site.short);
  console.log(
    '%cYou found the console. Try typing "seo", "404" or "hello" anywhere on the page, holding Shift over the headline, right-clicking it, or scrolling past the bottom.\nOr just say hi: %s',
    'font:12px/1.7 ui-monospace, monospace',
    site.email || site.url,
  );

  // 2. The tab calls you back
  const title = document.title;
  document.addEventListener('visibilitychange', () => {
    document.title = document.hidden ? 'Come back, I optimised this for you' : title;
  });

  // 3. Type a word anywhere: "seo" opens a made-up search page, "404" a joke error page, "hello" or "hire" the contact section
  let typed = '';
  const lazy = () => import('./eggs-more');
  window.addEventListener('keydown', (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey || e.key.length !== 1) return;
    if ((e.target as Element | null)?.closest?.('input, textarea, select, [contenteditable]')) return;
    typed = (typed + e.key.toLowerCase()).slice(-5);
    if (typed.endsWith('seo')) { typed = ''; void import('./serp').then((m) => m.openSerp()); }
    else if (typed.endsWith('404')) { typed = ''; void lazy().then((m) => m.notFound()); }
    else if (typed.endsWith('hello') || typed.endsWith('hire')) { typed = ''; void lazy().then((m) => m.hello()); }
  });

  if (fine) {
    // 5. Hold Shift with the pointer over the headline: the changing word spins through many more adjectives (hero.ts listens)
    const title = q('[data-hero-title]');
    let over = false;
    let spinning = false;
    const spin = (on: boolean) => { if (on === spinning) return; spinning = on; window.dispatchEvent(new CustomEvent('aadi:spin', { detail: on })); };
    title?.addEventListener('pointerenter', () => { over = true; });
    title?.addEventListener('pointerleave', () => { over = false; spin(false); });
    window.addEventListener('keydown', (e) => { if (e.key === 'Shift' && !e.repeat && over) spin(true); });
    window.addEventListener('keyup', (e) => { if (e.key === 'Shift') spin(false); });
    window.addEventListener('blur', () => spin(false));

    // 6. Right-click the headline: a menu of jokes instead of the browser's
    title?.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      void lazy().then((m) => m.headlineMenu(e.clientX, e.clientY));
    });

    // 7. Keep scrolling when you are already at the bottom: a pixel rocket builds up, then carries you back to the top
    let pull = 0;
    let idle = 0;
    window.addEventListener('wheel', (e) => {
      const atBottom = window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2;
      if (!atBottom || e.deltaY <= 0) {
        if (pull) { pull = 0; void lazy().then((m) => m.rocketRelease()); }
        return;
      }
      pull += e.deltaY;
      window.clearTimeout(idle);
      idle = window.setTimeout(() => { pull = 0; void lazy().then((m) => m.rocketRelease()); }, 700);
      void lazy().then((m) => { if (pull >= 900) { pull = 0; window.clearTimeout(idle); m.rocketLaunch(); } else m.rocketPull(pull); });
    }, { passive: true });
  }

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
