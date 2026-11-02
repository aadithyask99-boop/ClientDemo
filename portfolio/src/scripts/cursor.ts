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
  const inner = cc.querySelector<HTMLElement>('.cc__in')!;

  /* Moving the cursor is the hottest path on the page, so it does the least: a pointer event only records where the pointer is; one frame callback writes
     the position. (Earlier this created and killed animations on every pointer event.) The hand/arrow swap is a CSS class, checked only when the pointer
     enters a different element. */
  let x = -100;
  let y = -100;
  let lastX = 0;
  let swing = 0; // the lean from sideways speed, fades out by itself
  let tilt = 0; // what is shown, easing toward (resting lean + swing)
  let asleep = false;
  let shown = false;
  let raf = 0;
  let target: EventTarget | null = null;
  const press = { s: 1 };
  let labelFor: (t: Element | null) => void = () => undefined; // set below, unless motion is reduced
  const draw = () => {
    raf = 0;
    const want = (asleep ? 38 : 0) + swing;
    tilt += (want - tilt) * 0.22;
    swing *= 0.82;
    cc.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${press.s})`;
    inner.style.transform = `rotate(${tilt.toFixed(2)}deg)`;
    if (Math.abs(want - tilt) > 0.05 || Math.abs(swing) > 0.05) raf = requestAnimationFrame(draw);
  };
  const schedule = () => { if (!raf) raf = requestAnimationFrame(draw); };

  window.addEventListener('pointermove', (e) => {
    if (e.pointerType === 'touch') return;
    x = e.clientX;
    y = e.clientY;
    if (!reduced) swing = Math.max(-22, Math.min(22, (x - lastX) * 1.4));
    lastX = x;
    if (!shown) { shown = true; root.classList.add('cc-on'); }
    cc.style.opacity = '1';
    if (e.target !== target) {
      target = e.target;
      const el = target as Element | null;
      cc.classList.toggle('is-hand', !!el?.closest?.(INTERACTIVE));
      labelFor(el);
    }
    schedule();
  }, { passive: true });
  window.addEventListener('pointerdown', () => { gsap.to(press, { s: 0.82, duration: 0.1, onUpdate: schedule, overwrite: true }); });
  window.addEventListener('pointerup', () => { gsap.to(press, { s: 1, duration: 0.45, ease: 'elastic.out(1.2, 0.4)', onUpdate: schedule, overwrite: true }); });
  root.addEventListener('pointerleave', () => { cc.style.opacity = '0'; });

  // a hard scroll makes it sweat: a drop slides down from its head (scripts/eggs.ts sends this)
  window.addEventListener('aadi:sweat', () => {
    const d = document.createElement('span');
    d.className = 'cc__drop';
    cc.append(d);
    gsap.fromTo(d, { x: 22, y: -2, opacity: 0, scale: 0.5 }, { x: 24, y: 16, opacity: 1, scale: 1, duration: 0.5, ease: 'power2.in' });
    gsap.to(d, { y: 34, opacity: 0, duration: 0.7, delay: 0.5, ease: 'power1.in', onComplete: () => d.remove() });
  });

  /* Leave it alone for 45 seconds and it falls asleep (droops, little z's float up). Any movement wakes it with "Oh! Hi." and counts as an egg found. */
  let sleepT = 0;
  let zT = 0;
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
    schedule();
    zzz();
    zT = window.setInterval(zzz, 1500);
  };
  const wake = () => {
    window.clearTimeout(sleepT);
    sleepT = window.setTimeout(fallAsleep, sleepAfter);
    if (!asleep) return;
    asleep = false;
    window.clearInterval(zT);
    swing = -26; // a little startled wobble as it comes round
    schedule();
    markFound('sleepy');
    void import('./bubble').then((b) => b.bubble('Oh! Hi.', { x: x + 10, y: y + 26, side: 'below', ms: 1800 }));
  };
  ['pointermove', 'pointerdown', 'keydown', 'wheel', 'scroll', 'touchstart'].forEach((ev) => window.addEventListener(ev, wake, { passive: true }));
  sleepT = window.setTimeout(fallAsleep, sleepAfter);

  /* The small label that trails the pointer over anything marked data-cursor="Label" (Replay, View, Copy...) */
  if (reduced) return;
  const el = document.createElement('div');
  el.className = 'cur';
  el.setAttribute('aria-hidden', 'true');
  document.body.appendChild(el);
  gsap.set(el, { x: -100, y: -100, scale: 0.6, opacity: 0 });
  const lx = gsap.quickTo(el, 'x', { duration: 0.25, ease: 'power3' });
  const ly = gsap.quickTo(el, 'y', { duration: 0.25, ease: 'power3' });
  let on = false;
  const hide = () => {
    if (!on) return;
    on = false;
    gsap.to(el, { opacity: 0, scale: 0.6, duration: 0.18, overwrite: 'auto' });
  };
  window.addEventListener('pointermove', (e) => { lx(e.clientX + 26); ly(e.clientY + 28); }, { passive: true });
  labelFor = (t) => {
    const label = t?.closest?.('[data-cursor]')?.getAttribute('data-cursor');
    if (!label) return hide();
    if (el.textContent !== label) el.textContent = label;
    if (!on) {
      on = true;
      gsap.to(el, { opacity: 1, scale: 1, duration: 0.28, ease: 'back.out(2.2)', overwrite: 'auto' });
    }
  };
  root.addEventListener('pointerleave', hide);
  // scrolling moves content under a still pointer, so the label would be left pointing at the wrong thing until the next move
  window.addEventListener('scroll', hide, { passive: true });
}
