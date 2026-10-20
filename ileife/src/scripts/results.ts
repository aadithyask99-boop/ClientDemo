// Before and after: drag (or use the arrow keys on) the handle. Two treatments, switched by the tabs.
export function initResults() {
  const root = document.querySelector<HTMLElement>('[data-results]');
  if (!root) return;
  const cmps = [...root.querySelectorAll<HTMLElement>('.cmp')];
  const tabs = [...root.querySelectorAll<HTMLButtonElement>('.results__tab')];

  cmps.forEach((cmp) => {
    const range = cmp.querySelector<HTMLInputElement>('.cmp__range');
    if (!range) return;
    const set = () => cmp.style.setProperty('--pos', `${range.value}%`);
    range.addEventListener('input', set);
    set();
  });

  // A first nudge so it is obvious the handle moves
  const first = cmps[0]?.querySelector<HTMLInputElement>('.cmp__range');
  if (first && 'IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const io = new IntersectionObserver(
      (e) => {
        if (!e[0].isIntersecting) return;
        io.disconnect();
        const start = performance.now();
        const tick = (now: number) => {
          const t = Math.min(1, (now - start) / 1800);
          first.value = String(50 + Math.sin(t * Math.PI * 2) * 14 * (1 - t));
          first.dispatchEvent(new Event('input'));
          if (t < 1) requestAnimationFrame(tick);
          else {
            first.value = '50';
            first.dispatchEvent(new Event('input'));
          }
        };
        requestAnimationFrame(tick);
      },
      { threshold: 0.55 },
    );
    io.observe(first);
  }

  tabs.forEach((tab) =>
    tab.addEventListener('click', () => {
      tabs.forEach((t) => {
        const on = t === tab;
        t.classList.toggle('on', on);
        t.setAttribute('aria-selected', String(on));
      });
      cmps.forEach((c) => c.classList.toggle('on', c.dataset.pair === tab.dataset.pair));
    }),
  );
}
