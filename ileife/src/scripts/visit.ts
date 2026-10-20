// "Your first visit" pins to the viewport and the steps follow the scroll position.
// Desktop only; on a phone the plain list is shown instead (see the CSS).
export function initVisit() {
  const root = document.querySelector<HTMLElement>('[data-visit]');
  const track = root?.querySelector<HTMLElement>('.visit__track');
  if (!root || !track) return;
  const imgs = [...root.querySelectorAll<HTMLElement>('.visit__img')];
  const texts = [...root.querySelectorAll<HTMLElement>('.visit__text')];
  const navs = [...root.querySelectorAll<HTMLButtonElement>('[data-go]')];
  const fill = root.querySelector<HTMLElement>('[data-fill]');
  const n = imgs.length;
  const mq = window.matchMedia('(min-width: 881px)');
  let current = -1;

  const show = (i: number) => {
    if (i === current) return;
    current = i;
    imgs.forEach((el, k) => el.classList.toggle('on', k === i));
    texts.forEach((el, k) => el.classList.toggle('on', k === i));
    navs.forEach((el, k) => el.classList.toggle('on', k === i));
  };

  const update = () => {
    if (!mq.matches) return;
    const rect = track.getBoundingClientRect();
    const span = track.offsetHeight - window.innerHeight;
    const p = Math.min(1, Math.max(0, -rect.top / span));
    show(Math.min(n - 1, Math.floor(p * n)));
    if (fill) fill.style.transform = `scaleX(${p})`;
  };

  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
  update();

  navs.forEach((b, i) =>
    b.addEventListener('click', () => {
      const span = track.offsetHeight - window.innerHeight;
      const top = track.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({ top: top + (span * (i + 0.5)) / n, behavior: 'smooth' });
    }),
  );
}
