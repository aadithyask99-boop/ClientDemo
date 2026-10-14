// Scroll-up button: shows after the first screen, the ring follows page progress,
// a click glides to the top (instant for reduced motion) and focus returns to the page top.

const btn = document.querySelector<HTMLButtonElement>('[data-totop]');
const ring = document.querySelector<SVGCircleElement>('[data-ring]');

if (btn) {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  let ticking = false;

  const update = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const y = window.scrollY;
    const on = y > window.innerHeight * 0.9;
    if (btn.classList.contains('is-on') !== on) {
      btn.classList.toggle('is-on', on);
      btn.tabIndex = on ? 0 : -1;
      btn.setAttribute('aria-hidden', String(!on));
    }
    if (ring && max > 0) ring.style.strokeDashoffset = String(100 - Math.min(100, (y / max) * 100));
    ticking = false;
  };

  window.addEventListener(
    'scroll',
    () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    },
    { passive: true },
  );
  window.addEventListener('resize', update, { passive: true });
  update();

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: reduce.matches ? 'auto' : 'smooth' });
    document.getElementById('top')?.setAttribute('tabindex', '-1');
    window.setTimeout(() => document.getElementById('top')?.focus({ preventScroll: true }), reduce.matches ? 0 : 700);
  });
}

export {};
