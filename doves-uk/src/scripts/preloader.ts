// Counts 0 to 100 while the page really loads (never faster than MIN_MS, never longer than MAX_MS),
// then lifts the white screen while the page sharpens from a slight blur.

const root = document.documentElement;
const el = document.querySelector<HTMLElement>('[data-preloader]');
const num = document.querySelector<HTMLElement>('[data-pct]');

const finish = () => {
  root.classList.remove('preloading');
  window.setTimeout(() => {
    root.classList.remove('preloader-out');
    document.querySelectorAll<HTMLElement>('body > *').forEach((n) => {
      n.style.removeProperty('filter');
      n.style.removeProperty('transform');
    });
  }, 1400);
};

if (el && num && root.classList.contains('preloading')) {
  const MIN_MS = 1500;
  const MAX_MS = 5000;
  const start = performance.now();
  let loaded = document.readyState === 'complete';
  let shown = 0;
  let done = false;

  const ready = () => (loaded = true);
  if (!loaded) window.addEventListener('load', ready, { once: true });
  if ('fonts' in document) void document.fonts.ready;

  const tick = (now: number) => {
    const t = now - start;
    // Eases towards 90 while loading, then runs on to 100 once loaded and the minimum time has passed
    const holding = !(loaded && t >= MIN_MS) && t < MAX_MS;
    const target = holding ? Math.min(90, (t / MIN_MS) * 90) : 100;
    shown += (target - shown) * (holding ? 0.18 : 0.12);
    const n = Math.min(100, Math.round(shown + (holding ? 0 : 0.5)));
    num.textContent = String(n);
    if (!holding && n >= 100 && !done) {
      done = true;
      window.setTimeout(() => {
        root.classList.add('preloader-out');
        finish();
      }, 220);
      return;
    }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
} else {
  root.classList.remove('preloading');
}

export {};
