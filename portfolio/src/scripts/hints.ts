import { q, fine, reduced, found } from './util';
import { bubble } from './bubble';

/* Little cartoon bubbles that say what can be tried, so the easter eggs do not stay secret for ever:
   - hover the headline for a moment and "Hold Shift!" pops up (on a phone: "Press and hold me")
   - every so often a bubble pops up somewhere at the side of the screen with another thing to try ("Type hello", "Right-click the headline"...)
   Each is shown only until it has been found (or twice), never while something is open, and never more than six times a visit. Loaded a few seconds after the first screen. */
const shown = new Map<string, number>();
let total = 0;
let lastShiftHint = -1e9;

const busy = () => !!document.querySelector('.serp, .crawl, .nf, .ctx, .clk:not([hidden]), .bub');

export function initHints() {
  const title = q('[data-hero-title]');
  const kbd = (k: string) => `<kbd>${k}</kbd>`;

  /* the headline: shown once the pointer has rested on it, or (phones) once, a few seconds in */
  if (title && !reduced) {
    if (fine) {
      let t = 0;
      let dismiss: (() => void) | null = null;
      title.addEventListener('pointerenter', (e) => {
        if (found('shift') || (shown.get('shift') ?? 0) >= 8 || busy() || performance.now() - lastShiftHint < 6000) return;
        t = window.setTimeout(() => {
          lastShiftHint = performance.now();
          shown.set('shift', (shown.get('shift') ?? 0) + 1);
          const r = title.getBoundingClientRect();
          dismiss = bubble(`Hold ${kbd('Shift')} here!`, { x: Math.min(Math.max((e as PointerEvent).clientX, r.left + 60), r.right - 60), y: r.top + 8, side: 'above', ms: 3400, html: true });
        }, 500);
      });
      title.addEventListener('pointerleave', () => window.clearTimeout(t));
      // pressing Shift is the answer: the bubble goes
      window.addEventListener('keydown', (e) => { if (e.key === 'Shift') { window.clearTimeout(t); dismiss?.(); dismiss = null; } });
    } else {
      window.setTimeout(() => {
        const r = title.getBoundingClientRect();
        if (found('shift') || r.bottom < 0 || r.top > window.innerHeight || busy()) return;
        bubble('Press and hold me!', { x: r.left + r.width / 2, y: r.bottom - 2, side: 'below', ms: 3800 });
      }, 1500);
    }
  }

  // once the sentence has settled, if the word spinner has not been found, the bubble comes by itself (and again from time to time while the headline is on screen)
  if (title && fine && !reduced) {
    const auto = () => {
      const r = title.getBoundingClientRect();
      if (found('shift') || document.hidden || busy() || r.bottom < 0 || r.top > window.innerHeight || performance.now() - lastShiftHint < 20000) return;
      lastShiftHint = performance.now();
      shown.set('shift', (shown.get('shift') ?? 0) + 1);
      bubble(`Hold ${kbd('Shift')} over this headline!`, { x: r.left + r.width * 0.3, y: r.top + 6, side: 'above', ms: 3600, html: true });
    };
    window.setTimeout(() => { auto(); window.setInterval(auto, 14000); }, 2500);
  }

  /* the random ones */
  const pool: { id: string; text: string }[] = fine
    ? [
        { id: 'hello', text: `Type ${'<b>hello</b>'} anywhere` },
        { id: 'hire', text: `Psst. Try typing ${'<b>hire</b>'}` },
        { id: 'menu', text: 'Right-click the headline' },
        { id: 'shift', text: `Hold ${kbd('Shift')} over the headline` },
        { id: 'rocket', text: 'Scroll past the very bottom' },
        { id: 'globe', text: 'Click &ldquo;Remote worldwide&rdquo;' },
      ]
    : [
        { id: 'shift', text: 'Press and hold the headline' },
        { id: 'globe', text: 'Tap &ldquo;Remote worldwide&rdquo;' },
      ];
  const between = (a: number, b: number) => a + Math.random() * (b - a);
  let last = performance.now();
  ['pointermove', 'scroll', 'keydown', 'touchstart'].forEach((ev) => window.addEventListener(ev, () => { last = performance.now(); }, { passive: true }));

  const pop = () => {
    if (total >= 8 || document.hidden || busy() || performance.now() - last > 12000) return;
    const left = pool.filter((h) => !found(h.id) && (shown.get(h.id) ?? 0) < (h.id === 'shift' ? 3 : 1));
    if (!left.length) return;
    const h = left[Math.floor(Math.random() * left.length)];
    shown.set(h.id, (shown.get(h.id) ?? 0) + 1);
    total++;
    // somewhere near the edge of the screen, away from the middle where the reading happens
    const rightSide = Math.random() < 0.5;
    const x = window.innerWidth * (rightSide ? between(0.72, 0.9) : between(0.08, 0.26));
    const y = window.innerHeight * between(0.3, 0.8);
    bubble(h.text, { x, y, side: Math.random() < 0.5 ? 'above' : 'below', ms: 4200, html: true });
  };
  window.setTimeout(() => { pop(); window.setInterval(pop, 22000); }, 12000);
}
