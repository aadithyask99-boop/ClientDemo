import { gsap } from 'gsap';
import { fine, reduced } from './util';

/* The cursor. A cartoon one: a chunky orange arrow with a thick ink outline and a hard shadow that leans with the movement and squashes when you press;
   over anything clickable it becomes a pointing glove. Only for a mouse or trackpad, and the real cursor is hidden only once the first move proves it works.
   Also a small label that trails the pointer over anything marked data-cursor="Label" (Replay, View, Copy...). */
const ARROW = '<svg viewBox="0 0 34 34" width="34" height="34"><path d="M6 5 6 27 12 22 16.4 31.4 21.2 29.2 16.8 20 24.6 20Z" fill="#050505" transform="translate(2.4 2.8)"/><path d="M5 3.5 5 25.5 11 20.5 15.4 30 20.2 27.8 15.8 18.6 23.6 18.6Z" fill="#ff5a1f" stroke="#050505" stroke-width="2.6" stroke-linejoin="round"/><path d="M8.6 10.2 8.6 17.2 11.2 15" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" opacity=".85"/></svg>';
const GLOVE = '<svg viewBox="0 0 34 34" width="34" height="34"><g transform="translate(2.4 2.8)" fill="#050505"><rect x="12" y="2" width="7" height="17" rx="3.5"/><rect x="7" y="14" width="19" height="15" rx="7"/></g><g fill="#fffdf5" stroke="#050505" stroke-width="2.6" stroke-linejoin="round"><rect x="12" y="2" width="7" height="17" rx="3.5"/><rect x="7" y="14" width="19" height="15" rx="7"/><path d="M9 18.5C5.5 17.5 3.5 20 5 22.5L8 26.5"/></g><path d="M14 22.5 14 25.5M18 22.5 18 25.5M22 22.5 22 25.5" stroke="#050505" stroke-width="1.8" stroke-linecap="round" opacity=".55"/></svg>';
const INTERACTIVE = 'a[href], button, summary, [role="button"], [data-cursor], .card, input, select, label[for]';

export function initCursor() {
  if (!fine) return;
  const root = document.documentElement;
  const cc = document.createElement('div');
  cc.className = 'cc';
  cc.setAttribute('aria-hidden', 'true');
  cc.innerHTML = `<span class="cc__in"><span class="cc__a">${ARROW}</span><span class="cc__h">${GLOVE}</span></span>`;
  document.body.appendChild(cc);
  gsap.set(cc, { x: -100, y: -100 });
  const inner = cc.querySelector<HTMLElement>('.cc__in')!;
  const arrow = cc.querySelector<HTMLElement>('.cc__a')!;
  const hand = cc.querySelector<HTMLElement>('.cc__h')!;
  gsap.set(hand, { opacity: 0, scale: 0.6 });
  let overHand = false;
  let lastX = 0;
  let tilt = 0;
  let shown = false;
  const setHand = (on: boolean) => {
    if (on === overHand) return;
    overHand = on;
    gsap.to(arrow, { opacity: on ? 0 : 1, scale: on ? 0.6 : 1, duration: 0.16, overwrite: 'auto' });
    gsap.to(hand, { opacity: on ? 1 : 0, scale: on ? 1 : 0.6, duration: 0.2, ease: 'back.out(2.4)', overwrite: 'auto' });
  };
  window.addEventListener('pointermove', (e) => {
    if (e.pointerType === 'touch') return;
    if (!shown) { shown = true; root.classList.add('cc-on'); }
    gsap.set(cc, { x: e.clientX, y: e.clientY, opacity: 1 });
    if (!reduced) {
      tilt += (Math.max(-22, Math.min(22, (e.clientX - lastX) * 1.4)) - tilt) * 0.5;
      gsap.to(inner, { rotation: tilt, duration: 0.3, ease: 'power2.out', overwrite: 'auto' }); // leans with the sideways speed, and settles
    }
    lastX = e.clientX;
    setHand(!!(e.target as Element | null)?.closest?.(INTERACTIVE));
  }, { passive: true });
  window.addEventListener('pointerdown', () => { gsap.to(cc, { scale: 0.82, duration: 0.1, overwrite: 'auto' }); });
  window.addEventListener('pointerup', () => { gsap.to(cc, { scale: 1, duration: 0.45, ease: 'elastic.out(1.2, 0.4)', overwrite: 'auto' }); });
  document.documentElement.addEventListener('pointerleave', () => gsap.to(cc, { opacity: 0, duration: 0.15 }));
  if (reduced) return;
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
    x(e.clientX + 26);
    y(e.clientY + 28);
    const label = (e.target as Element | null)?.closest?.('[data-cursor]')?.getAttribute('data-cursor');
    if (!label) return hide();
    if (el.textContent !== label) el.textContent = label;
    if (!on) {
      on = true;
      gsap.to(el, { opacity: 1, scale: 1, duration: 0.28, ease: 'back.out(2.2)', overwrite: 'auto' });
    }
  }, { passive: true });
  document.documentElement.addEventListener('pointerleave', hide);
  // scrolling moves content under a still pointer, so the label would be left pointing at the wrong thing until the next move
  window.addEventListener('scroll', hide, { passive: true });
}
