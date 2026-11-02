import { gsap } from 'gsap';
import { PATTERNS, ORDER, type PatternName } from './patterns';
import { reduced } from './util';

export interface Pixel {
  /** Scatter the squares, then regroup as the next pattern (or a named one) */
  morph(to?: PatternName, fast?: boolean): void;
  /** Same as morph, but quick: used when something pokes the icon */
  burst(): void;
  start(every?: number): void;
  stop(): void;
}

/* A 7x7 grid of squares that scatters and reforms as a different shape. Only transform and opacity move, so it never shifts the layout. */
export function initPixel(el: HTMLElement, order: PatternName[] = ORDER): Pixel {
  const cells = [...el.children] as HTMLElement[];
  const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#ff5a1f';
  const ink = '#0a0a0a';
  const bits = (n: PatternName) => PATTERNS[n].flatMap((row) => [...row].map((c) => c === '#'));
  let idx = 0;
  let tl: gsap.core.Timeline | null = null;
  let timer = 0;

  function morph(to?: PatternName, fast = false) {
    if (reduced) return;
    idx = to ? order.indexOf(to) : (idx + 1) % order.length;
    const on = bits(order[idx]);
    const s = cells[0].getBoundingClientRect().width || 8;
    const k = fast ? 0.6 : 1;
    const r = gsap.utils.random;
    tl?.kill();
    tl = gsap.timeline();
    // the squares fly apart...
    tl.to(cells, { x: () => r(-2.4, 2.4) * s, y: () => r(-2.4, 2.4) * s, scale: () => r(0.5, 1.9), duration: 0.26 * k, ease: 'power2.out', stagger: { each: 0.003, from: 'random' } }, 0);
    // ...a few flash to black on the way...
    tl.set(cells.filter(() => Math.random() < 0.22), { backgroundColor: ink }, 0.1 * k);
    // ...what is lit changes while they are in the air...
    tl.add(() => cells.forEach((c, i) => { c.style.opacity = on[i] ? '1' : '0'; }), 0.28 * k);
    // ...and they regroup as the next shape
    tl.to(cells, { x: 0, y: 0, scale: 1, backgroundColor: accent, duration: 0.5 * k, ease: 'back.out(1.4)', stagger: { each: 0.004, from: 'random' } }, 0.3 * k);
  }

  return {
    morph,
    burst: () => morph(undefined, true),
    start(every = 3600) {
      if (reduced || timer) return;
      timer = window.setInterval(() => { if (!document.hidden) morph(); }, every);
    },
    stop() {
      window.clearInterval(timer);
      timer = 0;
    },
  };
}
