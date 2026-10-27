import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { initDots } from './dots';
import { mountScenes } from './scenes';

const q = <T extends Element>(sel: string, root: ParentNode = document) => root.querySelector<T>(sel);
const qa = <T extends Element>(sel: string, root: ParentNode = document) => [...root.querySelectorAll<T>(sel)];

export function initSections(reduce: boolean): { warm: () => Promise<void> } {
  gsap.registerPlugin(ScrollTrigger);

  // Smooth scrolling on desktop pointers. Touch devices keep their native feel.
  let lenis: Lenis | undefined;
  if (!reduce && window.matchMedia('(pointer: fine)').matches) {
    lenis = new Lenis({ lerp: 0.1, anchors: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis!.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  initDock(lenis);
  const scenes = mountScenes(reduce);
  if (reduce) return scenes;

  statement();
  work();
  manifesto();
  services();
  contact();
  return scenes;
}

/** Fixed pill bar that appears once the hero has scrolled away, and its full-screen menu */
function initDock(lenis?: Lenis) {
  const dock = q<HTMLElement>('[data-dock]');
  const menu = q<HTMLElement>('[data-menu]');
  const btn = q<HTMLButtonElement>('[data-menu-btn]');
  if (!dock || !menu || !btn) return;

  ScrollTrigger.create({
    trigger: '[data-hero]',
    start: 'bottom top+=70',
    onEnter: () => dock.classList.add('is-on'),
    onLeaveBack: () => dock.classList.remove('is-on'),
  });

  const set = (open: boolean) => {
    menu.hidden = !open;
    btn.setAttribute('aria-expanded', String(open));
    if (open) lenis?.stop(); else lenis?.start();
    document.documentElement.style.overflow = open ? 'hidden' : '';
  };
  btn.addEventListener('click', () => set(Boolean(menu.hidden)));
  qa('[data-menu-link]').forEach((a) => a.addEventListener('click', () => set(false)));
  window.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !menu.hidden) { set(false); btn.focus(); } });
}

/** The statement lights up word by word as it scrolls through */
function statement() {
  const words = qa('.stmt .w');
  if (!words.length) return;
  gsap.to(words, {
    opacity: 1, ease: 'none', stagger: 0.12,
    scrollTrigger: { trigger: '[data-stmt]', start: 'top 70%', end: 'bottom 72%', scrub: 0.6 },
  });
}

/** Case-study tiles glide up through the centre in perspective. The next one peeks in from below first. */
function work() {
  const section = q<HTMLElement>('[data-work]');
  const tiles = qa<HTMLElement>('[data-tile]');
  if (!section || !tiles.length) return;
  const last = tiles.length - 1;
  gsap.set(tiles, { y: '125vh', rotateX: 40, transformOrigin: '50% 50%' });
  gsap.set(tiles[0], { y: '70vh', rotateX: 24 });

  const tl = gsap.timeline({
    defaults: { ease: 'none', immediateRender: false },
    scrollTrigger: { trigger: section, start: 'top top', end: 'bottom bottom', scrub: 0.6 },
  });
  tiles.forEach((tile, i) => {
    const main = 1 + i;
    if (i === 0) tl.to(tile, { y: 0, rotateX: 0, duration: 1 }, 0);
    else {
      tl.to(tile, { y: '46vh', rotateX: 28, duration: 0.4 }, main - 1.5);
      tl.to(tile, { y: 0, rotateX: 0, duration: 0.5 }, main - 0.5);
    }
    if (i < last) tl.to(tile, { y: '-120vh', rotateX: -32, duration: 0.5 }, main + 0.5);
  });
  tl.to({}, { duration: 0.01 }, 1 + last + 0.7);
}

/** Dot-matrix headline: lit by scroll, glowing at the pointer */
function manifesto() {
  const section = q<HTMLElement>('[data-mani]');
  const canvas = q<HTMLCanvasElement>('[data-dots]');
  if (!section || !canvas) return;
  const dots = initDots(canvas, section);
  ScrollTrigger.create({
    trigger: section, start: 'top 85%', end: 'center 35%', scrub: true,
    onUpdate: (self) => dots.setProgress(self.progress),
  });
}

/** One giant word is bright at a time as you scroll, with a thumbnail that follows the pointer */
function services() {
  const section = q<HTMLElement>('[data-svc]');
  const stage = q<HTMLElement>('.svc__stage', section ?? document);
  const items = qa<HTMLElement>('[data-svc-item]');
  const side = q<HTMLElement>('[data-svc-side]');
  const thumb = q<HTMLElement>('[data-svc-thumb]');
  if (!section || !stage || !items.length) return;

  let active = -1;
  const show = (i: number) => {
    if (i === active) return;
    active = i;
    items.forEach((el, n) => el.classList.toggle('is-on', n === i));
    if (side) {
      const s = stage.getBoundingClientRect();
      const r = items[i].getBoundingClientRect();
      gsap.to(side, { y: r.top + r.height / 2 - s.top - s.height / 2, duration: 0.5, ease: 'power3.out' });
      side.textContent = `[ ${items[i].dataset.tag} ]`;
    }
  };
  show(0);
  ScrollTrigger.create({
    trigger: section, start: 'top top', end: 'bottom bottom',
    onUpdate: (self) => show(Math.min(items.length - 1, Math.floor(self.progress * items.length))),
  });

  if (!thumb || !window.matchMedia('(hover: hover)').matches) return;
  const tx = gsap.quickTo(thumb, 'x', { duration: 0.5, ease: 'power3.out' });
  const ty = gsap.quickTo(thumb, 'y', { duration: 0.5, ease: 'power3.out' });
  stage.addEventListener('pointermove', (e) => {
    const s = stage.getBoundingClientRect();
    tx(e.clientX - s.left + 24);
    ty(e.clientY - s.top - 80);
  });
  items.forEach((el) => {
    el.addEventListener('pointerenter', () => { thumb.innerHTML = el.dataset.art ?? ''; thumb.classList.add('is-on'); });
    el.addEventListener('pointerleave', () => thumb.classList.remove('is-on'));
  });
}

/** Footer: the sky below the address slowly changes colour, and a crosshair follows the pointer */
function contact() {
  const el = q<HTMLElement>('[data-contact]');
  if (!el) return;
  const xy = q<HTMLElement>('[data-xy]', el);

  const palette = ['#59c8ff', '#7be0c4', '#b79bff', '#ffd27a', '#62a8ff'];
  const tl = gsap.timeline({ repeat: -1, paused: true });
  palette.forEach((c, i) => tl.to(el, { '--bottom': palette[(i + 1) % palette.length], duration: 3, ease: 'sine.inOut' }));
  gsap.set(el, { '--bottom': palette[0] });
  ScrollTrigger.create({ trigger: el, start: 'top bottom', end: 'bottom top', onToggle: (s) => (s.isActive ? tl.play() : tl.pause()) });

  if (!window.matchMedia('(hover: hover)').matches) return;
  el.addEventListener('pointermove', (e) => {
    const r = el.getBoundingClientRect();
    el.style.setProperty('--cx', `${e.clientX - r.left}px`);
    el.style.setProperty('--cy', `${e.clientY - r.top}px`);
    el.classList.add('is-hover');
    if (xy) xy.textContent = `X : ${String(Math.round(e.clientX)).padStart(4, '0')}   Y : ${String(Math.round(e.clientY)).padStart(4, '0')}`;
  });
  el.addEventListener('pointerleave', () => el.classList.remove('is-hover'));
}
