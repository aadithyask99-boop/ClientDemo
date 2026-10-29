import { q, fine, reduced, found } from './util';
import { bubble } from './bubble';

/* Little cartoon bubbles that say what can be tried, so the easter eggs do not stay secret for ever:
   - the word spinner's hint ("Hold Shift. Anywhere."), 3 s after the headline lands and once more a minute later (on a phone: "Press and hold the headline")
   - every so often a bubble pops up somewhere at the side of the screen with another thing to try ("Type hello", "Right-click the headline"...)
   Each is shown only until it has been found (or twice), never while something is open, and never more than six times a visit. Loaded a few seconds after the first screen. */
const shown = new Map<string, number>();
let total = 0;
let lastShiftHint = -1e9;

const busy = () => !!document.querySelector('.serp, .crawl, .nf, .ctx, .clk:not([hidden]), .pr:not([hidden]), .menu[open], .bub');

export function initHints() {
  const title = q('[data-hero-title]');
  const kbd = (k: string) => `<kbd>${k}</kbd>`;

  /* The word spinner. Three seconds after the headline has landed a bubble says how to use it, goes away, comes once more a minute later, and after that it
     is left alone (a visitor who rests the pointer on the headline may get one more nudge). Gone for the rest of the visit once the spinner has been used (it comes back on the next visit). */
  let shiftShown = 0;
  let usedShift = false; // this visit only: someone who tried it last time still gets the hint on their next visit
  let dismiss: (() => void) | null = null;
  const showShift = (x?: number) => {
    if (!title || reduced || usedShift || busy() || shiftShown >= 3) return false;
    const r = title.getBoundingClientRect();
    if (r.bottom < 0 || r.top > window.innerHeight) return false;
    shiftShown++;
    lastShiftHint = performance.now();
    dismiss = fine
      ? bubble(`Hold ${kbd('Shift')}. Anywhere.`, { x: Math.min(Math.max(x ?? r.left + r.width * 0.3, r.left + 60), r.right - 60), y: r.top + 8, side: 'above', ms: 4200, html: true })
      : bubble('Press and hold the headline!', { x: r.left + r.width / 2, y: r.bottom - 2, side: 'below', ms: 4200 });
    return true;
  };
  if (title && !reduced) {
    // three seconds after the headline has really landed (main.ts records the moment), however long the page took to get there
    const landedAt = (window as unknown as { __aadiLandedAt?: number }).__aadiLandedAt;
    const fire = () => {
      window.setTimeout(() => {
        if (!showShift()) window.setTimeout(() => showShift(), 8000); // it was scrolled away: once more shortly after
        window.setTimeout(() => showShift(), 60000);
      }, Math.max(300, (landedAt ?? performance.now()) + 3000 - performance.now()));
    };
    if (landedAt) fire();
    else window.addEventListener('aadi:landed', fire, { once: true });
    if (fine) {
      let t = 0;
      title.addEventListener('pointerenter', (e) => {
        if (usedShift || performance.now() - lastShiftHint < 15000) return;
        t = window.setTimeout(() => showShift((e as PointerEvent).clientX), 700);
      });
      title.addEventListener('pointerleave', () => window.clearTimeout(t));
    }
    // pressing Shift is the answer: the bubble goes
    window.addEventListener('keydown', (e) => { if (e.key === 'Shift') { usedShift = true; dismiss?.(); dismiss = null; } });
    window.addEventListener('aadi:spin', (e) => { if ((e as CustomEvent<boolean>).detail) { usedShift = true; dismiss?.(); dismiss = null; } }); // the press-and-hold on a phone
  }

  /* the random ones */
  const pool: { id: string; text: string }[] = fine
    ? [
        { id: 'hello', text: `Type ${'<b>hello</b>'} anywhere` },
        { id: 'hire', text: `Psst. Try typing ${'<b>hire</b>'}` },
        { id: 'menu', text: 'Right-click the headline' },
        { id: 'rocket', text: 'Scroll past the very bottom' },
        { id: 'globe', text: 'Click &ldquo;Remote worldwide&rdquo;' },
      ]
    : [
        { id: 'globe', text: 'Tap &ldquo;Remote worldwide&rdquo;' },
      ];
  const between = (a: number, b: number) => a + Math.random() * (b - a);
  let last = performance.now();
  ['pointermove', 'scroll', 'keydown', 'touchstart'].forEach((ev) => window.addEventListener(ev, () => { last = performance.now(); }, { passive: true }));

  const pop = () => {
    if (total >= 8 || document.hidden || busy() || performance.now() - last > 12000) return;
    const left = pool.filter((h) => !found(h.id) && (shown.get(h.id) ?? 0) < 1);
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
  window.setTimeout(() => { pop(); window.setInterval(pop, 22000); }, 25000); // the other hints wait until the spinner's have had their turn
}
