// Hero slideshow: crossfade with a slow zoom. It only runs while the hero is visible and the
// tab is open. Reduced motion: first photo only.

const hero = document.querySelector<HTMLElement>('[data-hero]');

if (hero) {
  const slides = [...hero.querySelectorAll<HTMLElement>('[data-slide]')];
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const SLIDE_MS = 6500;

  if (!reduce && slides.length > 1) {
    let current = 0;
    let elapsed = 0;
    let last = performance.now();
    let visible = true;
    let ready = false;

    const go = (next: number) => {
      const n = (next + slides.length) % slides.length;
      if (n === current) {
        elapsed = 0;
        return;
      }
      const from = slides[current];
      const to = slides[n];
      // reset the incoming slide's zoom before it fades in
      to.classList.add('no-t');
      to.classList.remove('is-leaving');
      void to.offsetWidth;
      to.classList.remove('no-t');
      to.classList.add('is-on');
      from.classList.remove('is-on');
      from.classList.add('is-leaving');
      window.setTimeout(() => {
        if (!from.classList.contains('is-on')) {
          from.classList.add('no-t');
          from.classList.remove('is-leaving');
          void from.offsetWidth;
          from.classList.remove('no-t');
        }
      }, 1800);
      current = n;
      elapsed = 0;
    };

    const tick = (now: number) => {
      const dt = now - last;
      last = now;
      if (ready && visible && !document.hidden) elapsed += dt;
      if (elapsed >= SLIDE_MS) go(current + 1);
      requestAnimationFrame(tick);
    };

    const start = () => {
      ready = true;
      hero.classList.add('play');
    };
    if (document.readyState === 'complete') start();
    else window.addEventListener('load', start, { once: true });

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(([e]) => (visible = e.isIntersecting), { threshold: 0.2 }).observe(hero);
    }
    requestAnimationFrame(tick);
  }
}

export {};
