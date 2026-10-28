// Brew More: scroll + interaction layer. Mechanics follow docs in ../../ANIMATION-STUDY.md
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { CustomEase } from 'gsap/CustomEase';
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin';
import { InertiaPlugin } from 'gsap/InertiaPlugin';
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';
import Swiper from 'swiper';
import { Navigation, Controller, EffectCreative } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/effect-creative';
import { X0, X1, L, R, makeCurve, samples, cumulative, px, py, fmtHour, REG, BM, W as CW, STEP } from './energy-data.js';

gsap.registerPlugin(ScrollTrigger, SplitText, CustomEase, DrawSVGPlugin, InertiaPlugin);

const BASE = document.querySelector('meta[name="base"]')?.content ?? '';
const IMG = (p) => `${BASE}/img/${p}`;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const root = document.documentElement;
const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---- eases ----------------------------------------------------------------
CustomEase.create('smooth-ease', '0.32, 0.72, 0, 1');
CustomEase.create('elastic-ease-out', 'M0,0 L0.076,0.5737 L0.1187,0.8382 L0.1419,0.9463 L0.1654,1.0292 L0.1897,1.0886 L0.2153,1.1258 L0.2297,1.137 L0.2448,1.1424 L0.261,1.1423 L0.2786,1.1366 L0.3101,1.1165 L0.3862,1.0507 L0.4257,1.0219 L0.4699,0.9995 L0.5163,0.9872 L0.5877,0.9842 L0.8126,1.0011 L1,1');
CustomEase.create('elastic-ease-out-soft', 'M0,0 L0.017,0.029 L0.036,0.113 L0.111,0.604 L0.15,0.809 L0.191,0.949 L0.213,0.995 L0.236,1.026 L0.262,1.044 L0.293,1.049 L0.435,1.01 L0.512,1 L1,1');
gsap.defaults({ ease: 'smooth-ease' });

// ---- helpers --------------------------------------------------------------
const resizeFns = new Set();
let rz;
addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(() => resizeFns.forEach((f) => f()), 60); });
const onResize = (f) => (resizeFns.add(f), () => resizeFns.delete(f));
const desktop = (fn) => gsap.matchMedia().add('(min-width: 992px)', fn);
const mobile = (fn) => gsap.matchMedia().add('(max-width: 991px)', fn);
const DPR = Math.min(devicePixelRatio || 1, 2);
const wrap = (v, n) => { let i = v % n; return Math.abs(i) > n / 2 ? (i > 0 ? i - n : i + n) : i; };
const lerpExp = (a, b, k, dt) => a + (b - a) * (1 - Math.exp(-k * dt));
const loadBitmap = async (url) => {
  const blob = await (await fetch(url)).blob();
  return createImageBitmap ? createImageBitmap(blob) : new Promise((r) => { const i = new Image(); i.onload = () => r(i); i.src = URL.createObjectURL(blob); });
};

history.scrollRestoration = 'manual';
ScrollTrigger.clearScrollMemory('manual');
let lenis;

// ---- smooth scroll --------------------------------------------------------
function initLenis() { lenis = new Lenis({ lerp: 0.18, autoRaf: true, anchors: true }); window.__lenis = lenis; }

// ---- pointer inertia: push the bubbles -------------------------------------
function initInertia() {
  if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  const cv = gsap.utils.clamp(-1080, 1080), cr = gsap.utils.clamp(-60, 60);
  $$('[data-inertia]').forEach((box) => {
    let px = 0, py = 0, dx = 0, dy = 0, raf = null;
    box.addEventListener('mousemove', (e) => {
      if (raf) return;
      raf = requestAnimationFrame(() => { dx = e.clientX - px; dy = e.clientY - py; px = e.clientX; py = e.clientY; raf = null; });
    });
    $$('[data-inertia-item]', box).forEach((item) => {
      item.addEventListener('mouseenter', (e) => {
        const child = $('[data-inertia-item-child]', item); if (!child) return;
        const r = child.getBoundingClientRect(), ox = e.clientX - (r.left + r.width / 2), oy = e.clientY - (r.top + r.height / 2);
        const cross = (ox * dy - oy * dx) / (Math.hypot(ox, oy) || 1);
        gsap.to(child, { inertia: { x: { velocity: cv(30 * dx), end: 0 }, y: { velocity: cv(30 * dy), end: 0 }, rotation: { velocity: cr(15 * cross), end: 0 }, resistance: 180 } });
      });
    });
  });
}

// ---- hero / intro ---------------------------------------------------------
async function hero() {
  const stage = $('[data-load-stage]'); if (!stage) return;
  const nav = $('[data-load-nav]'), logo = $('[data-load-stage-logo]'), logoText = $('[data-logo-text]');
  const cta = $('[data-load-stage-cta]'), title = $('[data-load-stage-title]'), text = $('[data-load-stage-text]');
  const underline = $('[data-load-stage-underline]'), facts = $$('[data-load-stage-fact]'), canvas = $('[data-load-stage-canvas]');
  const decoText = $('[data-load-stage-deco-text]'), decoArrow = $('[data-load-stage-deco-arrow]'), ring = $('[data-load-stage-ring]');
  const ctx = canvas.getContext('2d', { alpha: true });
  const FRAMES = 23;
  const tides = $$('.tide');
  if (RM) tides.forEach((t) => t.style.setProperty('--lv', `${+t.dataset.level * 100}%`));

  const size = () => {
    const r = canvas.getBoundingClientRect(), w = canvas.offsetWidth, h = canvas.offsetHeight;
    canvas.width = Math.round(w * DPR); canvas.height = Math.round(h * DPR); ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  };
  let bitmaps = [], ready = false, cur = 0;
  const draw = (i) => {
    cur = i; if (!ready) return;
    const b = bitmaps[i], w = canvas.width / DPR, h = canvas.height / DPR; ctx.clearRect(0, 0, w, h);
    const s = Math.min(w / b.width, h / b.height); ctx.drawImage(b, (w - b.width * s) / 2, (h - b.height * s) / 2, b.width * s, b.height * s);
  };
  size(); onResize(() => { size(); draw(cur); });

  const first = await loadBitmap(IMG('hero/seq_1_0.webp'));
  bitmaps = [first, ...(await Promise.all(Array.from({ length: FRAMES - 1 }, (_, i) => loadBitmap(IMG(`hero/seq_1_${i + 1}.webp`)))))];
  ready = true; draw(0);
  root.classList.add('has-seq-ready');
  setTimeout(() => requestAnimationFrame(() => root.classList.add('is-ready')), 50);

  if (RM) { draw(11); gsap.set(canvas, { rotate: -11 }); lenis?.start(); return; }

  const m = innerHeight / 2 - (logo.getBoundingClientRect().top + logo.getBoundingClientRect().height / 2);
  const titleSplit = SplitText.create(title, { type: 'lines', linesClass: 'split-line' });
  const textSplit = SplitText.create(text, { type: 'lines', linesClass: 'split-line' });
  const o = { frame: 0 };
  const tl = gsap.timeline();
  lenis?.stop();

  const run = (isDesktop) => {
    gsap.set(logo, { y: m }); gsap.set(nav, { opacity: 0 }); gsap.set(cta, { opacity: 0, y: 60 });
    gsap.set(ring, { drawSVG: '50% 50%' });
    gsap.set(facts, { opacity: 0, y: 100, x: -40, rotate: -35, scale: 0.6 });
    gsap.set(canvas, isDesktop ? { yPercent: 100, xPercent: -50, rotate: -35, scale: 0.9, opacity: 0, transformPerspective: 1000, transformOrigin: '60% 50%' } : { yPercent: 150, xPercent: -50, rotate: -35, scale: 1.1, opacity: 0 });
    if (isDesktop) {
      gsap.set(decoText, { opacity: 0, rotate: -18, scale: 1.25, yPercent: -65, xPercent: -25 });
      gsap.set(decoArrow, { opacity: 0, rotate: -6, scale: 1.25, yPercent: 0, xPercent: -125 });
      gsap.set(titleSplit.lines, { transformOrigin: '100% 100%', yPercent: 60, xPercent: 25, opacity: 0, scale: 0.6 });
    } else {
      gsap.set(decoText, { rotate: -7, opacity: 0 }); gsap.set(titleSplit.lines, { yPercent: 60, opacity: 0 });
    }
    gsap.set(textSplit.lines, { yPercent: 125, opacity: 0 });
    gsap.set(underline, { opacity: 0, yPercent: 45 });

    // idle loops: jar sprite scrubs back and forth while the jar breathes; paused when off screen
    const spr = gsap.fromTo(o, { frame: FRAMES - 1 }, { frame: 0, snap: 'frame', ease: 'sine.inOut', yoyo: true, repeat: -1, duration: 1.38, paused: true, onUpdate: () => draw(Math.round(o.frame)), immediateRender: false });
    const bob = gsap.fromTo(canvas, isDesktop ? { yPercent: -1, rotate: -11, rotateX: 0, rotateY: 0 } : { yPercent: -1, rotate: -11 },
      isDesktop ? { yPercent: 2, rotate: -13, rotateX: -4, rotateY: -5, duration: 1.38, ease: 'sine.inOut', repeat: -1, yoyo: true, paused: true } : { yPercent: 1, rotate: -13, duration: 1.38, ease: 'sine.inOut', repeat: -1, yoyo: true, paused: true });
    const idle = (on) => { on ? (bob.play(), spr.play()) : (bob.pause(), spr.pause()); };

    // logo draws on (stroke, then fill), as the ref's lottie does
    logoText.style.strokeDasharray = '2400'; gsap.set(logoText, { strokeDashoffset: 2400, fillOpacity: 0 });
    gsap.timeline().to(logoText, { strokeDashoffset: 0, duration: 1, ease: 'power2.inOut' }).to(logoText, { fillOpacity: 1, duration: 0.35, ease: 'none' }, 0.65).set(logoText, { strokeWidth: 0 });

    tl.to(logo, { y: 0, duration: 0.6, delay: 1 })
      .to(nav, { opacity: 1, duration: 0.25 }, '<+=.125')
      .to(cta, { y: 0, opacity: 1, duration: 0.5 }, '<+=.05')
      .to(ring, { drawSVG: '0% 100%', ease: 'power2.out', duration: 1.4 }, '<+=.005')
      .to(facts, { opacity: 1, y: 0, x: 0, rotate: 0, scale: 1, ease: 'elastic-ease-out', duration: 0.8, stagger: -0.048 }, '<-=.015')
      .to(tides, { '--lv': (i, el) => `${+el.dataset.level * 100}%`, duration: 1.8, ease: 'power2.out', stagger: 0.12 }, '<+.35');
    if (isDesktop) tl.to(decoText, { yPercent: 0, xPercent: 0, opacity: 1, scale: 1, rotate: -7, duration: 0.45 }, '<-=.015').to(decoArrow, { yPercent: 10, opacity: 1, rotate: 9, scale: 1, xPercent: 0, duration: 0.45 }, '<+=.005');
    else tl.to(decoText, { opacity: 1, duration: 0.45 }, '<-=.015');
    tl.to(canvas, { yPercent: -1, xPercent: 0, rotate: -11, scale: 1, opacity: 1, duration: 0.85, onComplete: () => {
        ScrollTrigger.create({ trigger: canvas, start: 'top bottom', end: 'bottom top', onEnter: () => idle(true), onEnterBack: () => idle(true), onLeave: () => idle(false), onLeaveBack: () => idle(false) });
      } }, '<-=.005')
      .to(o, { frame: FRAMES - 1, duration: 0.85, ease: 'sine.out', snap: 'frame', onUpdate: () => draw(Math.round(o.frame)) }, '<-=.005')
      .to(titleSplit.lines, isDesktop ? { yPercent: 0, xPercent: 0, opacity: 1, scale: 1, ease: 'elastic-ease-out-soft', duration: 0.95, stagger: 0.039 } : { yPercent: 0, opacity: 1, duration: 0.8, stagger: 0.06 }, '<-=.005')
      .to(textSplit.lines, { yPercent: 0, opacity: 1, duration: 0.5, stagger: 0.039 }, '<+=.01')
      .to(underline, { yPercent: 0, opacity: 1, duration: 0.45 }, '<+=.15')
      .call(() => lenis?.start(), null, '-=1');
  };
  desktop(() => run(true)); mobile(() => run(false));
}

// ---- ribbon: text slides along the curve while you scroll ---------------------
function marquee() {
  $$('[data-marquee]').forEach((el) => {
    const tp = $('[data-marquee-textpath]', el);
    gsap.timeline({ scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true } })
      .fromTo(tp, { attr: { startOffset: '-30%' } }, { attr: { startOffset: '-60%' }, ease: 'none', duration: 1 });
  });
}

// ---- small reveals ----------------------------------------------------------
function smileys() {
  $$('[data-smiley]').forEach((el) => desktop(() => gsap.timeline({ scrollTrigger: { trigger: el, start: 'top 95%' } })
    .fromTo(el, { opacity: 0, scale: 0.5, rotate: 80, transformOrigin: 'left bottom' }, { opacity: 1, scale: 1, rotate: 0, ease: 'elastic-ease-out', duration: 0.95 })));
}
function highlightText() {
  $$('[data-highlight-text]').forEach((t) => {
    const s = SplitText.create(t, { type: 'words', wordsClass: 'split-word' });
    desktop(() => {
      gsap.set(s.words, { transformOrigin: 'bottom right' });
      gsap.timeline({ scrollTrigger: { trigger: t, start: 'top 96%', once: true } })
        .fromTo(s.words, { yPercent: 25, xPercent: 75, opacity: 0, scale: 0.6 }, { yPercent: 0, xPercent: 0, opacity: 1, scale: 1, ease: 'elastic-ease-out-soft', duration: 1, stagger: 0.039 })
        .to(s.words, { color: 'var(--toffee)', ease: 'none', duration: 0.15, stagger: 0.039 }, '<+.1');
    });
    mobile(() => gsap.timeline({ scrollTrigger: { trigger: t, start: 'top 90%', once: true } }).to(s.words, { color: 'var(--toffee)', ease: 'none', duration: 0.15, stagger: 0.039 }));
  });
}
function fillLine() {
  $$('[data-fill-line]').forEach((el) => {
    const paths = $$('path', el);
    desktop(() => gsap.timeline({ scrollTrigger: { trigger: el, start: 'top 70%', once: true } }).fromTo(paths, { drawSVG: '0% 0%' }, { drawSVG: '100% 0%', ease: 'none', duration: 0.75, stagger: 0.25 }));
  });
}
function benefitTable() {
  $$('[data-benefit-table]').forEach((t) => {
    const lines = $$('[data-benefit-table-line]', t);
    gsap.set(lines, { transformOrigin: 'left center' });
    gsap.timeline({ scrollTrigger: { trigger: t, start: 'top 90%', once: true } }).fromTo(lines, { scaleX: 0 }, { scaleX: 1, stagger: 0.076, duration: 0.85 });
  });
  // ticks stamp (squash + tilt, then elastic rebound) each time they cross the middle of the screen
  $$('[data-benefit-table-check]').forEach((c) => gsap.timeline({ scrollTrigger: { trigger: c, start: 'top 49%', end: 'bottom 51%', toggleActions: 'restart none restart none' } })
    .to(c, { keyframes: { '0%': { scaleX: 1, yPercent: 0, rotate: 0 }, '20%': { scaleX: 0.65, yPercent: 25, rotate: 25, ease: 'power2.in' }, '100%': { scaleX: 1, yPercent: 0, rotate: 0, ease: 'elastic.out(1,0.4)' } }, duration: 0.85 }));
}
function rings() {
  $$('[data-ring]').forEach((r) => gsap.from(r, { opacity: 0, scale: 0.7, rotate: '-=28', duration: 1.2, ease: 'elastic-ease-out-soft', scrollTrigger: { trigger: r, start: 'top 92%', once: true } }));
}
function payment() {
  $$('[data-payment]').forEach((p) => {
    const items = $$('[data-payment-item]', p);
    gsap.timeline({ scrollTrigger: { trigger: p, start: 'top 96%', once: true } })
      .fromTo(items, { opacity: 0, y: 100, x: -40, rotate: -35, scale: 0.6 }, { opacity: 1, y: 0, x: 0, rotate: 0, scale: 1, ease: 'elastic-ease-out', duration: 0.8, stagger: -0.048 });
  });
}
function parallax() {
  $$('[data-testimonial-parallax]').forEach((t) => {
    const items = $$('[data-testimonial-parallax-item]', t);
    desktop(() => gsap.timeline({ scrollTrigger: { trigger: t, start: 'top bottom', end: 'bottom top', scrub: true } }).to(items, { yPercent: 5, ease: 'none', duration: 1 }));
  });
}

// ---- reviews slider: infinite, snapping, lerped, with an inner shear -----------
class Slider {
  constructor(wrapper, cfg = {}) {
    Object.assign(this, { lerpFactor: 0.3, snapStrength: 0.1, speedDecay: 0.9, scrollSensitivity: 1.5, dragSensitivity: 0.005 }, cfg);
    this.wrapper = wrapper; this.items = [...wrapper.children]; this.inner = $$('[data-slider-item-inner]', wrapper);
    this.current = 0; this.target = 0; this.speed = 0; this.lspeed = 0; this.dragging = false; this.visible = false; this.last = performance.now();
    this.active = -1; this.measure();
    wrapper.style.cursor = 'grab';
    new IntersectionObserver((e) => e.forEach((x) => (this.visible = x.isIntersecting)), { rootMargin: '50px' }).observe(wrapper);
    new ResizeObserver(() => this.measure()).observe(wrapper);
    wrapper.addEventListener('mousedown', (e) => this.down(e.clientX));
    addEventListener('mousemove', (e) => this.move(e.clientX, e.movementX));
    addEventListener('mouseup', () => this.up());
    let tx, ty, tdir, tprev;
    wrapper.addEventListener('touchstart', (e) => { const t = e.touches[0]; tx = tprev = t.clientX; ty = t.clientY; tdir = undefined; this.down(t.clientX); }, { passive: true });
    addEventListener('touchmove', (e) => {
      const t = e.touches[0]; if (!this.dragging) return;
      if (!tdir && (Math.abs(t.clientX - tx) > 5 || Math.abs(t.clientY - ty) > 5)) tdir = Math.abs(t.clientX - tx) > Math.abs(t.clientY - ty) ? 'h' : 'v';
      if (tdir === 'h') { e.preventDefault(); this.move(t.clientX, t.clientX - tprev); tprev = t.clientX; }
    }, { passive: false });
    addEventListener('touchend', () => this.up());
    wrapper.addEventListener('wheel', (e) => {                      // horizontal gestures only; vertical wheel keeps scrolling the page
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
      e.preventDefault(); const d = -e.deltaX * 0.5 * this.scrollSensitivity * 0.001; this.target += d; this.speed = 10 * -d;
    }, { passive: false });
    addEventListener('keydown', (e) => {
      if (!this.visible) return;
      if (/^[0-9]$/.test(e.key)) return this.goTo(+e.key);
      if (e.key === 'ArrowLeft') this.prev(); else if (e.key === 'ArrowRight' || e.key === ' ') { if (e.key === ' ') e.preventDefault(); this.next(); }
    });
    gsap.ticker.add(() => this.update());
  }
  measure() { this.itemW = this.items[0].getBoundingClientRect().width || 1; }
  down(x) { this.dragging = true; this.dragX = x; this.dragT = this.target; this.wrapper.style.cursor = 'grabbing'; }
  move(x, mx) { if (!this.dragging) return; this.target = this.dragT + (x - this.dragX) * this.dragSensitivity; this.speed += 0.01 * (mx || 0); }
  up() { if (!this.dragging) return; this.dragging = false; this.wrapper.style.cursor = 'grab'; this.target = Math.round(this.target); }
  next() { this.target = Math.round(this.target - 1); } prev() { this.target = Math.round(this.target + 1); } goTo(i) { this.target = -i; }
  update() {
    if (!this.visible) return;
    const now = performance.now(), dt = (now - this.last) / 1000; this.last = now; const n = this.items.length;
    if (!this.dragging) this.target += (Math.round(this.target) - this.target) * this.snapStrength;
    this.current = lerpExp(this.current, this.target, 1 / this.lerpFactor, dt);
    const idx = ((Math.round(-this.current) % n) + n) % n;
    if (idx !== this.active) { this.items.forEach((el, i) => el.classList.toggle('is-active', i === idx)); this.active = idx; }
    const par = this.items.map((el, i) => { const p = wrap(this.current + i, n); el.style.transform = `translateX(${(p - i) * this.itemW}px)`; return p; });
    this.lspeed = lerpExp(this.lspeed, this.speed, 5, dt); this.speed *= this.speedDecay;
    this.inner.forEach((el, i) => (el.style.transform = `translateX(${par[i] * Math.abs(this.lspeed) * 20}%)`));
  }
}
let reviews;
function reviewsSlider() {
  const el = $('[data-slider]'); if (!el) return;
  reviews = new Slider(el);
  const iface = $('[data-slider-arrows]');
  const [l, r] = iface.children; l.onclick = () => reviews.prev(); r.onclick = () => reviews.next();
  $$('[data-testimonial-inview]').forEach((t) => gsap.timeline({ scrollTrigger: { trigger: t, start: 'top 75%', once: true, onEnter: () => reviews.next() } }));
}

// ---- flavour: two Swiper instances kept in sync ---------------------------------
function flavours() {
  const content = $('[data-flavour-content]'); if (!content) return;
  const touch = matchMedia('(max-width: 991px)').matches;
  const ringPath = $('[data-flavour-content-svg-path]');
  const vis = new Swiper('[data-flavour-slider]', {
    grabCursor: touch, allowTouchMove: touch, effect: 'creative', loop: true, initialSlide: 4,
    creativeEffect: { prev: { translate: touch ? ['-80%', '15%', 0] : ['-60%', '15%', 0], opacity: 0, scale: 0.35, rotate: [0, 0, -15] }, next: { translate: touch ? ['80%', '15%', 0] : ['50%', '15%', 0], opacity: 0, scale: 0.6, rotate: [0, 0, 35] } },
    navigation: { nextEl: '[data-flavour-slider-right-button]', prevEl: '[data-flavour-slider-left-button]' },
    modules: [Navigation, EffectCreative, Controller],
  });
  const txt = new Swiper('[data-flavour-content-slider]', {
    effect: 'creative', loop: true, allowTouchMove: touch, initialSlide: 4,
    creativeEffect: { prev: { translate: touch ? ['-75%', '15%', 0] : ['-40%', '15%', 0], opacity: 0, scale: 0.5 }, next: { translate: touch ? ['75%', '15%', 0] : ['40%', '15%', 0], opacity: 0, scale: 0.5 } },
    modules: [EffectCreative, Controller],
  });
  vis.controller.control = txt; txt.controller.control = vis;
  gsap.set(ringPath, { drawSVG: '65% 65%' });
  gsap.timeline({ scrollTrigger: { trigger: content, start: 'top 65%', once: true, onEnter: () => gsap.delayedCall(0.1, () => vis.slideNext()) } })
    .to(ringPath, { drawSVG: '165% 65%', ease: 'power2.out', duration: 1.4 });
}

// ---- pinned sequence ------------------------------------------------------------
function sequence() {
  const sec = $('[data-sequence]'); if (!sec) return;
  const trigger = $('[data-sequence-trigger]', sec), canvas = $('[data-sequence-canvas]', sec), ctx = canvas.getContext('2d');
  const N = 200, s = { frame: 0 }, imgs = new Array(N);
  for (let i = 0; i < N; i++) { const im = new Image(); im.src = IMG(`seq/seq_0_${i}.webp`); im.onload = () => i === Math.round(s.frame) && render(); imgs[i] = im; }
  const cards = $$('[data-sequence-card]', sec), titleEl = $('[data-sequence-title]', sec), paths = $$('[data-sequence-svg] path', sec);
  const smileysC = $$('[data-sequence-smiley]', sec), sig = $('[data-sequence-signature]', sec), split = $('[data-sequence-title-split]', sec);
  const finalSig = $$('[data-sequence-final-signature]', sec);
  const cookie1 = $('[data-sequence-cookie-first]', sec), cookie2 = $('[data-sequence-cookie-second]', sec), bean1 = $('[data-sequence-strawberry-first]', sec), bean2 = $('[data-sequence-strawberry-second]', sec);
  const stage = $('[data-sequence-stage]', sec), words = SplitText.create(split, { type: 'words', wordsClass: 'split-word' });
  let played = false;

  const fit = () => {
    const r = stage.getBoundingClientRect(), w = Math.round(r.width), h = Math.round(r.height);
    canvas.style.width = w + 'px'; canvas.style.height = h + 'px'; canvas.width = Math.round(w * DPR); canvas.height = Math.round(h * DPR);
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.scale(DPR, DPR); ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
  };
  function render() {
    const w = canvas.width / DPR, h = canvas.height / DPR; ctx.clearRect(0, 0, w, h);
    const im = imgs[Math.round(s.frame)]; if (!im || !im.complete || !im.naturalWidth) return;
    const k = Math.max(w / im.naturalWidth, h / im.naturalHeight);                 // cover: jar stays at the same horizontal spot at any window shape
    ctx.drawImage(im, Math.round((w - im.naturalWidth * k) / 2), Math.round((h - im.naturalHeight * k) / 2), Math.round(im.naturalWidth * k), Math.round(im.naturalHeight * k));
  }
  fit(); render(); onResize(() => { fit(); render(); });

  desktop(() => {
    const vh = innerHeight;
    gsap.to(s, { frame: N - 1, snap: 'frame', ease: 'none', onUpdate: render, scrollTrigger: { trigger, start: 'top 20%', end: 'bottom bottom', scrub: 0.7 } });
    gsap.set(cards, { yPercent: 50, y: 0.6 * vh, xPercent: (i, el) => (el.hasAttribute('data-sequence-card-left') ? 4 : -4) });
    gsap.set(sig, { opacity: 0 }); gsap.set(titleEl, { y: vh, scale: 0.7 }); gsap.set(finalSig, { y: vh });
    gsap.set(cookie1, { y: vh, x: 64 }); gsap.set(cookie2, { y: vh, x: 96 }); gsap.set(bean1, { y: vh, x: -64 }); gsap.set(bean2, { y: vh, x: -96 });

    const w = gsap.timeline({ scrollTrigger: { trigger, start: 'top 60%', end: 'bottom bottom+=25%', scrub: true } });
    w.to(cards, { yPercent: -50, y: -0.6 * vh, xPercent: 0, duration: 1, rotate: (i, el) => (el.hasAttribute('data-sequence-card-left') ? gsap.utils.random(-5, -2) : gsap.utils.random(2, 5)), stagger: 0.85, ease: CustomEase.create('custom', 'M0,0 C0,0.201 0.098,0.459 0.5,0.5 0.904,0.541 1,0.805 1,1') }, 'step')
      .to(titleEl, { y: 0, scale: 0.9, duration: 1.5, ease: 'expoScale(0.5,7,power2.out)' }, '>+=.2')
      .to(finalSig, { y: 0, duration: 1, ease: 'power1.inOut' }, '<')
      .to(cookie1, { y: 0, x: 0, duration: 1.25, ease: 'power1.inOut' }, '<').to(bean1, { y: 0, x: 0, duration: 1.25, ease: 'power1.inOut' }, '<')
      .to(cookie2, { y: 0, x: 0, duration: 1.5, ease: 'power1.inOut' }, '<').to(bean2, { y: 0, x: 0, duration: 1.5, ease: 'power1.inOut' }, '<');
    w.to(smileysC, { rotate: (i, el) => (el.hasAttribute('data-sequence-smiley-left') ? gsap.utils.random(8, 13) : gsap.utils.random(-13, -8)), stagger: 0.85, duration: 1 }, 'step');
    w.to(sig, { keyframes: { '10%': { opacity: 1 }, '70%': { opacity: 1 }, '90%': { opacity: 0 } }, duration: 1.5, ease: 'none' }, 'step+=.75');
    w.fromTo(paths, { drawSVG: '100% 100%' }, { keyframes: [{ drawSVG: '0% 100%', duration: 0.5 }, { drawSVG: '0% 0%', duration: 0.5 }], ease: 'none', stagger: 1.35 }, 'step+=.3');

    // finale: triggered (not scrubbed) with hysteresis so it does not flicker at the threshold
    const wordsTl = gsap.timeline({ paused: true })
      .from(words.words, { xPercent: (i, el, all) => 60 * (Math.floor(all.length / 2) - i), opacity: 0, scale: 0, duration: 1, ease: 'expo.out', stagger: 0.039 }, 'step')
      .from(words.words, { yPercent: 150, duration: 1, stagger: 0.039, ease: 'elastic-ease-out-soft' }, 'step+=0.05');
    const decoTl = gsap.timeline({ paused: true })
      .from(finalSig, { opacity: 0, duration: 0.2, ease: 'none' }, 'step')
      .fromTo(cookie1, { opacity: 0, xPercent: 75, yPercent: 80, scale: 0.5, rotate: -140 }, { opacity: 1, xPercent: 0, yPercent: 0, scale: 1, rotate: -90, ease: 'elastic-ease-out-soft', duration: 0.8 }, 'step+=0.08')
      .fromTo(bean1, { opacity: 0, xPercent: -50, yPercent: 90, scale: 0.5, rotate: 40 }, { opacity: 1, xPercent: 0, yPercent: 0, scale: 1, rotate: -6, ease: 'elastic-ease-out-soft', duration: 0.8 }, 'step+=0.08')
      .fromTo(cookie2, { opacity: 0, xPercent: 50, yPercent: 75, scale: 0.5, rotate: -75 }, { opacity: 1, xPercent: 0, yPercent: 0, scale: 1, rotate: 0, filter: 'blur(3px)', ease: 'elastic-ease-out-soft', duration: 1.15 }, 'step+=0.16')
      .fromTo(bean2, { opacity: 0, xPercent: -50, yPercent: 50, scale: 0.5, rotate: -75 }, { opacity: 1, xPercent: 0, yPercent: 0, scale: 1, rotate: -23, filter: 'blur(4px)', ease: 'elastic-ease-out-soft', duration: 1.15 }, 'step+=0.16');
    ScrollTrigger.create({ trigger, start: 'top 20%', end: 'bottom bottom', onUpdate: (self) => {
      if (self.direction === 1 && !played && self.progress >= 0.85) { played = true; wordsTl.play(0); decoTl.play(0); }
      if (self.direction === -1 && played && self.progress <= 0.675) { played = false; wordsTl.pause(0); decoTl.pause(0); }
    } });
  });
  mobile(() => gsap.to(s, { frame: N - 1, snap: 'frame', ease: 'none', onUpdate: render, scrollTrigger: { trigger, start: 'top 20%', end: 'bottom bottom', scrub: 0.7 } }));
  // phones: cards and titles simply fade up
  mobile(() => $$('.statement-card, .sequence-title', sec).forEach((el) => gsap.from(el, { opacity: 0, y: 40, duration: 0.8, scrollTrigger: { trigger: el, start: 'top 88%', once: true } })));
}


// ---- "The 3pm test": a scroll-drawn energy curve (illustrative data) ---------------------------------
function energy() {
  const sec = $('[data-energy]'); if (!sec) return;
  const svg = $('.energy-svg', sec), chart = $('[data-energy-chart]', sec), hit = $('[data-energy-hit]', sec), cursor = $('[data-energy-cursor]', sec);
  const pReg = $('[data-energy-reg]', sec), pBm = $('[data-energy-bm]', sec), clipRect = $('[data-energy-clip]', sec);
  const line = $('.energy-cursor-line', cursor), dotR = $('.energy-dot.is-reg', cursor), dotB = $('.energy-dot.is-bm', cursor);
  const clock = $('[data-energy-clock]', sec), nReg = $('[data-energy-num-reg]', sec), nBm = $('[data-energy-num-bm]', sec), notes = $$('[data-energy-note]', sec);
  const fReg = makeCurve(REG), fBm = makeCurve(BM), cReg = cumulative(samples(fReg)), cBm = cumulative(samples(fBm));
  const frac = (h, c) => { const i = (h - X0) / STEP, i0 = Math.min(c.length - 1, Math.floor(i)), i1 = Math.min(c.length - 1, i0 + 1); return (c[i0] + (c[i1] - c[i0]) * (i - i0)) / c[c.length - 1]; };
  const shown = new Set(), state = { h: X0 }; let hover = null;
  gsap.set(notes, { opacity: 0, scale: 0.6, transformOrigin: '0% 100%' });

  const set = (h0) => {
    const h = Math.min(X1, Math.max(X0, h0)), x = px(h);
    gsap.set(pReg, { drawSVG: `0% ${frac(h, cReg) * 100}%` }); gsap.set(pBm, { drawSVG: `0% ${frac(h, cBm) * 100}%` });
    clipRect.setAttribute('width', Math.max(0, x - L));
    line.setAttribute('x1', x); line.setAttribute('x2', x);
    dotR.setAttribute('cx', x); dotR.setAttribute('cy', py(fReg(h))); dotB.setAttribute('cx', x); dotB.setAttribute('cy', py(fBm(h)));
    clock.textContent = fmtHour(h); nReg.textContent = Math.round(fReg(h)); nBm.textContent = Math.round(fBm(h));
    cursor.style.opacity = h <= X0 + 0.02 ? 0 : 1;
    notes.forEach((n) => {                                                  // each note pops in when the line reaches its hour
      const on = h >= +n.dataset.energyNote; if (on === shown.has(n)) return;
      on ? shown.add(n) : shown.delete(n);
      gsap.to(n, on ? { opacity: 1, scale: 1, duration: 0.7, ease: 'elastic-ease-out-soft', overwrite: true } : { opacity: 0, scale: 0.6, duration: 0.25, overwrite: true });
    });
  };
  set(X0);

  // hover / touch: scrub the day by hand
  const hourAt = (e) => { const r = svg.getBoundingClientRect(), u = ((e.clientX - r.left) / r.width) * CW; return X0 + ((u - L) / (R - L)) * (X1 - X0); };
  hit.addEventListener('pointermove', (e) => { hover = hourAt(e); set(hover); });
  hit.addEventListener('pointerdown', (e) => { hover = hourAt(e); set(hover); });
  hit.addEventListener('pointerleave', () => { hover = null; set(state.h); });

  desktop(() => {
    if (RM) { state.h = X1; set(X1); return; }
    // pinned: hold, draw the day, hold
    gsap.timeline({ scrollTrigger: { trigger: $('[data-energy-scroll]', sec), start: 'top top', end: 'bottom bottom', scrub: 0.5 }, onUpdate: () => hover === null && set(state.h) })
      .to(state, { h: X0 + 0.01, duration: 0.08 }).to(state, { h: X1, duration: 0.82, ease: 'none' }).to(state, { h: X1, duration: 0.1 });
  });
  mobile(() => {
    if (RM) { state.h = X1; set(X1); return; }
    gsap.to(state, { h: X1, duration: 2.8, ease: 'power1.inOut', onUpdate: () => hover === null && set(state.h), scrollTrigger: { trigger: chart, start: 'top 78%', once: true } });
  });
}

// ---- "Mix your own": canvas glass, a sachet that pours, live numbers ------------------------------------
function mixer() {
  const sec = $('[data-mixer]'); if (!sec) return;
  const mixes = JSON.parse(sec.dataset.mixes), stage = $('[data-mixer-stage]', sec), canvas = $('[data-mixer-canvas]', sec), ctx = canvas.getContext('2d');
  const tubImg = $('[data-mixer-tub]', sec), sachet = $('[data-mixer-sachet]', sec), sachetImg = $('[data-mixer-sachet-img]', sec);
  const chips = $$('.mixer-chip', sec), gramsIn = $('[data-mixer-grams]', sec), gramsOut = $('[data-mixer-grams-out]', sec), nameEl = $('[data-mixer-name]', sec);
  const nums = {}, bars = {}; $$('[data-mixer-n]', sec).forEach((e) => (nums[e.dataset.mixerN] = e)); $$('[data-mixer-bar]', sec).forEach((e) => (bars[e.dataset.mixerBar] = e));
  const MAX = { protein: 30, caffeine: 150, sugar: 4, kcal: 200 }, vals = { protein: 25, caffeine: 90, sugar: 0.8, kcal: 128 };
  const state = { mix: mixes[0], grams: 3 };
  const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const vis = { pour: 0, ribbon: 0, mul: 0, tint: hex(mixes[0].color), t: 0 };
  const GL = { cx: 17, topY: 7.8, botY: 33.4, topHW: 7.2, botHW: 5.5, fill: 11.6 };            // glass geometry in stage units (stage = 34 x 38)
  const REST = { cx: 28.6, cy: 11.5, rot: -10 }, W_S = 3.6;
  let u = 16, visible = false, tl = null, last = performance.now();
  const strength = () => 0.35 + (0.65 * (state.grams - 1)) / 4;

  const size = () => {
    u = stage.clientWidth / 34; stage.style.setProperty('--u', `${u}px`);
    canvas.width = Math.round(stage.clientWidth * DPR); canvas.height = Math.round(stage.clientHeight * DPR);
    const w = sachet.offsetWidth, h = sachetImg.offsetHeight || w * 2.7;
    if (!tl || !tl.isActive()) gsap.set(sachet, { x: REST.cx * u - w / 2, y: REST.cy * u - h / 2, rotation: REST.rot });
  };

  // ----- drawing -----
  const glassPath = (inset = 0) => {
    const { cx, topY, botY, topHW, botHW } = GL, r = 1.6;
    ctx.beginPath(); ctx.moveTo((cx - topHW + inset) * u, (topY + inset * 0.2) * u); ctx.lineTo((cx + topHW - inset) * u, (topY + inset * 0.2) * u);
    ctx.lineTo((cx + botHW - inset) * u, (botY - r) * u); ctx.quadraticCurveTo((cx + botHW - inset) * u, (botY - inset) * u, (cx + botHW - r - inset) * u, (botY - inset) * u);
    ctx.lineTo((cx - botHW + r + inset) * u, (botY - inset) * u); ctx.quadraticCurveTo((cx - botHW + inset) * u, (botY - inset) * u, (cx - botHW + inset) * u, (botY - r) * u); ctx.closePath();
  };
  const rr = (x, y, w, h, r) => { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); };
  const rgba = (c, a) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;

  const draw = () => {
    if (!visible) return;
    const now = performance.now(), dt = Math.min(0.05, (now - last) / 1000); last = now;
    if (!RM) vis.t += dt;
    const t = vis.t, tint = vis.tint, { cx, botY, fill } = GL;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0); ctx.clearRect(0, 0, 34 * u, 38 * u);
    // glass body
    ctx.save(); glassPath(0.3); ctx.clip();
    const g = ctx.createLinearGradient(0, fill * u, 0, botY * u);
    [[0, '#3b2214'], [0.22, '#6b4129'], [0.52, '#b88a60'], [0.8, '#e0c9a6'], [1, '#efe1c8']].forEach(([o, c]) => g.addColorStop(o, c));
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(0, (fill + Math.sin(t * 2) * 0.1) * u);
    for (let x = 0; x <= 34; x += 1) ctx.lineTo(x * u, (fill + Math.sin(x * 0.9 + t * 2) * 0.11) * u);
    ctx.lineTo(34 * u, botY * u); ctx.lineTo(0, botY * u); ctx.closePath(); ctx.fill();
    ctx.globalAlpha = 0.2 * vis.mul; ctx.fillStyle = rgba(tint, 1); ctx.fillRect(0, fill * u, 34 * u, (botY - fill) * u); ctx.globalAlpha = 1;   // the drink takes on the flavour
    ctx.fillStyle = 'rgba(243,228,201,.5)'; ctx.fillRect(0, (fill + 0.05) * u, 34 * u, 0.5 * u);                                                       // crema
    // swirl ribbons: the flavour spreading down through the drink
    if (vis.mul > 0.01 && vis.ribbon > 0.01) {
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      for (let i = 0; i < 5; i++) {
        const len = (botY - fill - 1.5) * vis.ribbon * (0.5 + i * 0.11), n = 26;
        for (let k = 0; k < n; k++) {
          const a = k / n, b = (k + 1) / n, amp = 1.3 + a * 2.6;
          const x1 = cx + (i - 2) * 1.15 + Math.sin(a * 5 + t * 0.9 + i * 1.3) * amp, x2 = cx + (i - 2) * 1.15 + Math.sin(b * 5 + t * 0.9 + i * 1.3) * (1.3 + b * 2.6);
          ctx.strokeStyle = rgba(tint, 0.6 * vis.mul * (1 - a * 0.55)); ctx.lineWidth = (1.35 - a * 1.05) * u * (0.7 + vis.mul * 0.5);
          ctx.beginPath(); ctx.moveTo(x1 * u, (fill + a * len) * u); ctx.lineTo(x2 * u, (fill + b * len) * u); ctx.stroke();
        }
      }
    }
    // ice
    [[14.6, 13.1, 2.6, 0.2], [19.2, 12.5, 2.5, -0.3], [16.7, 16.4, 2.7, 0.1]].forEach(([x, y, s, r], i) => {
      ctx.save(); ctx.translate(x * u, (y + Math.sin(t * 1.1 + i * 2) * 0.18) * u); ctx.rotate(r + Math.sin(t * 0.8 + i) * 0.05);
      rr(-s * 0.5 * u, -s * 0.5 * u, s * u, s * u, 0.55 * u); ctx.fillStyle = 'rgba(255,255,255,.26)'; ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 0.12 * u; ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,.4)'; ctx.fillRect(-s * 0.35 * u, -s * 0.38 * u, s * 0.4 * u, 0.18 * u); ctx.restore();
    });
    ctx.restore();
    // glass shell
    glassPath(0); ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 0.22 * u; ctx.stroke();
    ctx.beginPath(); ctx.ellipse(GL.cx * u, GL.topY * u, GL.topHW * u, 0.6 * u, 0, 0, Math.PI * 2); ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.lineWidth = 0.12 * u; ctx.stroke();
    ctx.beginPath(); ctx.moveTo((GL.cx - GL.topHW + 1.3) * u, (GL.topY + 1.6) * u); ctx.lineTo((GL.cx - GL.topHW + 2.3) * u, (GL.topY + 1.6) * u); ctx.lineTo((GL.cx - GL.botHW + 2) * u, (GL.botY - 3) * u); ctx.lineTo((GL.cx - GL.botHW + 1.1) * u, (GL.botY - 3) * u); ctx.closePath(); ctx.fillStyle = 'rgba(255,255,255,.17)'; ctx.fill();
    // the pour: syrupy stream from the open end of the sachet down to the surface
    if (vis.pour > 0.01) {
      const sx = gsap.getProperty(sachet, 'x'), sy = gsap.getProperty(sachet, 'y'), rot = (gsap.getProperty(sachet, 'rotation') * Math.PI) / 180;
      const w = sachet.offsetWidth, h = sachetImg.offsetHeight || w * 2.7, ox = (sx + w / 2) / u + (Math.sin(rot) * h) / 2 / u, oy = (sy + h / 2) / u - (Math.cos(rot) * h) / 2 / u;
      const ex = GL.cx + 0.6 + Math.sin(t * 6) * 0.15, ey = fill + 0.2;
      ctx.lineCap = 'round'; ctx.strokeStyle = rgba(tint, 0.95); ctx.lineWidth = (0.5 + 0.18 * Math.sin(t * 9)) * u * vis.pour * (0.7 + strength() * 0.5);
      ctx.setLineDash([0.9 * u, 0.35 * u]); ctx.lineDashOffset = -t * 18 * u;
      ctx.beginPath(); ctx.moveTo(ox * u, oy * u); ctx.quadraticCurveTo((ox + 0.5) * u, ((oy + ey) / 2) * u, ex * u, ey * u); ctx.stroke(); ctx.setLineDash([]);
      for (let i = 0; i < 6; i++) { const a = t * 7 + i * 1.7, r = (0.12 + 0.1 * ((i * 7) % 3)) * u; ctx.fillStyle = rgba(tint, 0.7 * vis.pour); ctx.beginPath(); ctx.arc((ex + Math.cos(a) * 0.9) * u, (ey - Math.abs(Math.sin(a * 1.3)) * 0.8) * u, r, 0, 7); ctx.fill(); }
    }
  };
  gsap.ticker.add(draw);
  new IntersectionObserver((e) => e.forEach((x) => (visible = x.isIntersecting)), { rootMargin: '80px' }).observe(stage);

  // ----- numbers -----
  const target = () => { const m = state.mix, k = m.k === 'plain' ? 0 : state.grams; return { protein: 25, caffeine: 90, sugar: +(0.8 + m.sugar * k).toFixed(1), kcal: Math.round(128 + m.kcal * k) }; };
  const render = () => { nums.protein.textContent = Math.round(vals.protein); nums.caffeine.textContent = Math.round(vals.caffeine); nums.sugar.textContent = vals.sugar.toFixed(1); nums.kcal.textContent = Math.round(vals.kcal); for (const k in bars) bars[k].style.width = `${Math.min(100, (vals[k] / MAX[k]) * 100)}%`; };
  const updateNumbers = () => { RM ? (Object.assign(vals, target()), render()) : gsap.to(vals, { ...target(), duration: 0.8, ease: 'power2.out', onUpdate: render, overwrite: true }); };
  const label = () => { nameEl.textContent = state.mix.k === 'plain' ? 'Plain protein iced latte' : `${state.mix.name} iced latte · ${state.grams}g shot`; };
  const fillRange = () => gramsIn.style.setProperty('--fill', `${((state.grams - 1) / 4) * 100}%`);
  render(); fillRange();

  // ----- choosing a flavour -----
  const swap = (img, src) => { if (RM) { img.src = src; return; } gsap.timeline().to(img, { opacity: 0, y: 10, scale: 0.92, duration: 0.18 }).add(() => (img.src = src)).to(img, { opacity: 1, y: 0, scale: 1, duration: 0.8, ease: 'elastic-ease-out' }); };
  const pose = () => { const w = sachet.offsetWidth, h = sachetImg.offsetHeight || w * 2.7; return { w, h, rest: { x: REST.cx * u - w / 2, y: REST.cy * u - h / 2, rotation: REST.rot }, pour: { x: 16.2 * u - w / 2, y: (innerWidth < 992 ? 3.6 : 2.4) * u - h / 2, rotation: 150 } }; };
  const choose = (m) => {
    if (m.k === state.mix.k) return;
    state.mix = m; chips.forEach((c) => { const on = c.dataset.mix === m.k; c.classList.toggle('is-active', on); c.setAttribute('aria-checked', on); });
    gramsIn.disabled = m.k === 'plain'; sec.classList.toggle('is-plain', m.k === 'plain');
    swap(tubImg, IMG(m.tub)); swap(sachetImg, IMG(m.pack)); label(); updateNumbers();
    const P = pose(); tl?.kill();
    if (m.k === 'plain') { gsap.to(vis, { mul: 0, ribbon: 0, pour: 0, duration: 0.9 }); RM ? gsap.set(sachet, P.rest) : gsap.to(sachet, { ...P.rest, duration: 0.7 }); return; }
    const to = hex(m.color); gsap.to(vis.tint, { 0: to[0], 1: to[1], 2: to[2], duration: 0.8, overwrite: true });
    if (RM) { vis.mul = strength(); vis.ribbon = 1; vis.pour = 0; return; }
    tl = gsap.timeline()
      .to(sachet, { ...P.pour, duration: 0.8, ease: 'elastic-ease-out-soft' })
      .to(vis, { pour: 1, mul: strength(), duration: 0.4, ease: 'power2.out' }, '>-.15')
      .to(vis, { ribbon: 1, duration: 2, ease: 'power1.out' }, '<+.05')
      .to(vis, { pour: 0, duration: 0.45 }, '>-.6')
      .to(sachet, { ...P.rest, duration: 0.8 }, '>-.1');
  };
  chips.forEach((c, i) => {
    c.addEventListener('click', () => choose(mixes.find((m) => m.k === c.dataset.mix)));
    c.addEventListener('keydown', (e) => {                                   // radiogroup: arrows move the choice
      const d = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0; if (!d) return;
      e.preventDefault(); const n = chips[(i + d + chips.length) % chips.length]; n.focus(); n.click();
    });
  });
  gramsIn.addEventListener('input', () => {
    state.grams = +gramsIn.value; gramsOut.textContent = `${state.grams}g`; fillRange(); label(); updateNumbers();
    if (state.mix.k !== 'plain') RM ? (vis.mul = strength()) : gsap.to(vis, { mul: strength(), duration: 0.5 });
  });
  gramsIn.disabled = true; sec.classList.add('is-plain');
  size(); onResize(size); if (sachetImg.complete) size(); else sachetImg.addEventListener('load', size, { once: true });
}

// ---- boot -----------------------------------------------------------------------
addEventListener('load', async () => {
  initLenis();
  await document.fonts.ready;
  root.classList.add('fonts-loaded');
  initInertia();
  sequence(); marquee(); smileys(); fillLine(); benefitTable(); energy(); mixer(); rings(); payment(); parallax(); reviewsSlider(); flavours(); highlightText();
  await hero();
  ScrollTrigger.refresh();
  // rebuild the right timelines if the breakpoint, orientation or motion preference changes
  ['(prefers-reduced-motion)', '(min-width: 992px)', '(orientation: portrait)'].forEach((q) => matchMedia(q).addEventListener('change', () => location.reload()));
});
