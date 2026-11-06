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

/* ---------------- loader: nine curtains you can read, then a soft fade into the hero ---------------- */
const loader = $('[data-loader]');
const loaderOn = root.classList.contains('js') && !root.classList.contains('no-loader') && loader && !reduce;
// The hero reveals itself with CSS (blur to clear, see .hi); we only say when to start.
const heroGo = () => { root.classList.add('hero-go'); startPops(); };
if (loaderOn) {
  lock();
  // One reel of names rolls up, one name at a time; the colours morph between areas instead of cutting.
  const reel = $('[data-reel]', loader!)!;
  const cs: { bg: string; fg: string }[] = JSON.parse((loader as HTMLElement).dataset.curtains || '[]');
  const n = $$('.loader__name', reel).length;
  let left = false;
  const roll = gsap.timeline({ delay: 0.5 });
  for (let i = 1; i < n; i++) {
    const c = cs[i % cs.length];
    roll.to(reel, { yPercent: -(100 / n) * i, duration: 0.52, ease: 'power3.inOut' }, '>+0.2')
      .to(loader, { backgroundColor: c.bg, color: c.fg, duration: 0.52, ease: 'power2.inOut' }, '<');
  }
  roll.call(() => leave(), [], '>+0.7'); // the last name rests a moment
  const leave = () => {
    if (left) return;
    left = true;
    roll.kill();
    removeEventListener('keydown', leave);
    loader!.removeEventListener('pointerdown', leave);
    loader!.classList.add('is-leaving');
    heroGo();
    gsap.to(loader, { opacity: 0, duration: 1.8, ease: 'power2.inOut', onComplete: () => { (loader as HTMLElement).style.display = 'none'; unlock(); } });
  };
  // any click, tap or key skips it
  loader!.addEventListener('pointerdown', leave);
  addEventListener('keydown', leave);
} else {
  loader && ((loader as HTMLElement).style.display = 'none');
  heroGo();
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
const rowH = () => (small() ? innerWidth * 0.12 : innerWidth * 0.06);
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

/* ---------------- food menu overlay: categories on the left, items on the right ---------------- */
const fm = $('[data-fm]')!;
const fmScroll = $('[data-fm-scroll]', fm)!;
fmScroll.setAttribute('data-lenis-prevent', '');
const cats = $$('[data-cat]', fm);
let fmOpen = false;
let fmFocus: Element | null = null;
function revealPanel(cat: HTMLElement) {
  if (reduce) return;
  gsap.fromTo($$('.item', cat), { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.55, ease: 'power3.out', stagger: 0.04, overwrite: true });
  const list = $('.cat__items', cat); if (list) list.scrollTop = 0;
}
function selectCat(cat: HTMLElement) {
  const open = cat.classList.contains('is-active');
  if (small()) {
    // phone: an accordion, one category open at a time
    cats.forEach((c) => {
      if (c !== cat && c.classList.contains('is-active')) {
        c.classList.remove('is-active'); $('.cat__name', c)!.setAttribute('aria-expanded', 'false');
        gsap.to($('.cat__panel', c), { height: 0, duration: reduce ? 0 : 0.6, ease: 'power2.inOut' });
      }
    });
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
  if (fmOpen || menuOpen) return;
  fmOpen = true; fmFocus = document.activeElement;
  fm.setAttribute('aria-hidden', 'false'); fm.classList.add('is-open'); lock();
  fmScroll.scrollTop = 0;
  const first = cats[0];
  const names = $$('.cat__text', fm);
  const lines = $$('.line--big', fm);
  if (reduce) { gsap.set(fm, { opacity: 1 }); }
  else {
    const tl = gsap.timeline();
    tl.fromTo(fm, { opacity: 0 }, { opacity: 1, duration: 0.8, ease: 'power2.out' });
    tl.fromTo(lines, { width: 0 }, { width: small() ? '100%' : '42vw', duration: 0.4, ease: 'power2.out', stagger: 0.03 }, '-=0.4');
    tl.fromTo(names, { yPercent: 105 }, { yPercent: 0, duration: 0.4, ease: 'power2.out', stagger: 0.03 }, '<');
    tl.add(() => revealPanel(first), '-=0.1');
  }
  ($('[data-fm-close]', fm) as HTMLElement).focus({ preventScroll: true });
}
function closeFm() {
  if (!fmOpen) return;
  fmOpen = false;
  const done = () => { fm.classList.remove('is-open'); fm.setAttribute('aria-hidden', 'true'); unlock(); (fmFocus as HTMLElement | null)?.focus?.({ preventScroll: true }); };
  reduce ? (gsap.set(fm, { opacity: 0 }), done()) : gsap.to(fm, { opacity: 0, duration: 0.8, ease: 'power2.out', onComplete: done });
}
$$('[data-open-fm]').forEach((b) => b.addEventListener('click', openFm));
$('[data-fm-close]', fm)!.addEventListener('click', closeFm);
addEventListener('keydown', (e) => { if (e.key === 'Escape') closeFm(); });

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
// 1. Press the mascot: she squashes, jumps, lands and settles, the wordmark flickers and embers rise
const mascot = $('[data-mascot]')!;
const mascotArt = $('.mascot__art', mascot)!;
function jump() {
  if (reduce) return;
  gsap.timeline()
    .to(mascotArt, { scaleY: 0.9, scaleX: 1.06, duration: 0.12, ease: 'power2.in' })
    .to(mascotArt, { y: () => -innerHeight * 0.07, scaleY: 1.05, scaleX: 0.97, duration: 0.26, ease: 'power2.out' })
    .to(mascotArt, { y: 0, scaleY: 1, scaleX: 1, duration: 0.24, ease: 'power2.in' })
    .to(mascotArt, { scaleY: 0.94, scaleX: 1.04, duration: 0.08, ease: 'power1.out' })
    .to(mascotArt, { scaleY: 1, scaleX: 1, duration: 0.7, ease: 'elastic.out(1, 0.4)' });
  gsap.fromTo('[data-hero] .wordmark', { opacity: 1 }, { opacity: 0.25, duration: 0.07, repeat: 5, yoyo: true, ease: 'steps(1)', onComplete: () => { gsap.set('[data-hero] .wordmark', { opacity: 1 }); } });
  const hero = $('[data-hero]')!;
  const r = mascot.getBoundingClientRect();
  const hr = hero.getBoundingClientRect();
  for (let i = 0; i < 16; i++) {
    const e = document.createElement('span');
    e.className = 'ember';
    e.style.left = r.left - hr.left + r.width * (0.3 + Math.random() * 0.4) + 'px';
    e.style.top = r.top - hr.top + r.height * 0.18 + 'px';
    hero.appendChild(e);
    gsap.to(e, { x: (Math.random() - 0.5) * r.width * 0.6, y: -r.height * (0.2 + Math.random() * 0.4), scale: Math.random() * 1.4 + 0.3, opacity: 0, duration: 1 + Math.random() * 0.8, ease: 'power2.out', onComplete: () => e.remove() });
  }
}
mascot.addEventListener('click', jump);

// 2. Type "ciao" anywhere, or press and hold the mascot on touch: it rains food
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

/* ---------------- hero pop-ups: a themed hint 3.6 s in (it teaches CIAO), then a few random ones ---------------- */
function startPops() {
  const box = $('[data-pops]');
  if (!box || reduce || box.dataset.started) return;
  box.dataset.started = '1';
  const first = JSON.parse(box.dataset.first || '{}');
  const more: { t: string; kind: string }[] = JSON.parse(box.dataset.more || '[]');
  const touch = matchMedia('(pointer: coarse)').matches;
  const spots: [number, number][] = small() ? [[3, 17], [34, 21], [4, 66], [30, 62]] : [[4, 10], [66, 8], [3, 66], [70, 66]];
  let last = -1, shown = 0, heroVisible = true;
  new IntersectionObserver(([e]) => { heroVisible = e.isIntersecting; }).observe(box.parentElement!);
  const burst = () => 'polygon(' + Array.from({ length: 32 }, (_, i) => { const a = (i / 32) * Math.PI * 2; const r = i % 2 ? 40 : 50; return (50 + Math.cos(a) * r).toFixed(1) + '% ' + (50 + Math.sin(a) * r).toFixed(1) + '%'; }).join(',') + ')';
  function show(text: string, kind: string, hold: number) {
    const el = document.createElement('div');
    el.className = 'pop' + (kind === 'burst' ? ' pop--burst' : '');
    el.textContent = text;
    if (kind === 'burst') el.style.clipPath = burst();
    let k = Math.floor(Math.random() * spots.length);
    if (k === last) k = (k + 1) % spots.length;
    last = k;
    el.style.left = spots[k][0] + '%'; el.style.top = spots[k][1] + '%';
    box!.appendChild(el);
    const rot = Math.random() * 14 - 7;
    gsap.fromTo(el, { scale: 0, rotation: rot - 25, opacity: 0 }, { scale: 1, rotation: rot, opacity: 1, duration: 0.85, ease: 'elastic.out(1, 0.6)' });
    const out = () => gsap.to(el, { scale: 0.7, opacity: 0, y: -12, duration: 0.45, ease: 'power2.in', onComplete: () => el.remove() });
    gsap.delayedCall(hold, out);
    el.addEventListener('click', out);
  }
  const next = () => {
    if (shown >= 6) return;
    window.setTimeout(() => {
      if (heroVisible && !menuOpen && !fmOpen) { const m = more[Math.floor(Math.random() * more.length)]; show(m.t, m.kind, 4); shown += 1; }
      next();
    }, 6000 + Math.random() * 3000);
  };
  window.setTimeout(() => { show(touch ? first.touch : first.desktop, 'label', 5.5); shown += 1; next(); }, 3600);
}


addEventListener('load', () => ScrollTrigger.refresh());
