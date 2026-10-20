// Skin notes: pick a note on the left, its photograph and text settle in on the right.
export function initNotes() {
  const root = document.querySelector<HTMLElement>('[data-notes]');
  if (!root) return;
  const rows = [...root.querySelectorAll<HTMLElement>('.note2')];
  const imgs = [...root.querySelectorAll<HTMLElement>('.notes__img')];

  const select = (i: number) => {
    rows.forEach((r, k) => {
      const on = k === i;
      r.classList.toggle('open', on);
      r.querySelector('.note2__btn')?.setAttribute('aria-expanded', String(on));
    });
    imgs.forEach((m, k) => m.classList.toggle('on', k === i));
  };

  rows.forEach((r, i) => {
    r.querySelector('.note2__btn')?.addEventListener('click', () => select(i));
    // On a fine pointer, resting on a title is enough
    r.querySelector('.note2__btn')?.addEventListener('pointerenter', (e) => {
      if ((e as PointerEvent).pointerType === 'mouse') select(i);
    });
  });
}
