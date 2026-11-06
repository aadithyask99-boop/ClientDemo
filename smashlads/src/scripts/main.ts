import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import Lenis from 'lenis';
import { initBuilder } from './builder';
import { initGame } from './game';
import { initCart } from './cart';

gsap.registerPlugin(ScrollTrigger, SplitText);

const $ = <T extends Element = HTMLElement>(s: string, r: ParentNode = document) => r.querySelector(s) as T | null;
const $$ = <T extends Element = HTMLElement>(s: string, r: ParentNode = document) => Array.from(r.querySelectorAll(s)) as T[];
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const mq = matchMedia('(max-width: 991px)');
const small = () => mq.matches;
const root = document.documentElement;

/* ---------------- smooth scroll ---------------- */
let lenis: Lenis | null = null;
if (!reduce) {
  lenis = new Lenis({ duration: 1.1, easing: (x) => (x === 1 ? 1 : 1 - Math.pow(2, -10 * x)), touchMultiplier: 2 });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis!.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
}
const lock = () => { lenis?.stop(); if (!lenis) root.style.overflow = 'hidden'; };
const unlock = () => { lenis?.start(); if (!lenis) root.style.overflow = ''; };

/* ---------------- preloader: a burger builds itself, a CRAVING flash, then a soft blur into the hero ---------------- */
const loader = $('[data-loader]');
const loaderOn = root.classList.contains('js') && !root.classList.contains('no-loader') && loader && !reduce;
const heroGo = () => root.classList.add('hero-go');
if (loaderOn) {
  lock();
  const L = loader as HTMLElement;
  const layers = $$('.ls', L); // top, lettuce, patty, bottom (drawn top first)
  const b = $('[data-lb]', L)!;
  const a = $('[data-la]', L)!;
  let left = false;
  const tl = gsap.timeline({ delay: 0.2 });
  const order = [...layers].reverse(); // bottom bun first, top bun last
  gsap.set(layers, { y: -700, autoAlpha: 1 });
  order.forEach((el, i) => tl.to(el, { y: 0, duration: 0.55, ease: 'bounce.out' }, i * 0.55));
  tl.fromTo($('p', a), { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6 }, 0.1)
    .to($('[data-ls]', L), { scaleY: 0.94, duration: 0.12, yoyo: true, repeat: 1, transformOrigin: '50% 100%' }, '>-0.1')
    .to({}, { duration: 0.9 }) // the finished burger holds, so it can be seen
    .set(b, { autoAlpha: 1 })
    .fromTo(b, { scale: 0.92 }, { scale: 1, duration: 0.7, ease: 'power2.out' }, '<')
    .to({}, { duration: 0.5 })
    .call(() => leave(), []);
  const leave = () => {
    if (left) return;
    left = true;
    tl.kill();
    removeEventListener('keydown', leave);
    L.removeEventListener('pointerdown', leave);
    L.classList.add('is-leaving');
    heroGo();
    gsap.to(L, { opacity: 0, duration: 1.2, ease: 'power2.inOut', onComplete: () => { L.style.display = 'none'; unlock(); } });
  };
  L.addEventListener('pointerdown', leave);
  addEventListener('keydown', leave);
} else {
  loader && ((loader as HTMLElement).style.display = 'none');
  heroGo();
}

/* ---------------- the top bar tucks away while you scroll down and returns when you scroll up ---------------- */
const topbar = $('.top')!;
let lastY = 0;
const onScroll = () => {
  const y = scrollY; const dy = y - lastY; lastY = y;
  if (y < 80) topbar.classList.remove('is-away');
  else if (dy > 6) topbar.classList.add('is-away');
  else if (dy < -6) topbar.classList.remove('is-away');
};
addEventListener('scroll', onScroll, { passive: true });

/* ---------------- nav card with a blurred page ---------------- */
const veil = $('[data-veil]')!;
const nav = $('[data-navcard]')!;
let navOpen = false;
function openNav() {
  if (navOpen) return; navOpen = true; lock();
  nav.classList.add('is-open'); nav.setAttribute('aria-hidden', 'false');
  gsap.set(veil, { visibility: 'visible' });
  gsap.to(veil, { opacity: 1, duration: reduce ? 0 : 0.5 });
  gsap.fromTo(nav, { opacity: 0, scale: 0.9, y: -20 }, { opacity: 1, scale: 1, y: 0, duration: reduce ? 0 : 0.55, ease: 'power3.out' });
  gsap.fromTo($$('li', nav), { x: 30, opacity: 0 }, { x: 0, opacity: 1, duration: reduce ? 0 : 0.5, stagger: 0.05, delay: 0.1, ease: 'power3.out' });
}
function closeNav(then?: () => void) {
  if (!navOpen) { then?.(); return; } navOpen = false;
  gsap.to(nav, { opacity: 0, scale: 0.95, duration: reduce ? 0 : 0.3, onComplete: () => { nav.classList.remove('is-open'); nav.setAttribute('aria-hidden', 'true'); unlock(); then?.(); } });
  gsap.to(veil, { opacity: 0, duration: reduce ? 0 : 0.4, onComplete: () => { gsap.set(veil, { visibility: 'hidden' }); } });
}
$('[data-open-nav]')!.addEventListener('click', openNav);
$('[data-nav-close]')!.addEventListener('click', () => closeNav());
veil.addEventListener('click', () => closeNav());

/* ---------------- food menu overlay: categories left, the chosen category right ---------------- */
const fm = $('[data-fm]')!;
const fmScroll = $('[data-fm-scroll]', fm)!;
fmScroll.setAttribute('data-lenis-prevent', '');
const cats = $$('[data-cat]', fm);
let fmOpen = false;
let fmFocus: Element | null = null;
function revealPanel(cat: HTMLElement) {
  if (reduce) return;
  gsap.fromTo($$('.card, .item', cat), { y: 26, opacity: 0 }, { y: 0, opacity: 1, duration: 0.55, ease: 'power3.out', stagger: 0.05, overwrite: true });
  const list = $('.cards, .items', cat); if (list) list.scrollTop = 0;
}
function selectCat(cat: HTMLElement) {
  const open = cat.classList.contains('is-active');
  if (small()) {
    cats.forEach((c) => { if (c !== cat && c.classList.contains('is-active')) { c.classList.remove('is-active'); $('.cat__name', c)!.setAttribute('aria-expanded', 'false'); gsap.to($('.cat__panel', c), { height: 0, duration: reduce ? 0 : 0.6, ease: 'power2.inOut' }); } });
    const panel = $('.cat__panel', cat)!;
    if (open) { cat.classList.remove('is-active'); $('.cat__name', cat)!.setAttribute('aria-expanded', 'false'); gsap.to(panel, { height: 0, duration: reduce ? 0 : 0.6, ease: 'power2.inOut' }); }
    else { cat.classList.add('is-active'); $('.cat__name', cat)!.setAttribute('aria-expanded', 'true'); gsap.fromTo(panel, { height: 0 }, { height: 'auto', duration: reduce ? 0 : 0.7, ease: 'power2.inOut' }); revealPanel(cat); }
    return;
  }
  if (open) return;
  cats.forEach((c) => { c.classList.toggle('is-active', c === cat); $('.cat__name', c)!.setAttribute('aria-expanded', String(c === cat)); gsap.set($('.cat__panel', c), { clearProps: 'height' }); });
  revealPanel(cat);
}
cats.forEach((cat) => $('.cat__name', cat)!.addEventListener('click', () => selectCat(cat)));
function openFm() {
  if (fmOpen) return;
  const go = () => {
    fmOpen = true; fmFocus = document.activeElement;
    fm.setAttribute('aria-hidden', 'false'); fm.classList.add('is-open'); lock(); fmScroll.scrollTop = 0;
    const names = $$('.cat__text', fm);
    if (reduce) gsap.set(fm, { opacity: 1 });
    else {
      const tl = gsap.timeline();
      tl.fromTo(fm, { opacity: 0 }, { opacity: 1, duration: 0.7, ease: 'power2.out' });
      tl.fromTo(names, { yPercent: 105 }, { yPercent: 0, duration: 0.45, ease: 'power2.out', stagger: 0.05 }, '-=0.35');
      tl.add(() => revealPanel(cats[0]), '-=0.1');
    }
    ($('[data-fm-close]', fm) as HTMLElement).focus({ preventScroll: true });
  };
  navOpen ? closeNav(go) : go();
}
function closeFm() {
  if (!fmOpen) return; fmOpen = false;
  const done = () => { fm.classList.remove('is-open'); fm.setAttribute('aria-hidden', 'true'); unlock(); (fmFocus as HTMLElement | null)?.focus?.({ preventScroll: true }); };
  reduce ? (gsap.set(fm, { opacity: 0 }), done()) : gsap.to(fm, { opacity: 0, duration: 0.7, ease: 'power2.out', onComplete: done });
}
$$('[data-open-fm]').forEach((b) => b.addEventListener('click', openFm));
$('[data-fm-close]', fm)!.addEventListener('click', closeFm);
addEventListener('keydown', (e) => { if (e.key === 'Escape') { closeFm(); closeNav(); } });
$$('[data-nav-link]').forEach((a) => { if (!(a as HTMLElement).hasAttribute('data-open-fm')) a.addEventListener('click', () => closeNav()); });

/* ---------------- locations and contact overlays ---------------- */
const ovs = $$('[data-ov]');
let ovOpen: HTMLElement | null = null;
function openOv(name: string) {
  const el = ovs.find((o) => o.dataset.ov === name);
  if (!el || ovOpen) return;
  const go = () => {
    ovOpen = el; el.classList.add('is-open'); el.setAttribute('aria-hidden', 'false'); lock();
    gsap.fromTo(el, { opacity: 0 }, { opacity: 1, duration: reduce ? 0 : 0.6, ease: 'power2.out' });
    gsap.fromTo($$('.place, .contact > *, .ov__title', el), { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: reduce ? 0 : 0.6, stagger: 0.08, ease: 'power3.out', delay: 0.1 });
    ($('[data-ov-close]', el) as HTMLElement).focus({ preventScroll: true });
  };
  navOpen ? closeNav(go) : go();
}
function closeOv() {
  if (!ovOpen) return;
  const el = ovOpen; ovOpen = null;
  gsap.to(el, { opacity: 0, duration: reduce ? 0 : 0.4, onComplete: () => { el.classList.remove('is-open'); el.setAttribute('aria-hidden', 'true'); unlock(); } });
}
$$('[data-open-ov]').forEach((b) => b.addEventListener('click', () => openOv(b.dataset.openOv!)));
$$('[data-ov-close]').forEach((b) => b.addEventListener('click', closeOv));
addEventListener('keydown', (e) => { if (e.key === 'Escape') closeOv(); });
$('[data-cform]')?.addEventListener('submit', (e) => {
  e.preventDefault();
  const o = $('[data-cok]');
  if (o) o.textContent = 'Thanks! This is a concept, so nothing was sent.';
  ((e.target as HTMLElement) as unknown as { reset: () => void }).reset();
});

/* ---------------- hero: the cheese melts as you scroll (a frame sequence on a canvas) ----------------
   The page scrolls normally. The first frame puts the burger exactly where the old hero had it; as you scroll the cheese
   melts and its strands lengthen down toward the next headline. */
const cv = $('[data-seqcv]') as HTMLCanvasElement | null;
if (cv) {
  const ctx = cv.getContext('2d')!;
  const probe = (document.querySelector('[data-sprite]') as HTMLImageElement).src; // an image that already loads shows the art folder
  const dir = probe.slice(0, probe.lastIndexOf('/') + 1) + 'seq/';
  const seqEl = $('[data-seq]')!;
  const cropD = (cv.dataset.cropD || '0,1').split(',').map(Number); // the desktop frames keep only the middle band
  let set = small() ? 'm' : 'd';
  let N = Number(cv.dataset[set === 'm' ? 'nm' : 'nd']);
  const frames: (HTMLImageElement | null)[] = [];
  let want = 0, shown = -1, dpr = 1, vw = 0, fwS = 0, fhS = 0, dyS = 0, canvasH = 0;
  const url = (i: number) => `${dir}${set}-${String(i + 1).padStart(3, '0')}.webp`;
  // where the burger sits inside its frame (fractions measured on the source frames)
  const geo = () => set === 'm'
    ? { bw: 0.889, bt: 0.117, aspect: 9 / 16, wb: Math.min(innerWidth * 0.98, innerHeight * 0.5), top: 0.34 }
    : { bw: 0.406, bt: 0.0648, aspect: 16 / 9, wb: Math.min(innerWidth * 0.42, innerHeight * 0.64), top: 0.24 };
  function size() {
    const g = geo(), H = innerHeight;
    vw = innerWidth; dpr = Math.min(2, devicePixelRatio || 1);
    fwS = g.wb / g.bw; fhS = fwS / g.aspect;
    dyS = g.top * H - g.bt * fhS;
    canvasH = Math.round(dyS + fhS);
    seqEl.style.setProperty('--seq-h', canvasH + 'px');
    cv!.width = Math.round(vw * dpr); cv!.height = Math.round(canvasH * dpr); shown = -1; draw();
  }
  function draw() {
    // the nearest frame at or before the wanted one that has loaded
    let i = Math.min(N - 1, Math.max(0, want));
    while (i > 0 && !frames[i]) i--;
    const im = frames[i];
    if (!im || i === shown) return;
    shown = i;
    const c0 = set === 'd' ? cropD[0] : 0, wFrac = im.naturalWidth / (im.naturalHeight * geo().aspect); // width of this frame as a share of the full frame
    ctx.clearRect(0, 0, cv!.width, cv!.height);
    ctx.drawImage(im, ((vw - fwS) / 2 + c0 * fwS) * dpr, dyS * dpr, wFrac * fwS * dpr, fhS * dpr);
  }
  function load() {
    frames.length = 0; N = Number(cv!.dataset[set === 'm' ? 'nm' : 'nd']);
    const order: number[] = [0, N - 1]; // the first and last frames first, then every fourth, then the rest, so scrubbing works early
    for (let k = 4; k < N - 1; k += 4) order.push(k);
    for (let k = 1; k < N - 1; k++) if (k % 4) order.push(k);
    let n = 0;
    const next = () => {
      if (n >= order.length) return;
      const i = order[n++]; const im = new Image(); im.decoding = 'async';
      im.onload = () => { frames[i] = im; if (i === want || i === 0) draw(); next(); };
      im.onerror = () => next();
      im.src = url(i);
    };
    for (let w = 0; w < 4; w++) next();
  }
  size(); load();
  addEventListener('resize', () => { const ns = small() ? 'm' : 'd'; if (ns !== set) { set = ns; load(); } size(); });
  const range = () => innerHeight * 0.8; // the melt plays over the first 80% of a screen of scrolling, then the strands simply hang
  if (reduce) { want = N - 1; draw(); }
  else ScrollTrigger.create({ trigger: document.body, start: 0, end: () => range(), onUpdate: (self) => { want = Math.round(self.progress * (N - 1)); draw(); } });
}

/* ---------------- in-page links ---------------- */
$$('a[href^="#"]').forEach((a) => {
  const id = a.getAttribute('href')!;
  if (id.length < 2) return;
  a.addEventListener('click', (e) => { const t = $(id); if (!t) return; e.preventDefault(); lenis ? lenis.scrollTo(t, { duration: 1.6 }) : t.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' }); });
});

/* ---------------- scroll motion ---------------- */
if (!reduce) {
  const mm = gsap.matchMedia();
  // hero: the burger rises and the giant words part as you leave
  const hs = { trigger: '[data-seq]', start: 'top top', end: 'bottom bottom', scrub: true };
  gsap.to('.hero__title .t1', { xPercent: -10, ease: 'none', scrollTrigger: hs });
  gsap.to('.hero__title .t2', { xPercent: 10, ease: 'none', scrollTrigger: hs });
  // tilted trio drift at their own speeds
  mm.add('(min-width: 992px)', () => {
    $$('.trio__p').forEach((p) => { const sp = parseFloat(p.dataset.speed || '1'); gsap.fromTo(p, { y: sp * 90 }, { y: -sp * 90, ease: 'none', scrollTrigger: { trigger: '.trio', start: 'top bottom', end: 'bottom top', scrub: true } }); });
  });
  // glove mascot floats; big photo slides slowly
  gsap.fromTo('.mascot', { y: 60 }, { y: -60, ease: 'none', scrollTrigger: { trigger: '[data-band]', start: 'top bottom', end: 'bottom top', scrub: true } });
  gsap.fromTo('.held img', { yPercent: -6 }, { yPercent: 6, ease: 'none', scrollTrigger: { trigger: '.held', start: 'top bottom', end: 'bottom top', scrub: true } });
  gsap.fromTo('.feel__img img', { scale: 1.15 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: '.feel', start: 'top bottom', end: 'center center', scrub: true } });
  // the dashed route draws itself, the stops pop in
  $$('[data-route]').forEach((p) => { const el = p as unknown as SVGPathElement; gsap.fromTo(el, { opacity: 0 }, { opacity: 0.9, duration: 0.2, scrollTrigger: { trigger: '[data-london]', start: 'top 70%' } }); });
  gsap.from('[data-stop]', { scale: 0, rotation: -20, opacity: 0, duration: 0.8, ease: 'back.out(1.6)', stagger: 0.18, scrollTrigger: { trigger: '[data-london]', start: 'top 50%' } });
  // more scrubbed life: chips bob, stops drift, the route marches, the kid and the facts slide
  mm.add('(min-width: 992px)', () => {
    $$('[data-stop]').forEach((s, i) => gsap.fromTo(s, { y: 50 + i * 20 }, { y: -50 - i * 20, ease: 'none', scrollTrigger: { trigger: '[data-london]', start: 'top bottom', end: 'bottom top', scrub: true } }));
    gsap.fromTo('.facts li', { y: 30 }, { y: -10, ease: 'none', stagger: 0.1, scrollTrigger: { trigger: '[data-band]', start: 'top bottom', end: 'bottom top', scrub: true } });
  });
  $$('[data-route]').forEach((p, i) => gsap.fromTo(p, { strokeDashoffset: 0 }, { strokeDashoffset: i ? 400 : -400, ease: 'none', scrollTrigger: { trigger: '[data-london]', start: 'top bottom', end: 'bottom top', scrub: true } }));
  gsap.fromTo('.feel__kid', { rotation: -8, y: 40 }, { rotation: 8, y: -40, ease: 'none', scrollTrigger: { trigger: '.feel', start: 'top bottom', end: 'bottom top', scrub: true } });
  mm.add('(min-width: 992px)', () => {
    gsap.fromTo('.london h2', { x: -40 }, { x: 40, ease: 'none', scrollTrigger: { trigger: '[data-london]', start: 'top bottom', end: 'bottom top', scrub: true } });
    gsap.fromTo('.feel h2', { x: 40 }, { x: -20, ease: 'none', scrollTrigger: { trigger: '.feel', start: 'top bottom', end: 'center center', scrub: true } });
  });
  gsap.fromTo('.stmt .tag', { rotation: -12, y: 20 }, { rotation: 4, y: -10, ease: 'none', scrollTrigger: { trigger: '.stmt', start: 'top bottom', end: 'bottom top', scrub: true } });
  gsap.fromTo('.tag--orange2', { y: 40 }, { y: -40, ease: 'none', scrollTrigger: { trigger: '[data-band]', start: 'top bottom', end: 'bottom top', scrub: true } });
  gsap.fromTo('.tag--c', { y: 30 }, { y: -30, ease: 'none', scrollTrigger: { trigger: '.held', start: 'top bottom', end: 'bottom top', scrub: true } });
  const ts = { trigger: '[data-seq]', start: 'top top', end: '+=70%', scrub: true };
  gsap.fromTo('.seq__front .tag--a', { y: 0, opacity: 1 }, { y: -70, opacity: 0, ease: 'none', scrollTrigger: ts });
  gsap.fromTo('.seq__front .tag--b', { y: 0, opacity: 1 }, { y: -110, opacity: 0, ease: 'none', scrollTrigger: ts });
  // sticker tags wobble in
  $$('.tag').forEach((t) => { if (t.closest('.hero')) return; gsap.from(t, { scale: 0.4, rotation: -25, opacity: 0, duration: 0.7, ease: 'back.out(2)', scrollTrigger: { trigger: t, start: 'top 90%' } }); });
  // headlines rise out of a mask
  $$('[data-reveal]').forEach((el) => {
    SplitText.create(el, { type: 'lines', mask: 'lines', autoSplit: true, onSplit: (self) => gsap.from(self.lines, { yPercent: 105, duration: 0.95, ease: 'power3.out', stagger: 0.08, scrollTrigger: { trigger: el, start: 'top 85%' } }) });
  });
  // the footer wordmark settles
  gsap.fromTo('.foot__word', { yPercent: 30 }, { yPercent: 0, ease: 'none', scrollTrigger: { trigger: '[data-foot]', start: 'top bottom', end: 'top 20%', scrub: true } });
}

/* ---------------- easter eggs ---------------- */
// 1. Press the burger mascot: it jumps and says something
const glove = $('[data-glove]');
const bubble = $('[data-bubble]');
const lines = ['Hands off the patty!', 'Extra cheese, mate!', 'Cheeky!', 'Mind the sauce!', 'Smash me up!'];
let li = 0;
glove?.addEventListener('click', () => {
  if (bubble) { bubble.textContent = lines[li++ % lines.length]; }
  if (reduce) return;
  gsap.timeline().to('.mascot img', { scaleY: 0.92, scaleX: 1.05, duration: 0.12, transformOrigin: '50% 100%' }).to('.mascot img', { y: -60, scaleY: 1.04, scaleX: 0.97, duration: 0.28, ease: 'power2.out' }).to('.mascot img', { y: 0, scaleY: 1, scaleX: 1, duration: 0.5, ease: 'elastic.out(1, 0.45)' });
  if (bubble) gsap.fromTo(bubble, { scale: 0, opacity: 0, rotation: -8 }, { scale: 1, opacity: 1, rotation: 4, duration: 0.5, ease: 'back.out(2)' }), gsap.to(bubble, { opacity: 0, scale: 0.8, duration: 0.4, delay: 1.8 });
});
// 2. Type "smash": ingredients rain down. The 10-layer burger triggers the same.
const rainBox = $('[data-rain]')!;
function rain() {
  if (reduce) return;
  const src: string[] = JSON.parse(rainBox.dataset.srcs || '[]');
  for (let i = 0; i < 22; i++) {
    const el = document.createElement('img'); el.alt = ''; el.src = src[i % src.length]; rainBox.appendChild(el);
    gsap.fromTo(el, { x: Math.random() * (innerWidth - 100), y: -200, rotation: Math.random() * 60 - 30, opacity: 1 }, { y: innerHeight + 200, rotation: '+=' + (Math.random() * 360 - 180), duration: 2.2 + Math.random() * 1.6, delay: i * 0.1, ease: 'power1.in', onComplete: () => el.remove() });
  }
}
let typed = '';
addEventListener('keydown', (e) => { if (e.key.length !== 1) return; typed = (typed + e.key.toLowerCase()).slice(-5); if (typed === 'smash') rain(); });

initCart(reduce);
initBuilder(reduce, rain);
initGame(reduce);

addEventListener('load', () => ScrollTrigger.refresh());
