import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

const doc = document.documentElement;
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const canHover = matchMedia('(hover: hover)').matches;
const wide = () => matchMedia('(min-width: 861px)').matches;
const $ = <T extends HTMLElement>(s: string, r: ParentNode = document) => r.querySelector<T>(s)!;
const $$ = <T extends HTMLElement>(s: string, r: ParentNode = document) => [...r.querySelectorAll<T>(s)];

// ---------- Header, menu ----------
const header = $('.header');
const themeEls = $$('[data-theme]').filter((e) => e !== header);
const syncTheme = () => {
  const hit = themeEls.find((e) => { const r = e.getBoundingClientRect(); return r.top <= 30 && r.bottom > 30; });
  header.dataset.theme = hit?.dataset.theme ?? 'dark';
  header.classList.toggle('is-scrolled', scrollY > innerHeight * 0.6);
};
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

// ---------- Marques roller: logic shared by scroll and pointer ----------
const rItems = $$('.roller__list li');
const rLogos = $$('.roller__tile .logo');
const rNotes = $$('.roller__note span');
let rActive = 0;
const setMarque = (i: number, wipe = true) => {
  if (i === rActive) return;
  rActive = i;
  rItems.forEach((n, k) => n.classList.toggle('is-active', k === i));
  rNotes.forEach((n, k) => n.classList.toggle('is-active', k === i));
  rLogos.forEach((n, k) => n.classList.toggle('is-active', k === i));
  if (wipe && !reduce) gsap.fromTo(rLogos[i], { clipPath: 'inset(0 0 100% 0)' }, { clipPath: 'inset(0 0 0% 0)', duration: 0.7, ease: 'expo.out', overwrite: true });
};
rItems.forEach((li, i) => {
  li.addEventListener('pointerenter', () => canHover && setMarque(i));
  li.addEventListener('focus', () => setMarque(i));
  li.addEventListener('click', () => setMarque(i));
});

// ---------- Hero film ----------
const film = $('.hero__film');
const video = $<HTMLVideoElement>('.hero__video');
const playFilm = () => {
  video.play().catch(() => {});
  video.addEventListener('timeupdate', () => { if (video.duration - video.currentTime < 0.7) film.dataset.fade = '1'; });
  video.addEventListener('ended', () => { video.currentTime = 0; delete film.dataset.fade; video.play().catch(() => {}); });
};

// ---------- Typed text (intro, headline, links) ----------
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

// ---------- Split text into lines or words ----------
const originals = new Map<HTMLElement, string>();
const splitWords = (el: HTMLElement) => {
  const text = originals.get(el) ?? el.textContent ?? '';
  originals.set(el, text);
  el.setAttribute('aria-label', text);
  el.textContent = '';
  const words = text.split(/\s+/).map((t, i, all) => {
    const w = document.createElement('span'); w.className = 'w'; w.setAttribute('aria-hidden', 'true'); w.textContent = t;
    el.append(w);
    if (i < all.length - 1) el.append(' ');
    return w;
  });
  return words;
};
const splitLines = (el: HTMLElement) => {
  const words = splitWords(el);
  const lines: HTMLElement[][] = [];
  let top = -1;
  words.forEach((w) => {
    const t = Math.round(w.offsetTop);
    if (t !== top) { lines.push([]); top = t; }
    lines[lines.length - 1].push(w);
  });
  el.textContent = '';
  return lines.map((ws) => {
    const ln = document.createElement('span'); ln.className = 'ln'; ln.setAttribute('aria-hidden', 'true');
    const inner = document.createElement('span'); inner.className = 'ln__in';
    ws.forEach((w, i) => { inner.append(w); if (i < ws.length - 1) inner.append(' '); });
    ln.append(inner); el.append(ln);
    return inner;
  });
};
const splitChars = (el: HTMLElement) => {
  const text = el.textContent ?? '';
  el.setAttribute('aria-label', text);
  el.textContent = '';
  return [...text].map((ch) => {
    const c = document.createElement('span'); c.className = 'w'; c.setAttribute('aria-hidden', 'true'); c.textContent = ch === ' ' ? '\u00a0' : ch;
    el.append(c); return c;
  });
};

// ---------- Reduced motion: static page ----------
if (reduce) {
  doc.classList.add('ready');
  addEventListener('scroll', syncTheme, { passive: true });
  syncTheme();
} else {
  gsap.registerPlugin(ScrollTrigger);
  lenis = new Lenis({ lerp: 0.16, wheelMultiplier: 1.05 });
  lenis.on('scroll', () => { ScrollTrigger.update(); syncTheme(); });
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
      lenis!.scrollTo(el ?? 0, { duration: 1.4 });
    });
  });

  // ---------- Intro timeline, timed from the reference frames ----------
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
  tl.to(slices, { yPercent: 118, duration: 0.9, ease: 'expo.inOut' }, 3.2);
  tl.to('.intro__tag', { top: 24, duration: 0.9, ease: 'expo.inOut' }, 3.2);
  tl.to(intro, { backgroundColor: 'rgba(0,0,0,0)', duration: 0.9, ease: 'power2.inOut' }, 3.2);
  tl.add(playFilm, 3.2);
  tl.add(() => { intro.classList.add('is-done'); doc.classList.add('ready'); lenis!.start(); syncTheme(); }, 4.2);
  links.forEach((t, i) => tl.add(t(0.35), 4.3 + i * 0.12));
  tl.add(lines[0](0.7), 4.35);
  tl.add(lines[1](0.8), 4.8);
  tl.add(sub(1.1), 4.7);
  tl.add(cta(0.4), 5.8);

  // ---------- Scroll motion ----------
  const build = () => {
    // Statements: lines rise from a mask when they enter, and every word lights up as you read down.
    $$('[data-lines]').forEach((el) => {
      const inner = splitLines(el);
      el.classList.add('is-split');
      gsap.fromTo(inner, { yPercent: 110 }, { yPercent: 0, duration: 1.2, ease: 'expo.out', stagger: 0.09, scrollTrigger: { trigger: el, start: 'top 82%', once: true } });
      gsap.fromTo($$('.w', el), { opacity: 0.2 }, { opacity: 1, ease: 'none', stagger: 0.1, scrollTrigger: { trigger: el, start: 'top 70%', end: 'bottom 40%', scrub: true } });
    });
    // Labels and links fade up.
    $$('[data-reveal]').forEach((el) => {
      gsap.fromTo(el, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 90%', once: true } });
    });
    // Quote: every word lights up as you scroll through it.
    $$('[data-words]').forEach((el) => {
      const words = splitWords(el);
      el.classList.add('is-split');
      gsap.fromTo(words, { opacity: 0.16 }, { opacity: 1, ease: 'none', stagger: 0.12, scrollTrigger: { trigger: el, start: 'top 80%', end: 'bottom 45%', scrub: true } });
    });
    // Photographs: an inset opens and the picture settles as you pass.
    $$('.photo').forEach((sec) => {
      const img = sec.querySelector('img')!;
      gsap.fromTo(sec, { clipPath: 'inset(10% 7% 10% 7%)' }, { clipPath: 'inset(0% 0% 0% 0%)', ease: 'none', scrollTrigger: { trigger: sec, start: 'top 95%', end: 'top 25%', scrub: true } });
      gsap.fromTo(img, { scale: 1.16, yPercent: -5 }, { scale: 1, yPercent: 5, ease: 'none', scrollTrigger: { trigger: sec, start: 'top bottom', end: 'bottom top', scrub: true } });
    });
    // Marques: the row crossing the middle of the screen becomes the active one.
    rItems.forEach((li, i) => {
      ScrollTrigger.create({ trigger: li, start: 'top center', end: 'bottom center', onToggle: (self) => { if (self.isActive) setMarque(i); } });
    });
    // Numbers count up.
    $$('[data-count]').forEach((el) => {
      const to = Number(el.dataset.count);
      const o = { n: 0 };
      el.textContent = '0';
      gsap.to(o, { n: to, duration: 1.8, ease: 'expo.out', onUpdate: () => { el.textContent = Math.round(o.n).toLocaleString('en-US'); }, scrollTrigger: { trigger: el, start: 'top 88%', once: true } });
    });
    // Hero: the headline, line and link lift away and the film drifts as you leave it.
    gsap.to('.hero__title, .hero__sub, .hero__cta', { yPercent: -18, opacity: 0, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: '70% top', scrub: true } });
    gsap.to('.hero__film', { yPercent: 10, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
    // Marques and next links: each name builds letter by letter as it rises into view.
    [...$$('.roller__list li span'), ...$$('.next__list a span')].forEach((el) => {
      const chars = splitChars(el);
      gsap.fromTo(chars, { yPercent: 70, opacity: 0 }, { yPercent: 0, opacity: 1, ease: 'none', stagger: 0.04, scrollTrigger: { trigger: el, start: 'top 96%', end: 'top 62%', scrub: true } });
    });
    // Rows, figures and footer details drift into place with the scroll.
    $$('.rows__item').forEach((el) => {
      gsap.fromTo(el, { yPercent: 40, opacity: 0.2 }, { yPercent: 0, opacity: 1, ease: 'none', scrollTrigger: { trigger: el, start: 'top 98%', end: 'top 72%', scrub: true } });
    });
    gsap.fromTo('.footer__links a, .footer__top .label, .footer__biz > *, .footer__legal', { yPercent: 60, opacity: 0.1 }, { yPercent: 0, opacity: 1, ease: 'none', stagger: 0.06, scrollTrigger: { trigger: '.footer', start: 'top 85%', end: 'top 25%', scrub: true } });
    // Proof: the photograph moves slowly; the three squares drift past each other at different speeds.
    const stage = $('.proof__stage');
    gsap.fromTo('.proof__bg', { yPercent: -6 }, { yPercent: 6, ease: 'none', scrollTrigger: { trigger: stage, start: 'top bottom', end: 'bottom top', scrub: true } });
    if (wide()) [['.square--1', 90], ['.square--2', -40], ['.square--3', 150]].forEach(([sel, d]) => {
      gsap.fromTo(sel as string, { y: d as number }, { y: -(d as number), ease: 'none', scrollTrigger: { trigger: stage, start: 'top bottom', end: 'bottom top', scrub: true } });
    });
    // Footer wordmark rises into its frame.
    gsap.fromTo('.footer__mark', { yPercent: 105 }, { yPercent: 0, duration: 1.5, ease: 'expo.out', scrollTrigger: { trigger: '.footer__markwrap', start: 'top 92%', once: true } });
  };

  // Milestones: a pinned scene; the year rolls digit by digit, the line and tile swap.
  const ms = $('.milestones');
  const msStacks = $$('.ms__stack');
  const msCaps = $$('.ms__caption span');
  const msTiles = $$('.ms__tile > *');
  const msN = msCaps.length;
  const msTile = $('.ms__tile');
  let msActive = 0;
  const setMilestone = (i: number) => {
    if (i === msActive) return;
    const dir = i > msActive ? 1 : -1;
    const prev = msActive;
    msActive = i;
    gsap.to(msStacks, { yPercent: -(100 / msN) * i, duration: 1.1, ease: 'expo.inOut', stagger: { each: 0.07, from: 'end' }, overwrite: true });
    gsap.killTweensOf(msCaps);
    msCaps.forEach((c, k) => { c.classList.toggle('is-active', k === i); if (k !== i && k !== prev) gsap.set(c, { opacity: 0, yPercent: 0 }); });
    gsap.to(msCaps[prev], { yPercent: -60 * dir, opacity: 0, duration: 0.4, ease: 'power3.in' });
    gsap.fromTo(msCaps[i], { yPercent: 60 * dir, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.9, ease: 'expo.out', delay: 0.3 });
    msTiles.forEach((t, k) => { if (k !== i) t.classList.remove('is-active'); });
    msTiles[i].classList.add('is-active');
    gsap.killTweensOf(msTiles);
    gsap.fromTo(msTiles[i], { clipPath: 'inset(0 0 100% 0)' }, { clipPath: 'inset(0 0 0% 0)', duration: 0.8, ease: 'expo.out' });
    // the tile frame enters from alternating sides at alternating sizes
    gsap.killTweensOf(msTile);
    gsap.fromTo(msTile, { x: 70 * dir * (i % 2 ? 1 : -1) }, { x: i % 2 ? 90 : 0, scale: i % 2 ? 0.74 : 1, transformOrigin: 'top left', duration: 1.1, ease: 'expo.out' });
  };
  ScrollTrigger.create({
    trigger: ms, start: 'top top', end: 'bottom bottom',
    onUpdate: (self) => { if (wide()) { ms.style.setProperty('--mp', self.progress.toFixed(4)); setMilestone(Math.min(msN - 1, Math.floor(self.progress * msN * 0.999))); } },
  });

  // Pointer: sector rows already wipe their tile in CSS; the next links drag a tile after the pointer.
  if (canHover) {
    const tile = $('.next__tile');
    const imgs = $$('img', tile);
    const lis = $$('.next__list li');
    const qx = gsap.quickTo(tile, 'x', { duration: 0.6, ease: 'power3.out' });
    const qy = gsap.quickTo(tile, 'y', { duration: 0.6, ease: 'power3.out' });
    const list = $('.next__list');
    list.addEventListener('pointermove', (e) => { qx(e.clientX + 24); qy(e.clientY - 120); });
    lis.forEach((li, i) => {
      li.addEventListener('pointerenter', () => { imgs.forEach((im, k) => im.classList.toggle('is-active', k === i)); gsap.to(tile, { opacity: 1, scale: 1, duration: 0.5, ease: 'expo.out' }); });
    });
    list.addEventListener('pointerleave', () => gsap.to(tile, { opacity: 0, scale: 0.9, duration: 0.4, ease: 'power2.out' }));
    gsap.set(tile, { scale: 0.9 });
  }

  const start = () => { build(); ScrollTrigger.refresh(); };
  (document as Document & { fonts?: FontFaceSet }).fonts?.ready.then(start) ?? start();
  let lastW = innerWidth;
  addEventListener('resize', () => { if (Math.abs(innerWidth - lastW) > 40) location.reload(); });
}
syncTheme();
