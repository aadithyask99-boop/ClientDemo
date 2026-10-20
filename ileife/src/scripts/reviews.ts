type Review = { n: string; d: string; t: string };

// One review at a time, changing slowly. Pauses while hovered or focused, and while off screen.
export function initReviews() {
  const root = document.querySelector<HTMLElement>('[data-reviews]');
  if (!root) return;
  const list: Review[] = JSON.parse(root.dataset.reviewsData ?? '[]');
  const stage = root.querySelector<HTMLElement>('[data-stage]');
  const text = root.querySelector<HTMLElement>('[data-text]');
  const name = root.querySelector<HTMLElement>('[data-name]');
  const date = root.querySelector<HTMLElement>('[data-date]');
  const count = root.querySelector<HTMLElement>('[data-count]');
  if (!stage || !text || !name || !date || !count || list.length < 2) return;

  let i = 0;
  let paused = false;
  let visible = false;
  let busy = false;
  const pad = (n: number) => String(n).padStart(2, '0');

  const show = (next: number) => {
    if (busy) return;
    busy = true;
    i = (next + list.length) % list.length;
    stage.classList.add('swap');
    window.setTimeout(() => {
      text.textContent = list[i].t;
      name.textContent = list[i].n;
      date.textContent = list[i].d;
      count.textContent = `${pad(i + 1)} / ${pad(list.length)}`;
      stage.classList.remove('swap');
      busy = false;
    }, 560);
  };

  root.querySelector('[data-next]')?.addEventListener('click', () => show(i + 1));
  root.querySelector('[data-prev]')?.addEventListener('click', () => show(i - 1));
  root.addEventListener('pointerenter', () => (paused = true));
  root.addEventListener('pointerleave', () => (paused = false));
  root.addEventListener('focusin', () => (paused = true));
  root.addEventListener('focusout', () => (paused = false));

  if ('IntersectionObserver' in window) {
    new IntersectionObserver((e) => (visible = e[0].isIntersecting), { threshold: 0.3 }).observe(root);
  } else {
    visible = true;
  }
  const slow = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (slow) window.setInterval(() => !paused && visible && show(i + 1), 9000);
}
