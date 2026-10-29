import { gsap } from 'gsap';
import { fine, reduced, markFound } from './util';

/* The cursor. A cartoon one: a chunky orange arrow with a thick ink outline and a hard shadow that leans with the movement and squashes when you press;
   over anything clickable it becomes a pointing hand. Only for a mouse or trackpad, and the real cursor is hidden only once the first move proves it works.
   Also a small label that trails the pointer over anything marked data-cursor="Label" (Replay, View, Copy...). */
const ARROW = '<svg viewBox="0 0 34 34" width="34" height="34"><path d="M6 5 6 27 12 22 16.4 31.4 21.2 29.2 16.8 20 24.6 20Z" fill="#050505" transform="translate(2.4 2.8)"/><path d="M5 3.5 5 25.5 11 20.5 15.4 30 20.2 27.8 15.8 18.6 23.6 18.6Z" fill="#ff5a1f" stroke="#050505" stroke-width="2.6" stroke-linejoin="round"/><path d="M8.6 10.2 8.6 17.2 11.2 15" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" opacity=".85"/></svg>';
const GLOVE = '<svg viewBox="0 0 34 34" width="34" height="34"><path d="M11 5.2A3 3 0 0 1 17 5.2L17 13.4A2.6 2.6 0 0 1 22 13.4A2.6 2.6 0 0 1 27 14.6A2.6 2.6 0 0 1 32 16L32 23C32 27.4 29 30.4 25 30.4L16.5 30.4C13.6 30.4 11.4 29 9.8 26.4L5.2 19.6C4.4 18.4 5.4 17 6.8 17.2C7.8 17.4 9 18.4 11 20.8Z" fill="#050505" transform="translate(2.4 2.8)"/><path d="M11 5.2A3 3 0 0 1 17 5.2L17 13.4A2.6 2.6 0 0 1 22 13.4A2.6 2.6 0 0 1 27 14.6A2.6 2.6 0 0 1 32 16L32 23C32 27.4 29 30.4 25 30.4L16.5 30.4C13.6 30.4 11.4 29 9.8 26.4L5.2 19.6C4.4 18.4 5.4 17 6.8 17.2C7.8 17.4 9 18.4 11 20.8Z" fill="#ff5a1f" stroke="#050505" stroke-width="2.6" stroke-linejoin="round"/><path d="M22 14.6V21.6M27 15.8V21.6" stroke="#050505" stroke-width="2" stroke-linecap="round" opacity=".7"/><path d="M13.2 6.4V11.5" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".85"/></svg>';
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

  // a hard scroll makes it sweat: a drop slides down from its head (scripts/eggs.ts sends this)
  window.addEventListener('aadi:sweat', () => {
    const d = document.createElement('span');
    d.className = 'cc__drop';
    cc.append(d);
    gsap.fromTo(d, { x: 22, y: -2, opacity: 0, scale: 0.5 }, { x: 24, y: 16, opacity: 1, scale: 1, duration: 0.5, ease: 'power2.in' });
    gsap.to(d, { y: 34, opacity: 0, duration: 0.7, delay: 0.5, ease: 'power1.in', onComplete: () => d.remove() });
  });

  /* Leave it alone for 45 seconds and it falls asleep (droops, little z's float up). Any movement wakes it with "Oh! Hi." and counts as an egg found. */
  let asleep = false;
  let sleepT = 0;
  let zT = 0;
  let px = -100;
  let py = -100;
  const sleepAfter = (window as unknown as { __aadiSleepMs?: number }).__aadiSleepMs ?? 45000;
  const zzz = () => {
    const z = document.createElement('span');
    z.className = 'cc__z';
    z.textContent = Math.random() < 0.5 ? 'z' : 'Z';
    cc.append(z);
    gsap.fromTo(z, { x: 18, y: -4, opacity: 0, scale: 0.6 }, { x: 30 + Math.random() * 10, y: -34, opacity: 1, scale: 1, duration: 1.8, ease: 'power1.out', onComplete: () => z.remove() });
    gsap.to(z, { opacity: 0, duration: 0.7, delay: 1.1 });
  };
  const fallAsleep = () => {
    if (asleep || document.hidden || !shown) return;
    asleep = true;
    gsap.to(inner, { rotation: 38, y: 6, duration: 1.2, ease: 'power2.out', overwrite: 'auto' });
    gsap.to(arrow, { scaleY: 0.9, duration: 1.2 });
    zzz();
    zT = window.setInterval(zzz, 1500);
  };
  const wake = () => {
    window.clearTimeout(sleepT);
    sleepT = window.setTimeout(fallAsleep, sleepAfter);
    if (!asleep) return;
    asleep = false;
    window.clearInterval(zT);
    gsap.to(inner, { rotation: 0, y: 0, duration: 0.6, ease: 'elastic.out(1.1, 0.4)', overwrite: 'auto' });
    gsap.to(arrow, { scaleY: 1, duration: 0.3 });
    markFound('sleepy');
    void import('./bubble').then((b) => b.bubble('Oh! Hi.', { x: px + 10, y: py + 26, side: 'below', ms: 1800 }));
  };
  ['pointermove', 'pointerdown', 'keydown', 'wheel', 'scroll', 'touchstart'].forEach((ev) => window.addEventListener(ev, () => wake(), { passive: true }));
  window.addEventListener('pointermove', (e) => { px = e.clientX; py = e.clientY; }, { passive: true });
  sleepT = window.setTimeout(fallAsleep, sleepAfter);
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
