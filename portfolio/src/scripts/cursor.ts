import { gsap } from 'gsap';
import { fine, reduced } from './util';

/* A small label that trails the pointer over anything marked data-cursor="Label" (Replay, View, Copy...). The real cursor is untouched. */
export function initCursor() {
  if (!fine || reduced) return;
  const el = document.createElement('div');
  el.className = 'cur';
  el.setAttribute('aria-hidden', 'true');
  document.body.appendChild(el);
  gsap.set(el, { x: -100, y: -100, scale: 0.6, opacity: 0 });
  const x = gsap.quickTo(el, 'x', { duration: 0.25, ease: 'power3' });
  const y = gsap.quickTo(el, 'y', { duration: 0.25, ease: 'power3' });
  let on = false;

  const hide = () => {
    if (!on) return;
    on = false;
    gsap.to(el, { opacity: 0, scale: 0.6, duration: 0.18, overwrite: 'auto' });
  };

  window.addEventListener('pointermove', (e) => {
    x(e.clientX + 16);
    y(e.clientY + 18);
    const label = (e.target as Element | null)?.closest?.('[data-cursor]')?.getAttribute('data-cursor');
    if (!label) return hide();
    if (el.textContent !== label) el.textContent = label;
    if (!on) {
      on = true;
      gsap.to(el, { opacity: 1, scale: 1, duration: 0.28, ease: 'back.out(2.2)', overwrite: 'auto' });
    }
  }, { passive: true });
  document.documentElement.addEventListener('pointerleave', hide);
}
