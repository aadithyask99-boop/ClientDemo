import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

const doc = document.documentElement;
const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const canHover = matchMedia('(hover: hover)').matches;
const $ = <T extends HTMLElement>(s: string, r: ParentNode = document) => r.querySelector<T>(s)!;
const $$ = <T extends HTMLElement>(s: string, r: ParentNode = document) => [...r.querySelectorAll<T>(s)];
if (!reduce) doc.classList.add('js');

// Header colour follows the section underneath it.
const header = $('.header');
const themeEls = $$('[data-theme]').filter((e) => e !== header);
const syncTheme = () => {
  const y = 40;
  const hit = themeEls.find((e) => { const r = e.getBoundingClientRect(); return r.top <= y && r.bottom > y; });
  header.dataset.theme = hit?.dataset.theme ?? 'dark';
  header.classList.toggle('is-scrolled', scrollY > 120);
};

// Menu overlay with a photo that follows the hovered link.
const menu = $('#menu');
const menuBtn = $<HTMLButtonElement>('.header__menu');
const links = $$<HTMLAnchorElement>('.menu__links a');
const previews = $$('.menu__preview img');
const linkBox = $('.menu__links');
let lenis: Lenis | null = null;
const setPreview = (i: number) => {
  links.forEach((a, k) => a.classList.toggle('is-on', k === i));
  previews.forEach((p, k) => p.classList.toggle('is-on', k === i));
};
const setMenu = (open: boolean) => {
  menu.classList.toggle('is-open', open);
  header.classList.toggle('is-open', open);
  menu.setAttribute('aria-hidden', String(!open));
  menuBtn.setAttribute('aria-expanded', String(open));
  menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  links.forEach((a) => (a.tabIndex = open ? 0 : -1));
  if (open) { lenis?.stop(); setPreview(0); } else { lenis?.start(); linkBox.classList.remove('is-hovering'); }
  if (!lenis) document.body.style.overflow = open ? 'hidden' : '';
};
menuBtn.addEventListener('click', () => setMenu(!menu.classList.contains('is-open')));
addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });
links.forEach((a, i) => {
  const on = () => { linkBox.classList.add('is-hovering'); setPreview(i); };
  a.addEventListener('pointerenter', on);
  a.addEventListener('focus', on);
  a.addEventListener('click', () => setMenu(false));
});
linkBox.addEventListener('pointerleave', () => linkBox.classList.remove('is-hovering'));

// Hero film: plays muted; fades out and restarts so the loop has no hard cut.
const film = $('.hero__film');
const video = $<HTMLVideoElement>('.hero__video');
if (!reduce) {
  const play = () => video.play().catch(() => {});
  play();
  video.addEventListener('timeupdate', () => { if (video.duration - video.currentTime < 0.7) film.dataset.fade = '1'; });
  video.addEventListener('ended', () => { video.currentTime = 0; delete film.dataset.fade; play(); });
}

// Rollers (marques, sectors): scroll steps through the items, hover or focus picks one.
type Roller = { el: HTMLElement; items: HTMLElement[]; imgs: HTMLElement[]; notes: HTMLElement[]; active: number; last: number };
const rollers: Roller[] = $$('.roller').map((el) => {
  const r: Roller = { el, items: $$('.roller__list li', el), imgs: $$('.roller__frame img', el), notes: $$('.roller__note span', el), active: 0, last: -1 };
  const set = (i: number) => {
    if (i === r.active) return;
    r.active = i;
    [r.items, r.imgs, r.notes].forEach((g) => g.forEach((n, k) => n.classList.toggle('is-active', k === i)));
  };
  r.items.forEach((li, i) => {
    li.addEventListener('pointerenter', () => canHover && set(i));
    li.addEventListener('focusin', () => set(i));
  });
  (r as Roller & { set: (i: number) => void }).set = set;
  return r;
}) as (Roller & { set: (i: number) => void })[];

if (!reduce) {
  gsap.registerPlugin(ScrollTrigger);
  lenis = new Lenis({ lerp: 0.085, wheelMultiplier: 0.9 });
  lenis.on('scroll', () => { ScrollTrigger.update(); syncTheme(); });
  gsap.ticker.add((t) => lenis!.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
  doc.classList.add('lenis');

  // Intro: the wordmark assembles from slices with a short glitch, then lifts away; the headline types in.
  const intro = $('.intro');
  const slices = $$('.intro__mark img');
  lenis.stop();
  const ready = () => doc.classList.add('ready');
  const tl = gsap.timeline({ delay: 0.15 });
  slices.forEach((img, i) =>
    tl.fromTo(img, { x: () => gsap.utils.random(-160, 160), opacity: 0 }, { x: 0, opacity: 1, duration: 0.75, ease: 'power4.out' }, i * 0.07));
  tl.to(slices, { x: (i: number) => (i % 2 ? 1 : -1) * gsap.utils.random(10, 34), duration: 0.09, yoyo: true, repeat: 3, ease: 'none' }, '>-0.1');
  tl.to(slices, { x: 0, duration: 0.08 });
  tl.to(intro, { clipPath: 'inset(0 0 100% 0)', duration: 1.1, ease: 'power4.inOut' }, '+=0.3');
  tl.add(ready, '<0.45');
  tl.add(() => { intro.classList.add('is-done'); lenis!.start(); });

  document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href')!;
      const el = id === '#top' ? null : document.querySelector<HTMLElement>(id);
      if (id !== '#top' && !el) return;
      e.preventDefault();
      lenis!.scrollTo(el ?? 0, { duration: 1.5 });
    });
  });

  const brk = $('.break');
  // Hero: the film slowly pushes in and darkens as you scroll; the headline lifts away. The cursor nudges the film.
  const hero = $('.hero');
  const sx = gsap.quickTo(film, 'x', { duration: 1.2, ease: 'power3.out' });
  const sy = gsap.quickTo(film, 'y', { duration: 1.2, ease: 'power3.out' });
  if (canHover) hero.addEventListener('pointermove', (e) => {
    sx(-(e.clientX / innerWidth - 0.5) * 36);
    sy(-(e.clientY / innerHeight - 0.5) * 22);
  });
  gsap.ticker.add(() => {
    const hr = hero.getBoundingClientRect();
    if (hr.bottom > 0) {
      const p = clamp(-hr.top / (hero.offsetHeight - innerHeight));
      hero.style.setProperty('--hs', (1.04 + 0.1 * p).toFixed(4));
      hero.style.setProperty('--hd', (0.14 + 0.5 * p).toFixed(3));
      hero.style.setProperty('--ty', `${(-p * 90).toFixed(1)}px`);
      hero.style.setProperty('--to', String(clamp(1 - p * 1.5)));
    }
    rollers.forEach((r) => {
      const rect = r.el.getBoundingClientRect();
      if (rect.top < innerHeight && rect.bottom > 0) {
        const p = clamp(-rect.top / (r.el.offsetHeight - innerHeight));
        const idx = Math.min(r.items.length - 1, Math.floor(p * r.items.length));
        if (idx !== r.last) { r.last = idx; r.set(idx); }
      }
    });
    const br = brk.getBoundingClientRect();
    if (br.bottom > 0 && br.top < innerHeight) brk.style.setProperty('--by', `${((br.top + br.height / 2 - innerHeight / 2) * -0.12).toFixed(1)}px`);
  });

  // Story scenes reveal as they enter; the photo break drifts slower than the page.
  const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -18% 0px' });
  $$('.scene').forEach((el) => io.observe(el));

  // Statement: words go from grey to ink as you scroll.
  gsap.to($$('.statement .w'), {
    color: '#0b0b0c', ease: 'none', stagger: 0.12,
    scrollTrigger: { trigger: '.statement__text', start: 'top 78%', end: 'bottom 45%', scrub: true },
  });
} else {
  doc.classList.add('ready');
  addEventListener('scroll', syncTheme, { passive: true });
}
syncTheme();
