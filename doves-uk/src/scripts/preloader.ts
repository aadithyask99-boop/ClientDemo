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
  const RUN_MS = 2400; // 0 to 95
  const FINAL_MS = 1100; // 95 to 100, deliberately slower
  const MAX_MS = 6000;
  const start = performance.now();
  let loaded = document.readyState === 'complete';
  let readyAt = 0;
  let done = false;

  if (!loaded) window.addEventListener('load', () => (loaded = true), { once: true });
  if ('fonts' in document) void document.fonts.ready;

  const easeInOut = (x: number) => (x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2);
  const easeOut = (x: number) => 1 - Math.pow(1 - x, 3);

  const tick = (now: number) => {
    const t = now - start;
    let value = 95 * easeInOut(Math.min(1, t / RUN_MS));
    // Waits at 95 until the page has loaded, then the last five percent take their time
    if (!readyAt && t >= RUN_MS && (loaded || t >= MAX_MS)) readyAt = now;
    if (readyAt) value = 95 + 5 * easeOut(Math.min(1, (now - readyAt) / FINAL_MS));
    const n = Math.min(100, Math.floor(value + 0.001));
    num.textContent = String(readyAt && now - readyAt >= FINAL_MS ? 100 : n);
    if (readyAt && now - readyAt >= FINAL_MS && !done) {
      done = true;
      window.setTimeout(() => {
        root.classList.add('preloader-out');
        finish();
      }, 300);
      return;
    }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
} else {
  root.classList.remove('preloading');
}

export {};
