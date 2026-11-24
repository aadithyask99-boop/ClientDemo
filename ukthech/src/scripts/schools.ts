// Schools: tiles rise and unmask in sequence, pictures drift with scroll, and on a fine pointer the picture, the tile and
// the name lean with the cursor. A tap toggles the close-up on touch.
import { gsap, ScrollTrigger, reduced, finePointer, desktop } from './core';

export default function init() {
  const root = document.querySelector<HTMLElement>('[data-schools]');
  if (!root) return;
  const tiles = [...root.querySelectorAll<HTMLElement>('[data-tile]')];

  // Touch: tap a tile to show its close-up, tap again or tap another to put it back
  if (!finePointer) {
    tiles.forEach((t) => t.addEventListener('click', () => {
      const on = t.classList.contains('is-on');
      tiles.forEach((o) => o.classList.remove('is-on'));
      if (!on) t.classList.add('is-on');
    }));
  }
  if (reduced) return;

  const panel = root.querySelector<HTMLElement>('.sc-panel')!;
  const title = root.querySelector<HTMLElement>('.sc-title')!;
  const cta = root.querySelector<HTMLElement>('.sc-cta')!;
  const texts = tiles.map((t) => t.querySelector<HTMLElement>('[data-text]')!);
  const pars = tiles.map((t) => t.querySelector<HTMLElement>('[data-par]')!);
  const cover = (i: number) => (i === 0 ? 1.06 : 1.12); // headroom so the picture can move without showing the ground

  // Entrance
  gsap.set(tiles, { opacity: 0, y: 90, clipPath: 'inset(100% 0% 0% 0% round 18px)' });
  gsap.set(texts, { opacity: 0, y: 26 });
  gsap.set([title, cta], { opacity: 0, y: 30 });
  gsap.set(pars, { scale: (i) => cover(i) * 1.12 });
  const tl = gsap.timeline({
    scrollTrigger: { trigger: panel, start: 'top 72%', once: true },
    defaults: { ease: 'power3.out' },
  });
  tl.to(title, { opacity: 1, y: 0, duration: 0.9 }, 0)
    .to(tiles, { opacity: 1, y: 0, clipPath: 'inset(0% 0% 0% 0% round 18px)', duration: 1.25, stagger: 0.16 }, 0.1)
    .to(pars, { scale: (i) => cover(i), duration: 1.6, stagger: 0.16, ease: 'power2.out' }, 0.1)
    .to(texts, { opacity: 1, y: 0, duration: 0.8, stagger: 0.16 }, 0.65)
    .to(cta, { opacity: 1, y: 0, duration: 0.8 }, 1.1)
    .add(() => { gsap.set(tiles, { clearProps: 'clipPath' }); });

  // Scroll: pictures slide a little against the tiles (the headroom is the scale above)
  const scrollMove = desktop();
  tiles.forEach((t, i) => {
    if (!scrollMove) return;
    const amp = (cover(i) - 1) * 50 * 0.6; // percent of the picture's height
    gsap.fromTo(pars[i], { yPercent: -amp }, {
      yPercent: amp, ease: 'none',
      scrollTrigger: { trigger: t, start: 'top bottom', end: 'bottom top', scrub: 0.6 },
    });
  });

  // Pointer: tilt the tile, move the picture and counter-move the name
  if (finePointer) {
    tiles.forEach((t, i) => {
      const head = (cover(i) - 1) * 50;
      const rx = gsap.quickTo(t, 'rotationX', { duration: 0.7, ease: 'power3.out' });
      const ry = gsap.quickTo(t, 'rotationY', { duration: 0.7, ease: 'power3.out' });
      const px = gsap.quickTo(pars[i], 'xPercent', { duration: 0.8, ease: 'power3.out' });
      const py = gsap.quickTo(pars[i], 'y', { duration: 0.8, ease: 'power3.out' });
      const tx = gsap.quickTo(texts[i], 'x', { duration: 0.8, ease: 'power3.out' });
      const ty = gsap.quickTo(texts[i], 'y', { duration: 0.8, ease: 'power3.out' });
      gsap.set(t, { transformPerspective: 1100 });
      t.addEventListener('pointermove', (e) => {
        const r = t.getBoundingClientRect();
        const nx = (e.clientX - r.left) / r.width - 0.5;
        const ny = (e.clientY - r.top) / r.height - 0.5;
        ry(nx * 2.2); rx(-ny * 2.2);
        px(-nx * head * 0.7);
        py(-ny * r.height * head * 0.007);
        tx(nx * 6); ty(ny * 4);
      });
      t.addEventListener('pointerleave', () => { rx(0); ry(0); px(0); py(0); tx(0); ty(0); });
    });
  }
  ScrollTrigger.refresh();
}
