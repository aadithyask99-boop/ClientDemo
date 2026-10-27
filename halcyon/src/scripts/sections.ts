import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { initDots } from './dots';
import { mountScenes } from './scenes';
import { initTiles } from './tiles';

const q = <T extends Element>(sel: string, root: ParentNode = document) => root.querySelector<T>(sel);
const qa = <T extends Element>(sel: string, root: ParentNode = document) => [...root.querySelectorAll<T>(sel)];

export function initSections(reduce: boolean): { warm: () => Promise<void>; drop: () => void } {
  gsap.registerPlugin(ScrollTrigger);

  // Smooth scrolling on desktop pointers. Touch devices keep their native feel.
  let lenis: Lenis | undefined;
  if (!reduce && window.matchMedia('(pointer: fine)').matches) {
    lenis = new Lenis({ lerp: 0.1, anchors: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis!.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  initNav(lenis, !reduce);
  const scenes = mountScenes(reduce);
  if (reduce) { initTiles(true); return scenes; }
  // The keys fall as the footer comes into view
  ScrollTrigger.create({ trigger: '[data-contact]', start: 'top 10%', once: true, onEnter: () => scenes.drop() });

  skyFade();
  statement();
  work(lenis);
  initTiles(false);
  manifesto();
  props();
  services();
  contact();
  return scenes;
}

/**
 * The one nav: it stays fixed through the whole page. It recolours for the dark sections, its links follow the
 * section you are in, and on small screens its Menu button opens a full-screen menu.
 */
function initNav(lenis: Lenis | undefined, animated: boolean) {
  const nav = q<HTMLElement>('[data-nav]');
  const menu = q<HTMLElement>('[data-menu]');
  const btn = q<HTMLButtonElement>('[data-menu-btn]');
  if (!nav) return;

  // Light text once the sky has turned to dusk. Without the scroll fade, as soon as the hero has gone.
  let past = false;
  const paint = () => nav.classList.toggle('is-dark', past || Boolean(menu && !menu.hidden));
  ScrollTrigger.create({
    trigger: '[data-hero]',
    start: animated ? '50% top' : 'bottom top+=90',
    onEnter: () => { past = true; paint(); },
    onLeaveBack: () => { past = false; paint(); },
  });

  // Highlight the link for the section in view
  const links = qa<HTMLAnchorElement>('[data-nav-link]');
  const mark = (id: string) => links.forEach((a) => {
    const on = a.getAttribute('href') === `#${id}`;
    a.classList.toggle('is-current', on);
    if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
  });
  ['top', 'about', 'work', 'industries', 'services', 'contact'].forEach((id) => {
    const el = document.getElementById(id);
    if (el) ScrollTrigger.create({ trigger: el, start: 'top 55%', end: 'bottom 55%', onToggle: (self) => { if (self.isActive) mark(id); } });
  });

  if (!menu || !btn) return;
  const set = (open: boolean) => {
    menu.hidden = !open;
    btn.setAttribute('aria-expanded', String(open));
    if (open) lenis?.stop(); else lenis?.start();
    document.documentElement.style.overflow = open ? 'hidden' : '';
    paint();
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

/**
 * Case-study tiles glide up through the centre in perspective. The next tile shows only as a sliver below the
 * current one, rises as the current one tilts back and fades, and each move spans plenty of scroll so it never
 * outruns the wheel. Units below are timeline units; the whole thing is scrubbed to the section's scroll.
 */
function work(lenis?: Lenis) {
  const section = q<HTMLElement>('[data-work]');
  const tiles = qa<HTMLElement>('[data-tile]');
  if (!section || !tiles.length) return;
  const last = tiles.length - 1;
  gsap.set(tiles, { y: '125vh', rotateX: 40, scale: 0.94, transformOrigin: '50% 50%', force3D: true });
  gsap.set(tiles[0], { y: '70vh', rotateX: 24, scale: 0.96 });

  const tl = gsap.timeline({
    defaults: { ease: 'power1.inOut', immediateRender: false },
    // Lenis already smooths the wheel, so the scrub follows it directly; without Lenis it adds its own easing
    scrollTrigger: { trigger: section, start: 'top top', end: 'bottom bottom', scrub: lenis ? true : 0.5 },
  });
  tiles.forEach((tile, i) => {
    const main = 1 + i;
    if (i === 0) tl.to(tile, { y: 0, rotateX: 0, scale: 1, duration: 1 }, 0);
    else {
      // A thin sliver below the current tile: its top edge stays under the current tile's title
      tl.to(tile, { y: '62vh', rotateX: 30, scale: 0.95, duration: 0.4 }, main - 1.6);
      tl.to(tile, { y: 0, rotateX: 0, scale: 1, duration: 0.6 }, main - 0.6);
    }
    if (i < last) tl.to(tile, { y: '-105vh', rotateX: -26, scale: 0.9, opacity: 0.15, duration: 0.6 }, main + 0.4);
  });
  tl.to({}, { duration: 0.01 }, 1 + last + 0.8);
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

/** Hovering a word lights it up, shows its caption, and a photo follows the pointer with a lag */
function services() {
  const section = q<HTMLElement>('[data-svc]');
  const list = q<HTMLElement>('[data-svc-list]');
  const thumb = q<HTMLElement>('[data-svc-thumb]');
  const items = qa<HTMLElement>('[data-svc-item]');
  if (!section || !list || !thumb || !items.length) return;
  const photos = qa<HTMLImageElement>('img', thumb);
  const names = items.map((el) => q<HTMLElement>('.svc__name', el)!);
  const hover = window.matchMedia('(hover: hover)').matches;

  const set = (i: number) => {
    items.forEach((el, n) => el.classList.toggle('is-on', n === i));
    list.classList.toggle('has-hover', i >= 0);
    photos.forEach((p) => p.classList.toggle('is-on', i >= 0 && p.dataset.thumb === items[i].dataset.img));
    gsap.to(thumb, { opacity: i >= 0 ? 1 : 0, scale: i >= 0 ? 1 : 0.88, duration: 0.35, ease: 'power3.out', overwrite: 'auto' });
  };
  gsap.set(thumb, { opacity: 0, scale: 0.88 });

  items.forEach((el, i) => el.addEventListener('focus', () => set(i)));
  items.forEach((el) => el.addEventListener('blur', () => set(-1)));

  if (!hover) {
    // Touch: whichever word crosses the middle of the screen is the active one
    const io = new IntersectionObserver((entries) => entries.forEach((e) => { if (e.isIntersecting) set(items.indexOf(e.target as HTMLElement)); }), { rootMargin: '-45% 0px -45% 0px' });
    items.forEach((el) => io.observe(el));
    return;
  }

  const tx = gsap.quickTo(thumb, 'x', { duration: 0.7, ease: 'power3.out' });
  const ty = gsap.quickTo(thumb, 'y', { duration: 0.7, ease: 'power3.out' });
  const tr = gsap.quickTo(thumb, 'rotation', { duration: 0.6, ease: 'power3.out' });
  const nudge = names.map((n) => gsap.quickTo(n, 'x', { duration: 0.6, ease: 'power3.out' }));
  let lastX = 0;
  let current = -1;

  section.addEventListener('pointermove', (e) => {
    const r = section.getBoundingClientRect();
    const px = e.clientX - r.left;
    const py = e.clientY - r.top;
    // The photo trails up and to the left of the pointer, tilting with its horizontal speed
    tx(px - thumb.offsetWidth * 0.78);
    ty(py - thumb.offsetHeight * 0.9);
    tr(Math.max(-9, Math.min(9, (px - lastX) * 0.35)));
    lastX = px;
    // The word under the pointer leans toward it
    if (current >= 0) {
      const nr = names[current].getBoundingClientRect();
      nudge[current]((e.clientX - (nr.left + nr.width / 2)) * 0.05);
    }
  });
  items.forEach((el, i) => {
    el.addEventListener('pointerenter', () => { current = i; set(i); });
    el.addEventListener('pointerleave', () => { nudge[i](0); current = -1; });
  });
  list.addEventListener('pointerleave', () => set(-1));
}

/** Glass props react to the pointer: they drift against it for depth, tilt toward it, and back away when it gets close */
function props() {
  const section = q<HTMLElement>('[data-mani]');
  const wraps = qa<HTMLElement>('[data-prop]');
  if (!section || !wraps.length) return;
  const imgs = wraps.map((w) => q<HTMLElement>('img', w)!);

  // Ambient drift, so they are alive before anyone touches the page
  wraps.forEach((w, i) => gsap.to(w, { y: i % 2 ? -18 : 18, rotation: i % 2 ? 3 : -3, duration: 4.2 + i * 0.8, ease: 'sine.inOut', yoyo: true, repeat: -1 }));
  gsap.set(imgs, { transformPerspective: 700 });

  if (!window.matchMedia('(hover: hover)').matches) return;
  const fx = imgs.map((el) => ({
    x: gsap.quickTo(el, 'x', { duration: 0.9, ease: 'power3.out' }),
    y: gsap.quickTo(el, 'y', { duration: 0.9, ease: 'power3.out' }),
    rx: gsap.quickTo(el, 'rotationX', { duration: 0.8, ease: 'power3.out' }),
    ry: gsap.quickTo(el, 'rotationY', { duration: 0.8, ease: 'power3.out' }),
    s: gsap.quickTo(el, 'scale', { duration: 0.8, ease: 'power3.out' }),
  }));
  const clamp = (v: number, m: number) => Math.max(-m, Math.min(m, v));

  section.addEventListener('pointermove', (e) => {
    const r = section.getBoundingClientRect();
    const nx = (e.clientX - r.left) / r.width - 0.5;
    const ny = (e.clientY - r.top) / r.height - 0.5;
    wraps.forEach((w, i) => {
      const depth = Number(w.dataset.depth ?? 1);
      const pr = w.getBoundingClientRect();
      const dx = e.clientX - (pr.left + pr.width / 2);
      const dy = e.clientY - (pr.top + pr.height / 2);
      const d = Math.hypot(dx, dy) || 1;
      const near = Math.max(0, 1 - d / 340);
      fx[i].x(-nx * 70 * depth - (dx / d) * near * 80);
      fx[i].y(-ny * 50 * depth - (dy / d) * near * 80);
      fx[i].ry(clamp(dx * 0.06, 28));
      fx[i].rx(clamp(-dy * 0.06, 28));
      fx[i].s(1 + near * 0.12);
    });
  });
  section.addEventListener('pointerleave', () => fx.forEach((f) => { f.x(0); f.y(0); f.rx(0); f.ry(0); f.s(1); }));
}

/** The sky turns to night as the hero scrolls away: one colour change, no edge */
function skyFade() {
  const fade = q<HTMLElement>('[data-skyfade]');
  if (!fade) return;
  document.documentElement.classList.add('sky-fades');
  gsap.timeline({ scrollTrigger: { trigger: '[data-hero]', start: 'top top', end: 'bottom 40%', scrub: 0.5 } })
    .to(fade, { opacity: 0.9, ease: 'power1.in', duration: 0.62 })
    .to(fade, { opacity: 1, backgroundColor: '#050b16', ease: 'none', duration: 0.38 });
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
