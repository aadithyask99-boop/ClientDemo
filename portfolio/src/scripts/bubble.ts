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

/* Every bubble on screen. They are fixed to the window, so they are cleared when the page scrolls away from where they were popped, or when a sheet
   (pricing, the clock) opens over the page, instead of floating over something else. */
const live = new Map<() => void, number>();
export const clearBubbles = () => [...live.keys()].forEach((f) => f());
window.addEventListener('aadi:lock', (e) => { if ((e as CustomEvent<boolean>).detail) clearBubbles(); });
window.addEventListener('scroll', () => { live.forEach((y0, f) => { if (Math.abs(window.scrollY - y0) > 40) f(); }); }, { passive: true });

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
  let gone = false;
  const out = () => {
    if (gone) return;
    gone = true;
    live.delete(dismiss);
    gsap.to(el, { scale: 0.6, opacity: 0, y: side === 'above' ? 8 : -8, duration: reduced ? 0 : 0.22, ease: 'power2.in', onComplete: () => el.remove() });
  };
  const t = window.setTimeout(out, ms);
  const dismiss = () => { window.clearTimeout(t); out(); };
  live.set(dismiss, window.scrollY);
  return dismiss;
}
