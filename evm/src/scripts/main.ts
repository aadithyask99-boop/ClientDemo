import Lenis from 'lenis';
import gsap from 'gsap';

const doc = document.documentElement;
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const canHover = matchMedia('(hover: hover)').matches;
const $ = <T extends HTMLElement>(s: string, r: ParentNode = document) => r.querySelector<T>(s)!;
const $$ = <T extends HTMLElement>(s: string, r: ParentNode = document) => [...r.querySelectorAll<T>(s)];

// Header: colour follows the section underneath; collapses after the first screen.
const header = $('.header');
const themeEls = $$('[data-theme]').filter((e) => e !== header);
const syncTheme = () => {
  const hit = themeEls.find((e) => { const r = e.getBoundingClientRect(); return r.top <= 30 && r.bottom > 30; });
  header.dataset.theme = hit?.dataset.theme ?? 'dark';
  header.classList.toggle('is-scrolled', scrollY > innerHeight * 0.6);
};

// Menu overlay.
const menu = $('#menu');
const menuBtn = $<HTMLButtonElement>('.header__menu');
const mLinks = $$<HTMLAnchorElement>('.menu__links a');
let lenis: Lenis | null = null;
const setMenu = (open: boolean) => {
  menu.classList.toggle('is-open', open);
  header.classList.toggle('is-open', open);
  menu.setAttribute('aria-hidden', String(!open));
  menuBtn.setAttribute('aria-expanded', String(open));
  menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  mLinks.forEach((a) => (a.tabIndex = open ? 0 : -1));
  if (open) lenis?.stop(); else lenis?.start();
  if (!lenis) document.body.style.overflow = open ? 'hidden' : '';
};
menuBtn.addEventListener('click', () => setMenu(!menu.classList.contains('is-open')));
addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });
mLinks.forEach((a) => a.addEventListener('click', () => setMenu(false)));

// Marques: the row nearest the middle of the screen is black, the rest pale. Hover or focus picks one. The tile follows.
const rows = $$('.marques__list li');
const tiles = $$('.marques__tile img');
let active = 0;
const setActive = (i: number) => {
  if (i === active) return;
  active = i;
  rows.forEach((r, k) => r.classList.toggle('is-active', k === i));
  tiles.forEach((t, k) => t.classList.toggle('is-active', k === i));
};
const byCentre = () => {
  const list = $('.marques__list').getBoundingClientRect();
  if (list.bottom < 0 || list.top > innerHeight) return;
  const mid = innerHeight * 0.5;
  let best = 0, bd = 1e9;
  rows.forEach((r, i) => { const b = r.getBoundingClientRect(); const d = Math.abs(b.top + b.height / 2 - mid); if (d < bd) { bd = d; best = i; } });
  setActive(best);
};
rows.forEach((r, i) => {
  r.addEventListener('pointerenter', () => canHover && setActive(i));
  r.querySelector('a')!.addEventListener('focus', () => setActive(i));
});

// Hero film: plays muted; fades out and restarts so the loop has no hard cut.
const film = $('.hero__film');
const video = $<HTMLVideoElement>('.hero__video');
const playFilm = () => {
  video.play().catch(() => {});
  video.addEventListener('timeupdate', () => { if (video.duration - video.currentTime < 0.7) film.dataset.fade = '1'; });
  video.addEventListener('ended', () => { video.currentTime = 0; delete film.dataset.fade; video.play().catch(() => {}); });
};

// Typed text: the element keeps its full text for screen readers and shows a typed copy.
const prep = (el: HTMLElement) => {
  const full = el.textContent ?? '';
  el.textContent = '';
  const sr = document.createElement('span'); sr.className = 'sr'; sr.textContent = full;
  const vis = document.createElement('span'); vis.setAttribute('aria-hidden', 'true');
  el.append(sr, vis);
  return { full, vis };
};
const typer = (el: HTMLElement) => {
  const { full, vis } = prep(el);
  const o = { n: 0 };
  return (dur: number) => gsap.to(o, { n: full.length, duration: dur, ease: 'none', onUpdate: () => { vis.textContent = full.slice(0, Math.round(o.n)); } });
};

if (!reduce) {
  lenis = new Lenis({ lerp: 0.085, wheelMultiplier: 0.9 });
  lenis.on('scroll', () => { syncTheme(); byCentre(); });
  gsap.ticker.add((t) => lenis!.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
  doc.classList.add('lenis');
  lenis.stop();
  document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href')!;
      const el = id === '#top' ? null : document.querySelector<HTMLElement>(id);
      if (id !== '#top' && !el) return;
      e.preventDefault();
      lenis!.scrollTo(el ?? 0, { duration: 1.5 });
    });
  });

  // Intro, timed from the reference frames: label, then the wordmark rises in slices, label two, a hold, then the wordmark drops away,
  // the labels move up to the header line, the film shows and the headline, sub line and links type in.
  const intro = $('.intro');
  const t1 = typer($('.intro__tag--1')), t2 = typer($('.intro__tag--2'));
  const slices = $$('.intro__slice');
  const lines = $$('.hero__title .line').map(typer);
  const sub = typer($('.hero__sub'));
  const cta = typer($('.hero__cta'));
  const links = $$('.header__links a').map(typer);
  const tl = gsap.timeline({ delay: 0.3 });
  tl.add(t1(0.55), 0.3);
  tl.fromTo(slices, { yPercent: 100, x: () => gsap.utils.random(-50, 50) }, { yPercent: 0, x: 0, duration: 0.75, ease: 'power4.out', stagger: 0.07 }, 0.9);
  tl.add(t2(0.7), 1.2);
  tl.to(slices, { yPercent: 118, duration: 0.9, ease: 'power3.inOut' }, 3.2);
  tl.to('.intro__tag', { top: 24, duration: 0.9, ease: 'power3.inOut' }, 3.2);
  tl.to(intro, { backgroundColor: 'rgba(0,0,0,0)', duration: 0.9, ease: 'power2.inOut' }, 3.2);
  tl.add(playFilm, 3.2);
  tl.add(() => { intro.classList.add('is-done'); doc.classList.add('ready'); lenis!.start(); syncTheme(); }, 4.2);
  links.forEach((t, i) => tl.add(t(0.35), 4.3 + i * 0.12));
  tl.add(lines[0](0.7), 4.35);
  tl.add(lines[1](0.8), 4.8);
  tl.add(sub(1.1), 4.7);
  tl.add(cta(0.4), 5.8);
} else {
  doc.classList.add('ready');
  addEventListener('scroll', () => { syncTheme(); byCentre(); }, { passive: true });
}
syncTheme();
