import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Flip } from 'gsap/Flip';
import { SplitText } from 'gsap/SplitText';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger, Flip, SplitText);

const $ = <T extends Element = HTMLElement>(s: string, r: ParentNode = document) => r.querySelector(s) as T | null;
const $$ = <T extends Element = HTMLElement>(s: string, r: ParentNode = document) => Array.from(r.querySelectorAll(s)) as T[];
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const mq = matchMedia('(max-width: 991px)');
const small = () => mq.matches;
const root = document.documentElement;

/* ---------------- smooth scroll (same feel as the reference: duration 1, exponential ease) ---------------- */
let lenis: Lenis | null = null;
if (!reduce) {
  lenis = new Lenis({ duration: 1, easing: (x) => (x === 1 ? 1 : 1 - Math.pow(2, -10 * x)), touchMultiplier: 2 });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis!.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
}
const lock = () => { lenis?.stop(); if (!lenis) root.style.overflow = 'hidden'; };
const unlock = () => { lenis?.start(); if (!lenis) root.style.overflow = ''; };

/* ---------------- palette: one pale/dark pair at a time ---------------- */
const pairs: { light: string; dark: string }[] = JSON.parse($('#pairs')!.textContent || '[]');
let pairIndex = 0;
function nextPair() {
  pairIndex = (pairIndex + 1) % pairs.length;
  root.style.setProperty('--light', pairs[pairIndex].light);
  root.style.setProperty('--dark', pairs[pairIndex].dark);
}
$('[data-palette-btn]')?.addEventListener('click', nextPair);
ScrollTrigger.create({ trigger: '[data-footer-hero]', start: 'top 55%', onEnter: nextPair });

/* ---------------- loader: nine curtains, then the whole stack lifts ---------------- */
const loader = $('[data-loader]');
const loaderOn = root.classList.contains('js') && !root.classList.contains('no-loader') && loader && !reduce;
function heroIntro() {
  if (reduce) return;
  const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
  tl.from('[data-hero] .wordmark', { scaleY: 0.55, transformOrigin: '50% 100%', opacity: 0, duration: 1.1 }, 0)
    .from('[data-hero] .mascot', { scale: 0.9, opacity: 0, duration: 1.2 }, 0.1)
    .from('[data-hero] .hero__nav', { y: 20, opacity: 0, duration: 0.8 }, 0.5)
    .from('[data-hero] [data-sticker]', { scale: 0, rotation: -40, duration: 1, ease: 'elastic.out(1, 0.6)' }, 0.7);
}
if (loaderOn) {
  try { sessionStorage.setItem('mld-seen', '1'); } catch (e) { /* private mode */ }
  lock();
  const items = $$('.loader__item', loader!);
  items.forEach((el, i) => (el.style.zIndex = String(items.length - i)));
  const step = 0.24;
  items.forEach((el, i) => { if (i < items.length - 1) gsap.delayedCall(0.2 + i * step, () => (el.style.opacity = '0')); });
  gsap.to(loader, {
    yPercent: -100, duration: 1, ease: 'power3.inOut', delay: 0.2 + (items.length - 1) * step + 0.35,
    onStart: heroIntro,
    onComplete: () => { (loader as HTMLElement).style.display = 'none'; unlock(); },
  });
} else {
  loader && ((loader as HTMLElement).style.display = 'none');
  heroIntro();
}

/* ---------------- the sticker travels between five places on the page (GSAP Flip, spin) ---------------- */
const sticker = $('[data-sticker]')!;
let where = 'hero';
function moveTo(name: string, duration = 1.6) {
  if (small() || reduce || where === name) return;
  const target = $(`[data-anchor="${name}"]`);
  if (!target) return;
  const state = Flip.getState(sticker);
  target.appendChild(sticker);
  where = name;
  Flip.from(state, { duration, ease: 'power2.inOut', absolute: true, scale: true, spin: true });
}
if (!reduce) {
  ScrollTrigger.create({ trigger: '[data-flip="1"]', start: 'top 70%', onEnter: () => moveTo('star', 2), onEnterBack: () => moveTo('star', 1.5), onLeaveBack: () => moveTo('hero', 1.5) });
  ScrollTrigger.create({ trigger: '[data-flip="2"]', start: 'top center', onEnter: () => moveTo('shop', 1.5), onEnterBack: () => moveTo('shop', 1.5), onLeaveBack: () => moveTo('star', 1.5) });
  ScrollTrigger.create({
    trigger: '[data-flip="3"]', start: 'top center', end: 'bottom center',
    onEnter: () => moveTo('wall', 2), onEnterBack: () => moveTo('wall', 1.5), onLeaveBack: () => moveTo('shop', 2), onLeave: () => moveTo('footer', 1.5),
  });
}

/* ---------------- marquee: drifts, speeds up with the scroll ---------------- */
$$('[data-marquee]').forEach((m) => {
  const track = $('[data-track]', m)!;
  const dir = m.hasAttribute('data-reverse') ? 1 : -1;
  let pos = 0, visible = false, half = 0;
  const measure = () => { half = track.scrollWidth / 2; };
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; measure(); }).observe(m);
  addEventListener('resize', measure);
  if (reduce) return;
  gsap.ticker.add((_t, dt) => {
    if (!visible || !half) return;
    const speed = 110 * (1 + Math.min(Math.abs(lenis?.velocity ?? 0), 80) * 0.12);
    pos += dir * speed * (dt / 1000);
    if (dir === -1 && pos <= -half) pos += half;
    if (dir === 1 && pos >= 0) pos -= half;
    if (dir === -1 && pos > 0) pos -= half;
    if (dir === 1 && pos < -half) pos += half;
    gsap.set(track, { x: pos });
  });
});

/* ---------------- scroll motion ---------------- */
if (!reduce) {
  // wall of love: the reference's own parallax numbers, one scripted move per print (percent of its own height)
  const mm = gsap.matchMedia();
  mm.add('(min-width: 992px)', () => {
    $$('.print').forEach((p) => {
      const from = parseFloat(p.dataset.from || '0'), to = parseFloat(p.dataset.to || '0');
      gsap.fromTo(p, { yPercent: from }, { yPercent: to, ease: 'none', scrollTrigger: { trigger: '.wall', start: 'top bottom', end: 'bottom top', scrub: true } });
    });
  });
  // text lines rise out of a mask
  $$('[data-reveal]').forEach((el) => {
    SplitText.create(el.tagName === 'P' || el.tagName === 'H2' ? el : $$('p', el), { type: 'lines', mask: 'lines', autoSplit: true,
      onSplit: (self) => gsap.from(self.lines, { yPercent: 105, duration: 0.95, ease: 'power3.out', stagger: 0.07, scrollTrigger: { trigger: el, start: 'top 82%' } }) });
  });
}

/* ---------------- menu overlay ---------------- */
const menu = $('[data-menu]')!;
const scroller = $('[data-menu-scroll]', menu)!;
scroller.setAttribute('data-lenis-prevent', '');
let menuOpen = false;
let lastFocus: Element | null = null;
function openMenu() {
  if (menuOpen) return;
  menuOpen = true; lastFocus = document.activeElement;
  menu.setAttribute('aria-hidden', 'false'); menu.classList.add('is-open'); lock();
  scroller.scrollTop = 0;
  const names = $$('.area__text', menu);
  const lines = $$('.line--big', menu);
  if (reduce) { gsap.set(menu, { opacity: 1 }); }
  else {
    const tl = gsap.timeline();
    tl.fromTo(menu, { opacity: 0 }, { opacity: 1, duration: 0.8, ease: 'power2.out' });
    tl.fromTo(lines, { width: 0 }, { width: '100%', duration: 0.4, ease: 'power2.out', stagger: 0.03 }, '-=0.4');
    tl.fromTo(names, { yPercent: 105 }, { yPercent: 0, duration: 0.4, ease: 'power2.out', stagger: 0.03 }, '<');
  }
  ($('[data-menu-close]', menu) as HTMLElement).focus({ preventScroll: true });
}
function closeMenu() {
  if (!menuOpen) return;
  menuOpen = false;
  const done = () => { menu.classList.remove('is-open'); menu.setAttribute('aria-hidden', 'true'); unlock(); (lastFocus as HTMLElement | null)?.focus?.({ preventScroll: true }); };
  reduce ? (gsap.set(menu, { opacity: 0 }), done()) : gsap.to(menu, { opacity: 0, duration: 0.8, ease: 'power2.out', onComplete: done });
}
$$('[data-open-menu]').forEach((b) => b.addEventListener('click', openMenu));
sticker.addEventListener('click', openMenu);
$('[data-menu-close]', menu)!.addEventListener('click', closeMenu);
addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMenu(); });

let openArea: HTMLElement | null = null;
let openSite: HTMLElement | null = null;
const dur = reduce ? 0 : 0.8;
const rowH = () => (small() ? innerWidth * 0.16 : innerWidth * 0.06);
function setSite(site: HTMLElement, state: 'closed' | 'open' | 'full') {
  const item = $('.site__item', site)!;
  const banner = $('.site__banner', site)!;
  const h = state === 'closed' ? rowH() : small() ? innerWidth * 1.4 : state === 'open' ? innerHeight * 0.6 : innerHeight;
  site.classList.toggle('is-open', state === 'open');
  site.classList.toggle('is-full', state === 'full' || (small() && state === 'open'));
  gsap.to(item, { height: h, duration: dur, ease: 'power2.inOut' });
  gsap.to(banner, { height: state === 'closed' ? 0 : h, duration: dur, ease: 'power2.inOut' });
  if (state === 'full' && !small()) {
    const top = item.getBoundingClientRect().top - scroller.getBoundingClientRect().top + scroller.scrollTop;
    scroller.scrollTo({ top, behavior: reduce ? 'auto' : 'smooth' });
  }
}
$$('[data-area]').forEach((area) => {
  const btn = $('.area__click', area)!;
  const sites = $('.area__sites', area)!;
  btn.addEventListener('click', () => {
    const open = btn.getAttribute('aria-expanded') === 'true';
    if (openArea && openArea !== area) {
      $('.area__click', openArea)!.setAttribute('aria-expanded', 'false');
      gsap.to($('.area__sites', openArea), { height: 0, duration: dur, ease: 'power2.inOut' });
      $$('[data-site]', openArea).forEach((s) => setSite(s, 'closed'));
    }
    if (open) {
      btn.setAttribute('aria-expanded', 'false');
      gsap.to(sites, { height: 0, duration: dur, ease: 'power2.inOut' });
      $$('[data-site]', area).forEach((s) => setSite(s, 'closed'));
      openArea = null;
    } else {
      btn.setAttribute('aria-expanded', 'true');
      gsap.fromTo(sites, { height: 0 }, { height: 'auto', duration: dur, ease: 'power2.inOut' });
      openArea = area;
    }
  });
  $$('[data-site]', area).forEach((site) => {
    const item = $('.site__item', site)!;
    const row = $('.site__row', site)!;
    const banner = $('.site__banner', site)!;
    const cursor = $('[data-cursor]', site)!;
    row.addEventListener('click', () => {
      const isOpen = site.classList.contains('is-open') || site.classList.contains('is-full');
      if (openSite && openSite !== site) setSite(openSite, 'closed');
      if (isOpen) { setSite(site, 'closed'); openSite = null; } else { setSite(site, 'open'); openSite = site; }
      gsap.to(sites, { height: 'auto', duration: 0.1, delay: dur });
    });
    // the round "Go!" that follows the pointer over the banner (springs in, like the reference)
    if (!reduce) {
      const qx = gsap.quickTo(cursor, 'x', { duration: 0.4, ease: 'power2.out' });
      const qy = gsap.quickTo(cursor, 'y', { duration: 0.4, ease: 'power2.out' });
      gsap.set(cursor, { xPercent: -50, yPercent: -50 });
      banner.addEventListener('mouseenter', () => { if (small() || site.classList.contains('is-full')) return; gsap.fromTo(cursor, { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.6, ease: 'elastic.out(1, 0.9)' }); });
      banner.addEventListener('mousemove', (e) => { const r = item.getBoundingClientRect(); qx(e.clientX - r.left); qy(e.clientY - r.top); });
      banner.addEventListener('mouseleave', () => gsap.to(cursor, { scale: 0, opacity: 0, duration: 0.4, ease: 'power2.out' }));
    }
    banner.addEventListener('click', () => {
      if (small() || !site.classList.contains('is-open')) return;
      gsap.to(cursor, { scale: 0, opacity: 0, duration: 0.25 });
      setSite(site, 'full');
    });
    $('[data-site-back]', site)!.addEventListener('click', () => setSite(site, 'open'));
  });
});

/* ---------------- smooth in-page links ---------------- */
$$('a[href^="#"]').forEach((a) => {
  const id = a.getAttribute('href')!;
  if (id.length < 2) return;
  a.addEventListener('click', (e) => {
    const t = $(id); if (!t) return;
    e.preventDefault();
    lenis ? lenis.scrollTo(t, { duration: 1.6 }) : t.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
  });
});
$('[data-top]')?.addEventListener('click', (e) => { e.preventDefault(); lenis ? lenis.scrollTo(0, { duration: 2.2 }) : scrollTo({ top: 0 }); });

/* ---------------- easter eggs ---------------- */
// 1. The mascot takes a bite
const mascot = $('[data-mascot]')!;
const mascotArt = $('.mascot__art', mascot)!;
function bite() {
  if (reduce) return;
  gsap.timeline()
    .to(mascotArt, { scaleY: 0.93, scaleX: 1.05, duration: 0.12, ease: 'power2.in' })
    .to(mascotArt, { scaleY: 1.09, scaleX: 0.96, duration: 0.18, ease: 'power2.out' })
    .to(mascotArt, { scaleY: 1, scaleX: 1, duration: 0.7, ease: 'elastic.out(1, 0.35)' });
  gsap.fromTo('[data-hero] .wordmark', { opacity: 1 }, { opacity: 0.25, duration: 0.07, repeat: 5, yoyo: true, ease: 'steps(1)', onComplete: () => { gsap.set('[data-hero] .wordmark', { opacity: 1 }); } });
  const hero = $('[data-hero]')!;
  const r = mascot.getBoundingClientRect(); const hr = hero.getBoundingClientRect();
  for (let i = 0; i < 16; i++) {
    const e = document.createElement('span'); e.className = 'ember';
    e.style.left = r.left - hr.left + r.width * (0.3 + Math.random() * 0.4) + 'px'; e.style.top = r.top - hr.top + r.height * 0.18 + 'px';
    hero.appendChild(e);
    gsap.to(e, { x: (Math.random() - 0.5) * r.width * 0.6, y: -r.height * (0.2 + Math.random() * 0.4), scale: Math.random() * 1.4 + 0.3, opacity: 0, duration: 1 + Math.random() * 0.8, ease: 'power2.out', onComplete: () => e.remove() });
  }
}
mascot.addEventListener('click', bite);

// 2. Type "ciao" anywhere, or press and hold the mascot: it rains food
const rainBox = $('[data-rain]')!;
function rain() {
  if (reduce) return;
  const src: string[] = JSON.parse(rainBox.dataset.srcs || '[]');
  const total = 18;
  for (let i = 0; i < total; i++) {
    const el = document.createElement('img'); el.alt = ''; el.src = src[i % src.length];
    rainBox.appendChild(el);
    const x = Math.random() * (innerWidth - 120);
    gsap.fromTo(el, { x, y: -200, rotation: Math.random() * 60 - 30, opacity: 1 }, { y: innerHeight + 200, rotation: '+=' + (Math.random() * 360 - 180), duration: 2.2 + Math.random() * 1.6, delay: i * 0.11, ease: 'power1.in', onComplete: () => el.remove() });
  }
}
let typed = '';
addEventListener('keydown', (e) => { if (e.key.length !== 1) return; typed = (typed + e.key.toLowerCase()).slice(-4); if (typed === 'ciao') rain(); });
let hold: number | undefined;
mascot.addEventListener('pointerdown', (e) => { if (e.pointerType === 'touch') hold = window.setTimeout(rain, 650); });
['pointerup', 'pointerleave', 'pointercancel'].forEach((ev) => mascot.addEventListener(ev, () => window.clearTimeout(hold)));
// 3. The sunburst changes the colours (wired above)

addEventListener('load', () => ScrollTrigger.refresh());
