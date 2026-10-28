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
      .to(facts, { opacity: 1, y: 0, x: 0, rotate: 0, scale: 1, ease: 'elastic-ease-out', duration: 0.8, stagger: -0.048 }, '<-=.015');
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
    const path = $('path', el);
    desktop(() => gsap.timeline({ scrollTrigger: { trigger: el, start: 'top 70%', once: true } }).fromTo(path, { drawSVG: '0% 0%' }, { drawSVG: '100% 0%', ease: 'none', duration: 0.75 }));
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

// ---- boot -----------------------------------------------------------------------
addEventListener('load', async () => {
  initLenis();
  await document.fonts.ready;
  root.classList.add('fonts-loaded');
  initInertia();
  sequence(); marquee(); smileys(); fillLine(); benefitTable(); payment(); parallax(); reviewsSlider(); flavours(); highlightText();
  await hero();
  ScrollTrigger.refresh();
  // rebuild the right timelines if the breakpoint, orientation or motion preference changes
  ['(prefers-reduced-motion)', '(min-width: 992px)', '(orientation: portrait)'].forEach((q) => matchMedia(q).addEventListener('change', () => location.reload()));
});
