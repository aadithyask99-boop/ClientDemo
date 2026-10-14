// Contained carousel. Arrow buttons and arrow keys move one card, touch swipes natively,
// and the mouse can drag. A small "Drag" chip replaces the cursor over the row.

document.querySelectorAll<HTMLElement>('[data-carousel]').forEach((root) => {
  const rail = root.querySelector<HTMLElement>('[data-rail]');
  const prev = root.querySelector<HTMLButtonElement>('[data-prev]');
  const next = root.querySelector<HTMLButtonElement>('[data-next]');
  const chip = root.querySelector<HTMLElement>('[data-chip]');
  if (!rail || !prev || !next) return;

  const step = () => {
    const card = rail.querySelector<HTMLElement>('li');
    const gap = parseFloat(getComputedStyle(rail).columnGap) || 16;
    return (card?.offsetWidth ?? 300) + gap;
  };

  const bar = root.querySelector<HTMLElement>('[data-progress]');

  const update = () => {
    const max = rail.scrollWidth - rail.clientWidth - 2;
    prev.disabled = rail.scrollLeft <= 2;
    next.disabled = rail.scrollLeft >= max;
    if (bar) {
      const visible = rail.clientWidth / rail.scrollWidth;
      const p = max > 0 ? Math.min(1, Math.max(0, rail.scrollLeft / max)) : 0;
      // a thumb that grows toward the end, as a quiet sense of position
      bar.style.transform = `scaleX(${(visible + (1 - visible) * p).toFixed(3)})`;
    }
  };

  prev.addEventListener('click', () => rail.scrollBy({ left: -step(), behavior: 'smooth' }));
  next.addEventListener('click', () => rail.scrollBy({ left: step(), behavior: 'smooth' }));
  rail.addEventListener('scroll', update, { passive: true });
  rail.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') rail.scrollBy({ left: step(), behavior: 'smooth' });
    if (e.key === 'ArrowLeft') rail.scrollBy({ left: -step(), behavior: 'smooth' });
  });
  window.addEventListener('resize', update);

  // Mouse drag (touch already swipes natively)
  let down = false;
  let startX = 0;
  let startLeft = 0;
  let moved = 0;

  rail.addEventListener('pointerdown', (e) => {
    if (e.pointerType !== 'mouse' || e.button !== 0) return;
    down = true;
    moved = 0;
    startX = e.clientX;
    startLeft = rail.scrollLeft;
    rail.classList.add('is-dragging');
    rail.style.scrollSnapType = 'none';
    chip?.classList.add('is-grab');
    try {
      rail.setPointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
  });

  rail.addEventListener('pointermove', (e) => {
    if (!down) return;
    const dx = e.clientX - startX;
    moved = Math.max(moved, Math.abs(dx));
    rail.scrollLeft = startLeft - dx;
  });

  const release = () => {
    if (!down) return;
    down = false;
    rail.classList.remove('is-dragging');
    chip?.classList.remove('is-grab');
    const s = step();
    const target = Math.max(0, Math.min(Math.round(rail.scrollLeft / s) * s, rail.scrollWidth - rail.clientWidth));
    rail.style.scrollSnapType = '';
    rail.scrollTo({ left: target, behavior: 'smooth' });
  };
  rail.addEventListener('pointerup', release);
  rail.addEventListener('pointercancel', release);

  // A drag must not count as a click on whatever is under the pointer
  rail.addEventListener(
    'click',
    (e) => {
      if (moved > 5) {
        e.preventDefault();
        e.stopPropagation();
      }
    },
    true,
  );
  rail.addEventListener('dragstart', (e) => e.preventDefault());

  // The "Drag" chip follows the mouse
  if (chip && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    const show = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      chip.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0) translate(-50%, -50%) scale(${down ? 0.82 : 1})`;
      chip.classList.add('is-on');
    };
    rail.addEventListener('pointermove', show);
    rail.addEventListener('pointerenter', show);
    rail.addEventListener('pointerleave', () => chip.classList.remove('is-on'));
  }

  update();
});

export {};
