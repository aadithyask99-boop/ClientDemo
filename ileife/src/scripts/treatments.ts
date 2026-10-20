import { flags, fine, reduce } from './flags';

// Accordion rows, plus a soft image that drifts after the cursor while hovering a facial name.
export function initTreatments() {
  const list = document.querySelector<HTMLElement>('[data-tx]');
  if (!list) return;
  const rows = [...list.querySelectorAll<HTMLElement>('.tx')];

  const setOpen = (row: HTMLElement, open: boolean) => {
    row.classList.toggle('open', open);
    row.querySelector('.tx__btn')?.setAttribute('aria-expanded', String(open));
  };

  rows.forEach((row) => {
    row.querySelector('.tx__btn')?.addEventListener('click', () => {
      const willOpen = !row.classList.contains('open');
      rows.forEach((r) => setOpen(r, false));
      setOpen(row, willOpen);
    });
  });

  const peek = document.querySelector<HTMLElement>('[data-peek]');
  if (!peek || !fine || reduce) return;
  const imgs = [...peek.querySelectorAll<HTMLImageElement>('img')];
  let tx = 0;
  let ty = 0;
  let x = 0;
  let y = 0;
  let shown = false;
  let raf = 0;

  const loop = () => {
    x += (tx - x) * 0.12;
    y += (ty - y) * 0.12;
    peek.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    raf = shown || Math.abs(tx - x) > 0.5 ? requestAnimationFrame(loop) : 0;
  };

  const show = (id: string | undefined) => {
    imgs.forEach((i) => i.classList.toggle('on', i.dataset.id === id));
    peek.classList.add('on');
    shown = true;
    if (!raf) raf = requestAnimationFrame(loop);
  };
  const hide = () => {
    peek.classList.remove('on');
    shown = false;
  };

  list.addEventListener('pointermove', (e) => {
    const btn = (e.target as Element).closest<HTMLElement>('.tx__btn');
    if (!btn || !flags.has('peek')) return hide();
    const w = peek.offsetWidth;
    const h = peek.offsetHeight;
    const nx = e.clientX + 36;
    tx = nx + w > innerWidth - 12 ? e.clientX - w - 36 : nx;
    ty = Math.min(Math.max(e.clientY - h / 2, 12), innerHeight - h - 12);
    if (!shown) {
      x = tx;
      y = ty;
    }
    show(btn.closest<HTMLElement>('.tx')?.dataset.id);
  });
  list.addEventListener('pointerleave', hide);
  addEventListener('scroll', () => shown && hide(), { passive: true });
}
