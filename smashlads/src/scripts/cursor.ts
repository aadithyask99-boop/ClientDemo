import gsap from 'gsap';

// A cartoon arrow and a pointing glove for mice only. Touch and keyboard users keep their normal pointer.
export function initCursor(reduce: boolean) {
  if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  const el = document.querySelector('[data-cursor]') as HTMLElement | null;
  if (!el) return;
  document.documentElement.classList.add('has-cursor');
  const mx = gsap.quickTo(el, 'x', { duration: reduce ? 0 : 0.06, ease: 'power3.out' });
  const my = gsap.quickTo(el, 'y', { duration: reduce ? 0 : 0.06, ease: 'power3.out' });
  let shown = false;
  addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    if (!shown) { shown = true; el.classList.add('is-on'); }
    mx(e.clientX); my(e.clientY);
    const t = e.target as HTMLElement;
    el.classList.toggle('is-link', !!t.closest('a,button,[data-part],.layer,.chip,.card,input,textarea,select,.cat__name'));
  });
  document.addEventListener('pointerleave', () => el.classList.remove('is-on'));
  addEventListener('pointerdown', () => el.classList.add('is-down'));
  addEventListener('pointerup', () => el.classList.remove('is-down'));
}
