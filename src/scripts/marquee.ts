// Infinite photo marquee. It drifts slowly on its own, a drag takes over with a little inertia,
// hover, focus or press pauses it, and it resumes shortly after. Reduced motion: no drifting,
// the row can still be dragged. A "Drag" chip replaces the cursor over the row (mouse only).

document.querySelectorAll<HTMLElement>('[data-marquee]').forEach((root) => {
  const track = root.querySelector<HTMLElement>('[data-track]');
  const chip = root.querySelector<HTMLElement>('[data-chip]');
  if (!track) return;

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const SPEED = reduce ? 0 : 38; // px per second
  let x = 0;
  let v = 0; // px per ms, from the last drag
  let loopW = 0;
  let dragging = false;
  let hovering = false;
  let pauseUntil = 0;
  let visible = true;
  let last = performance.now();
  let lastX = 0;
  let lastT = 0;
  let moved = 0;

  const measure = () => {
    loopW = track.scrollWidth / 2;
  };

  const wrap = () => {
    if (!loopW) return;
    while (x <= -loopW) x += loopW;
    while (x > 0) x -= loopW;
  };

  const tick = (now: number) => {
    const dt = Math.min(64, now - last);
    last = now;
    if (visible && !document.hidden) {
      if (!dragging) {
        if (Math.abs(v) > 0.012) {
          x += v * dt;
          v *= Math.pow(0.94, dt / 16);
        } else if (!hovering && now > pauseUntil && SPEED) {
          x -= (SPEED * dt) / 1000;
        }
      }
      wrap();
      track.style.transform = `translate3d(${x.toFixed(2)}px,0,0)`;
    }
    requestAnimationFrame(tick);
  };

  root.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    dragging = true;
    moved = 0;
    v = 0;
    lastX = e.clientX;
    lastT = performance.now();
    root.classList.add('is-dragging');
    try {
      root.setPointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
  });

  root.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const now = performance.now();
    const dx = e.clientX - lastX;
    moved += Math.abs(dx);
    x += dx;
    const dtm = Math.max(1, now - lastT);
    v = 0.6 * v + 0.4 * (dx / dtm);
    lastX = e.clientX;
    lastT = now;
  });

  const release = () => {
    if (!dragging) return;
    dragging = false;
    root.classList.remove('is-dragging');
    pauseUntil = performance.now() + 1400;
  };
  root.addEventListener('pointerup', release);
  root.addEventListener('pointercancel', release);
  root.addEventListener('dragstart', (e) => e.preventDefault());

  root.addEventListener('pointerenter', (e) => {
    if (e.pointerType === 'mouse') hovering = true;
  });
  root.addEventListener('pointerleave', () => {
    hovering = false;
    pauseUntil = performance.now() + 500;
  });
  root.addEventListener('focusin', () => (hovering = true));
  root.addEventListener('focusout', () => {
    hovering = false;
  });
  root.addEventListener('keydown', (e) => {
    const item = track.querySelector<HTMLElement>('.item');
    const step = (item?.offsetWidth ?? 300) + 20;
    if (e.key === 'ArrowLeft') v += step / 420;
    if (e.key === 'ArrowRight') v -= step / 420;
  });

  // The "Drag" chip follows the mouse
  if (chip && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    const place = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      chip.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0) translate(-50%, -50%) scale(${dragging ? 0.82 : 1})`;
      chip.classList.add('is-on');
    };
    root.addEventListener('pointermove', place);
    root.addEventListener('pointerenter', place);
    root.addEventListener('pointerleave', () => chip.classList.remove('is-on'));
  }

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([e]) => (visible = e.isIntersecting), { rootMargin: '100px' }).observe(root);
  }

  measure();
  window.addEventListener('resize', measure);
  window.addEventListener('load', measure);
  document.fonts?.ready.then(measure);
  void moved;
  requestAnimationFrame(tick);
});

export {};
