import { flags, fine, reduce } from './flags';

// Soft warm light that trails the pointer on the dark sections, and a gentle pull on Book buttons.
export function initCursor() {
  if (!fine || reduce) return;

  const glow = document.querySelector<HTMLElement>('[data-glow]');
  let tx = innerWidth / 2;
  let ty = innerHeight / 2;
  let x = tx;
  let y = ty;
  let seen = false;

  addEventListener(
    'pointermove',
    (e) => {
      tx = e.clientX;
      ty = e.clientY;
      if (!seen) {
        seen = true;
        x = tx;
        y = ty;
      }
      glow?.classList.toggle('live', flags.has('glow'));
    },
    { passive: true },
  );
  document.addEventListener('pointerleave', () => glow?.classList.remove('live'));

  const loop = () => {
    x += (tx - x) * 0.07;
    y += (ty - y) * 0.07;
    if (glow) glow.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);

  // Magnetic pull, delegated so buttons added later (quiz result) work too
  let active: HTMLElement | null = null;
  document.addEventListener(
    'pointermove',
    (e) => {
      const target = (e.target as Element | null)?.closest<HTMLElement>('[data-magnet]') ?? null;
      if (active && active !== target) {
        active.style.transform = '';
        active = null;
      }
      if (!target || !flags.has('magnet')) return;
      active = target;
      const r = target.getBoundingClientRect();
      const dx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
      const dy = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
      target.style.transform = `translate(${dx * 7}px, ${dy * 5}px)`;
    },
    { passive: true },
  );
  document.addEventListener('pointerleave', () => {
    if (active) active.style.transform = '';
    active = null;
  });
}
