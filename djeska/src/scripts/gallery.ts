import { gsap } from 'gsap';

const box = document.querySelector<HTMLElement>('[data-gallery]');
const track = box?.querySelector<HTMLElement>('[data-gallery-track]');
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

if (box && track) {
  const AUTO = reduce ? 0 : -42; // px per second, drifting left
  let x = 0;
  let vx = AUTO;
  let half = 0;
  let dragging = false;
  let visible = false;
  let lastX = 0;
  let lastT = 0;

  const measure = () => { half = track.scrollWidth / 2; };
  const wrap = (v: number) => (half ? ((v % half) - half) % half : v);
  const apply = () => { track.style.transform = `translate3d(${wrap(x)}px,0,0)`; };

  gsap.ticker.add((_t, dt) => {
    if (!visible || dragging) return;
    // ease back to the drift speed after a flick
    vx += (AUTO - vx) * (1 - Math.pow(0.002, dt / 1000));
    x += (vx * dt) / 1000;
    apply();
  });

  box.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    dragging = true;
    box.classList.add('is-drag');
    box.setPointerCapture(e.pointerId);
    lastX = e.clientX;
    lastT = performance.now();
    vx = 0;
  });
  box.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const now = performance.now();
    const dx = e.clientX - lastX;
    x += dx;
    const dtm = Math.max(1, now - lastT);
    vx = vx * 0.6 + ((dx / dtm) * 1000) * 0.4; // px per second, smoothed
    lastX = e.clientX;
    lastT = now;
    apply();
  });
  const release = () => {
    if (!dragging) return;
    dragging = false;
    box.classList.remove('is-drag');
    if (performance.now() - lastT > 120) vx = 0; // held still before letting go: stay calm
  };
  box.addEventListener('pointerup', release);
  box.addEventListener('pointercancel', release);

  measure();
  document.fonts.ready.then(measure);
  addEventListener('resize', measure);
  box.querySelectorAll('img').forEach((im) => im.addEventListener('load', measure));
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }, { rootMargin: '200px' }).observe(box);
  apply();
}
