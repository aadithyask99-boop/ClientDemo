import { gsap } from 'gsap';
import { reduced } from './util';

/* A cartoon speech bubble: thick ink outline, a hard orange shadow, a little tail. It pops in, waits, and pops out. Used for the hints and the small replies
   of the easter eggs. `x`/`y` is the point the tail points at; `side` says whether the bubble sits above that point or below it. */
export interface BubbleOpts {
  x: number;
  y: number;
  side?: 'above' | 'below';
  ms?: number;
  html?: boolean;
}

export function bubble(text: string, { x, y, side = 'above', ms = 3600, html = false }: BubbleOpts) {
  const el = document.createElement('div');
  el.className = `bub bub--${side}`;
  el.setAttribute('role', 'status');
  if (html) el.innerHTML = text;
  else el.textContent = text;
  el.style.rotate = `${(Math.random() * 4 - 2).toFixed(1)}deg`;
  document.body.append(el);
  const w = el.offsetWidth;
  const h = el.offsetHeight;
  const left = Math.max(10, Math.min(x - 28, window.innerWidth - w - 10));
  const top = side === 'above' ? Math.max(10, y - h - 16) : Math.min(window.innerHeight - h - 10, y + 16);
  el.style.left = `${left}px`;
  el.style.top = `${top}px`;
  el.style.setProperty('--tail', `${Math.max(14, Math.min(x - left, w - 30))}px`);
  gsap.fromTo(el, { scale: 0.2, opacity: 0, transformOrigin: `${x - left}px ${side === 'above' ? '100%' : '0%'}` }, { scale: 1, opacity: 1, duration: reduced ? 0 : 0.5, ease: 'elastic.out(1, 0.55)' });
  const out = () => gsap.to(el, { scale: 0.6, opacity: 0, y: side === 'above' ? 8 : -8, duration: reduced ? 0 : 0.22, ease: 'power2.in', onComplete: () => el.remove() });
  const t = window.setTimeout(out, ms);
  return () => { window.clearTimeout(t); out(); };
}
