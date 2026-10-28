import { gsap } from 'gsap';
import { q, qa, fine } from './util';

/* Hover a project in the Work list and a picture of the real site follows the pointer. Mouse only; the pictures are fetched when the browser is idle. */
export function initWork() {
  const box = q('[data-peek-box]');
  if (!box || !fine) return;
  const imgs = qa<HTMLImageElement>('[data-peek-img]', box);
  const rows = qa('[data-peek]');

  const load = () => imgs.forEach((i) => { if (i.dataset.src && !i.getAttribute('src')) i.src = i.dataset.src; });
  const idle = (window as Window & { requestIdleCallback?: (cb: () => void) => number }).requestIdleCallback;
  if (idle) idle(load);
  else window.setTimeout(load, 1500);

  gsap.set(box, { x: -500, y: -500, scale: 0.85, opacity: 0 });
  const mx = gsap.quickTo(box, 'x', { duration: 0.4, ease: 'power3' });
  const my = gsap.quickTo(box, 'y', { duration: 0.4, ease: 'power3' });

  rows.forEach((r) => {
    r.addEventListener('pointerenter', () => {
      imgs.forEach((i) => i.classList.toggle('is-on', i.dataset.peekImg === r.dataset.peek));
      gsap.to(box, { opacity: 1, scale: 1, duration: 0.3, ease: 'back.out(1.8)', overwrite: 'auto' });
    });
    r.addEventListener('pointerleave', () => gsap.to(box, { opacity: 0, scale: 0.85, duration: 0.2, overwrite: 'auto' }));
    r.addEventListener('pointermove', (e) => {
      const pe = e as PointerEvent;
      const w = box.offsetWidth;
      const h = box.offsetHeight;
      const x = pe.clientX + 28 + w > window.innerWidth - 8 ? pe.clientX - 28 - w : pe.clientX + 28; // flip to the left near the edge
      mx(x);
      my(Math.min(Math.max(8, pe.clientY - h / 2), window.innerHeight - h - 8));
    });
  });
}
