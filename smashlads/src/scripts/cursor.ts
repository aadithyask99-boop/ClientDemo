import gsap from 'gsap';

// A cartoon burger cursor for mice only. Touch and keyboard users keep their normal pointer.
export function initCursor(reduce: boolean) {
  if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  const el = document.querySelector('[data-cursor]') as HTMLElement | null;
  if (!el) return;
  const root = document.documentElement;
  root.classList.add('has-cursor');
  const mx = gsap.quickTo(el, 'x', { duration: reduce ? 0 : 0.12, ease: 'power3.out' });
  const my = gsap.quickTo(el, 'y', { duration: reduce ? 0 : 0.12, ease: 'power3.out' });
  const rot = gsap.quickTo(el, 'rotation', { duration: 0.3, ease: 'power3.out' });
  let lx = 0, shown = false, crumbT = 0;
  addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    if (!shown) { shown = true; el.classList.add('is-on'); }
    mx(e.clientX); my(e.clientY);
    rot(Math.max(-18, Math.min(18, (e.clientX - lx) * 0.8))); lx = e.clientX;
    const t = e.target as HTMLElement;
    el.classList.toggle('is-link', !!t.closest('a,button,[data-part],.layer,.chip,.card,input,textarea,select,.cat__name'));
    el.classList.toggle('is-game', !!t.closest('canvas'));
    if (!reduce && performance.now() - crumbT > 90 && Math.random() < 0.35) {
      crumbT = performance.now();
      const c = document.createElement('i'); c.className = 'crumb';
      c.style.left = e.clientX + 'px'; c.style.top = e.clientY + 'px'; document.body.appendChild(c);
      gsap.fromTo(c, { scale: 1, opacity: 0.9 }, { y: 28 + Math.random() * 20, x: (Math.random() - 0.5) * 30, scale: 0, opacity: 0, rotation: Math.random() * 180, duration: 0.7, ease: 'power1.in', onComplete: () => c.remove() });
    }
  });
  document.addEventListener('pointerleave', () => el.classList.remove('is-on'));
  addEventListener('pointerdown', () => { el.classList.add('is-down'); });
  addEventListener('pointerup', () => { el.classList.remove('is-down'); });
}
