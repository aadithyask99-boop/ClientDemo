import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { site } from '../data/site';
import { pookalam, boat, kingfisher, shower } from './eggs';

gsap.registerPlugin(ScrollTrigger);

const $ = <T extends HTMLElement = HTMLElement>(s: string, r: ParentNode = document) => r.querySelector(s) as T;
const $$ = <T extends HTMLElement = HTMLElement>(s: string, r: ParentNode = document) => Array.from(r.querySelectorAll(s)) as T[];
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const root = document.documentElement;
const pinned = root.classList.contains('pin');
const hero = root.dataset.hero || '1';
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

addEventListener('hashchange', () => location.reload());

/* ---------- smooth scroll ---------- */
let lenis: Lenis | null = null;
if (!reduced) {
  lenis = new Lenis({ lerp: 0.1, wheelMultiplier: 0.95 });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis!.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
}
const scrollToY = (y: number) => (lenis ? lenis.scrollTo(y, { duration: 1.4 }) : scrollTo({ top: y }));

/* ---------- header: tone follows what is under it, hides on scroll down, mega menu ---------- */
const topEl = $('#top');
const toneAt = (x: number, y: number) => {
  const el = document.elementsFromPoint(x, y).find((e) => !e.closest('.top, .egg-layer, .review'));
  const t = el?.closest('[data-tone]') as HTMLElement | null;
  return t?.dataset.tone === 'light' ? 'light' : 'dark';
};
let lastY = 0, tick = 0;
gsap.ticker.add(() => {
  const y = scrollY;
  if (++tick % 5 === 0) topEl.dataset.on = toneAt(innerWidth / 2, 40);
  if (Math.abs(y - lastY) > 4) { topEl.classList.toggle('hide', y > lastY && y > 300); lastY = y; }
  topEl.classList.toggle('solid', y > innerHeight * 0.8);
});
topEl.dataset.on = 'dark';
const mega = $('#mega');
const trig = $('.has-mega');
let megaT = 0;
const megaOpen = (v: boolean) => { clearTimeout(megaT); megaT = window.setTimeout(() => mega.classList.toggle('open', v), v ? 0 : 160); };
trig?.addEventListener('mouseenter', () => megaOpen(true));
topEl.addEventListener('mouseleave', () => megaOpen(false));
mega.addEventListener('mouseenter', () => megaOpen(true));

/* ---------- text reveal: split into words, rise and clear ---------- */
function splitWords(el: HTMLElement) {
  const nodes = Array.from(el.childNodes);
  el.textContent = '';
  const words: HTMLElement[] = [];
  nodes.forEach((n) => {
    const italic = n.nodeType === 1 && (n as HTMLElement).tagName === 'I';
    const txt = (n.textContent || '').trim();
    txt.split(/\s+/).filter(Boolean).forEach((w) => {
      const wrap = document.createElement('span');
      wrap.style.cssText = 'display:inline-block;overflow:hidden;vertical-align:top;padding-bottom:.1em;margin-bottom:-.1em';
      const inner = document.createElement(italic ? 'i' : 'span');
      inner.style.display = 'inline-block';
      inner.textContent = w;
      wrap.appendChild(inner);
      el.appendChild(wrap);
      el.appendChild(document.createTextNode(' '));
      words.push(inner);
    });
  });
  return words;
}
if (!reduced) {
  $$('[data-split]').forEach((el) => {
    const words = splitWords(el);
    gsap.set(words, { yPercent: 115, opacity: 0 });
    gsap.to(words, { yPercent: 0, opacity: 1, duration: 1.1, ease: 'power3.out', stagger: 0.035, scrollTrigger: { trigger: el, start: 'top 85%' } });
  });
  $$('[data-fade]').forEach((el) => {
    gsap.from(el, { opacity: 0, y: 30, filter: 'blur(8px)', duration: 1.3, ease: 'power2.out', scrollTrigger: { trigger: el, start: 'top 88%' } });
  });
}

/* ---------- weather over photographs: soft rain, mist, dust. Draws only while on screen ---------- */
type Kind = 'rain' | 'mist' | 'dust';
function weather(canvas: HTMLCanvasElement, kind: () => Kind, visible: () => boolean) {
  if (reduced) { canvas.style.display = 'none'; return; }
  const ctx = canvas.getContext('2d')!;
  const dpr = Math.min(devicePixelRatio || 1, 1.5);
  let w = 0, h = 0;
  const size = () => { w = canvas.clientWidth; h = canvas.clientHeight; canvas.width = w * dpr; canvas.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); };
  size(); addEventListener('resize', size);
  const sprite = document.createElement('canvas'); sprite.width = sprite.height = 256;
  const sc = sprite.getContext('2d')!; const g = sc.createRadialGradient(128, 128, 0, 128, 128, 128);
  g.addColorStop(0, 'rgba(255,255,255,.5)'); g.addColorStop(1, 'rgba(255,255,255,0)'); sc.fillStyle = g; sc.fillRect(0, 0, 256, 256);
  const drops = Array.from({ length: 150 }, () => ({ x: Math.random(), y: Math.random(), l: 0.5 + Math.random(), v: 0.8 + Math.random() * 0.8 }));
  const puffs = Array.from({ length: 9 }, (_, i) => ({ x: Math.random(), y: 0.15 + Math.random() * 0.75, s: 0.5 + Math.random() * 0.6, v: 0.01 + Math.random() * 0.02, a: 0.18 + Math.random() * 0.2, i }));
  const motes = Array.from({ length: 50 }, () => ({ x: Math.random(), y: Math.random(), r: 1 + Math.random() * 2.4, v: 0.004 + Math.random() * 0.01, p: Math.random() * 6 }));
  let last = performance.now();
  gsap.ticker.add(() => {
    if (!visible()) return;
    const now = performance.now(), dt = Math.min(0.05, (now - last) / 1000); last = now;
    ctx.clearRect(0, 0, w, h);
    const k = kind();
    if (k === 'rain') {
      ctx.strokeStyle = 'rgba(235,245,240,.34)'; ctx.lineWidth = 1.1; ctx.beginPath();
      for (const d of drops) {
        d.y += dt * d.v * 1.4; d.x -= dt * 0.05; if (d.y > 1.05) { d.y = -0.1; d.x = Math.random() * 1.1; }
        const x = d.x * w, y = d.y * h; ctx.moveTo(x, y); ctx.lineTo(x - 5 * d.l, y + 26 * d.l);
      }
      ctx.stroke();
    } else if (k === 'mist') {
      for (const p of puffs) {
        p.x += dt * p.v; if (p.x > 1.4) p.x = -0.4;
        const s = Math.max(w, h) * p.s; ctx.globalAlpha = p.a; ctx.drawImage(sprite, p.x * w - s / 2, p.y * h - s / 2, s, s);
      }
      ctx.globalAlpha = 1;
    } else {
      ctx.fillStyle = 'rgba(255,255,255,.55)';
      for (const m of motes) {
        m.y -= dt * m.v; m.p += dt; if (m.y < -0.05) { m.y = 1.05; m.x = Math.random(); }
        ctx.globalAlpha = 0.25 + 0.3 * Math.sin(m.p * 1.6) ** 2; ctx.beginPath(); ctx.arc((m.x + Math.sin(m.p * 0.5) * 0.01) * w, m.y * h, m.r, 0, 6.3); ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
  });
}
const onScreen = (el: HTMLElement) => { let v = true; new IntersectionObserver((e) => (v = e[0].isIntersecting), { threshold: 0 }).observe(el); return () => v; };

/* ---------- HERO ---------- */
const heroEl = $('#hero');
const heroVisible = onScreen(heroEl);
if (!reduced) {
  gsap.set('.line-in', { yPercent: 112 });
  gsap.set('.hero-sub', { opacity: 0, y: 16 });
  gsap.to('.line-in', { yPercent: 0, duration: 1.6, ease: 'power3.out', stagger: 0.16, delay: 0.3 });
  gsap.to('.hero-sub', { opacity: 1, y: 0, duration: 1.2, ease: 'power2.out', delay: 1.1 });
}

// shared cursor parallax for foliage layers
const fol = $$('.f, .L').filter((e) => e.offsetParent !== null || true);
const mouse = { x: 0, y: 0, sx: 0, sy: 0 };
addEventListener('pointermove', (e) => { mouse.x = e.clientX / innerWidth - 0.5; mouse.y = e.clientY / innerHeight - 0.5; });
const depthOf = (e: HTMLElement) => parseFloat(e.dataset.depth || e.dataset.z || '1');
const scrollDrive = { p: 0 };
if (!reduced) {
  gsap.ticker.add(() => {
    mouse.sx += (mouse.x - mouse.sx) * 0.06; mouse.sy += (mouse.y - mouse.sy) * 0.06;
    if (!heroVisible()) return;
    const sel = hero === '1' ? '.fol .f' : hero === '3' ? '.layers .L' : '';
    if (!sel) return;
    $$(sel).forEach((e) => {
      const d = depthOf(e);
      if (hero === '1') gsap.set(e, { x: -mouse.sx * 46 * d, y: -mouse.sy * 28 * d + scrollY * 0.12 * d, rotation: mouse.sx * 2.2 * d });
      else { const s = 1 + scrollDrive.p * d * 1.5; gsap.set(e, { x: -mouse.sx * 34 * d, y: -mouse.sy * 20 * d, scale: s, opacity: clamp(1.4 - scrollDrive.p * (0.6 + d * 0.5), 0, 1) }); }
    });
  });
}

if (hero === '1') {
  const seasons = $$<HTMLImageElement>('.season');
  const tag = $('#season-tag');
  let si = 0;
  const kindNow = () => site.hero.seasons[si].weather as Kind;
  weather($('#weather') as HTMLCanvasElement, kindNow, heroVisible);
  if (!reduced) {
    setInterval(() => {
      if (!heroVisible()) return;
      seasons[si].classList.remove('on');
      si = (si + 1) % seasons.length;
      seasons[si].classList.add('on');
      gsap.fromTo(tag, { opacity: 0, y: 8 }, { opacity: 0.9, y: 0, duration: 1.2, onStart: () => (tag.textContent = site.hero.seasons[si].label) });
    }, 6800);
    gsap.to('.s1 .season', { yPercent: 8, ease: 'none', scrollTrigger: { trigger: heroEl, start: 'top top', end: 'bottom top', scrub: true } });
  }
}

if (hero === '2') initGlass();
function initGlass() {
  const c = $('#glass') as HTMLCanvasElement;
  const sharp = $('.glass-sharp') as HTMLImageElement;
  if (reduced) { c.style.display = 'none'; return; }
  const ctx = c.getContext('2d')!;
  const mask = document.createElement('canvas'); const mctx = mask.getContext('2d')!;
  const blur = document.createElement('canvas'); const bctx = blur.getContext('2d')!;
  const brush = document.createElement('canvas'); brush.width = brush.height = 128;
  const bg = brush.getContext('2d')!; const gr = bg.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(0.55, 'rgba(0,0,0,.9)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); bg.fillStyle = gr; bg.fillRect(0, 0, 128, 128);
  let w = 0, h = 0;
  const build = () => {
    const dpr = Math.min(devicePixelRatio || 1, 1.5);
    w = c.clientWidth; h = c.clientHeight;
    c.width = mask.width = blur.width = Math.round(w * dpr); c.height = mask.height = blur.height = Math.round(h * dpr);
    const iw = sharp.naturalWidth || 1600, ih = sharp.naturalHeight || 900;
    const sc = Math.max(c.width / iw, c.height / ih), dw = iw * sc, dh = ih * sc;
    // blur by shrinking and enlarging, works in every browser
    const tiny = document.createElement('canvas'); tiny.width = Math.max(8, Math.round(c.width / 28)); tiny.height = Math.max(8, Math.round(c.height / 28));
    tiny.getContext('2d')!.drawImage(sharp, (tiny.width - dw / 28) / 2, (tiny.height - dh / 28) / 2, dw / 28, dh / 28);
    bctx.imageSmoothingQuality = 'high'; bctx.drawImage(tiny, 0, 0, c.width, c.height);
    bctx.fillStyle = 'rgba(214,226,220,.22)'; bctx.fillRect(0, 0, c.width, c.height);
  };
  if (sharp.complete) build(); else sharp.addEventListener('load', build);
  addEventListener('resize', build);
  type S = { x: number; y: number; r: number; t: number; life: number };
  const stamps: S[] = [];
  const add = (x: number, y: number, r: number, life = 5200) => { stamps.push({ x, y, r, t: performance.now(), life }); if (stamps.length > 420) stamps.shift(); };
  let lp: { x: number; y: number } | null = null;
  c.addEventListener('pointermove', (e) => {
    const b = c.getBoundingClientRect(); const x = e.clientX - b.left, y = e.clientY - b.top;
    if (lp) { const n = Math.ceil(Math.hypot(x - lp.x, y - lp.y) / 14); for (let i = 1; i <= n; i++) add(lp.x + ((x - lp.x) * i) / n, lp.y + ((y - lp.y) * i) / n, 115, 7000); } else add(x, y, 115, 7000);
    lp = { x, y };
  });
  c.addEventListener('pointerleave', () => (lp = null));
  // rain runs down the glass and leaves thin clear trails
  const runs: { x: number; y: number; v: number }[] = [];
  setInterval(() => { if (document.hidden || runs.length > 9) return; runs.push({ x: Math.random() * w, y: -10, v: 70 + Math.random() * 110 }); }, 700);
  // opening: wipe a window in the middle so the first view shows the place
  setTimeout(() => { for (let i = 0; i < 26; i++) add(w * 0.35 + i * (w * 0.012), h * 0.52 + Math.sin(i / 3) * 40, 150, 6500); }, 900);
  let last = performance.now();
  gsap.ticker.add(() => {
    if (!heroVisible() || !blur.width) return;
    const now = performance.now(), dt = Math.min(0.05, (now - last) / 1000); last = now;
    for (const r of runs) { r.y += r.v * dt; r.x += Math.sin(r.y / 40) * 0.4; add(r.x, r.y, 17, 3600); }
    for (let i = runs.length - 1; i >= 0; i--) if (runs[i].y > h + 20) runs.splice(i, 1);
    const k = c.width / w;
    mctx.clearRect(0, 0, mask.width, mask.height);
    for (let i = stamps.length - 1; i >= 0; i--) {
      const s = stamps[i], age = now - s.t; if (age > s.life) { stamps.splice(i, 1); continue; }
      mctx.globalAlpha = (1 - age / s.life) ** 1.4; const d = s.r * 2 * k;
      mctx.drawImage(brush, s.x * k - d / 2, s.y * k - d / 2, d, d);
    }
    mctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over'; ctx.clearRect(0, 0, c.width, c.height); ctx.drawImage(blur, 0, 0);
    ctx.globalCompositeOperation = 'destination-out'; ctx.drawImage(mask, 0, 0); ctx.globalCompositeOperation = 'source-over';
  });
}

if (hero === '3' && pinned && !reduced) {
  ScrollTrigger.create({
    trigger: heroEl, start: 'top top', end: '+=120%', pin: true, scrub: true,
    onUpdate: (self) => { scrollDrive.p = self.progress; },
  });
  gsap.to('.leaf-photo', { scale: 1.3, ease: 'none', scrollTrigger: { trigger: heroEl, start: 'top top', end: '+=120%', scrub: true } });
  gsap.to('.hero-copy', { opacity: 0, y: -50, ease: 'none', scrollTrigger: { trigger: heroEl, start: '10% top', end: '+=60%', scrub: true } });
}

/* ---------- STATEMENT ---------- */
if (!reduced) {
  gsap.fromTo('.st-a', { yPercent: 8 }, { yPercent: -8, ease: 'none', scrollTrigger: { trigger: '#statement', start: 'top bottom', end: 'bottom top', scrub: true } });
  gsap.fromTo('.st-b', { yPercent: 14 }, { yPercent: -12, ease: 'none', scrollTrigger: { trigger: '#statement', start: 'top bottom', end: 'bottom top', scrub: true } });
  gsap.from('.st-photos img', { opacity: 0, scale: 0.94, duration: 1.4, ease: 'power3.out', stagger: 0.18, scrollTrigger: { trigger: '.st-photos', start: 'top 80%' } });
}

/* ---------- FAN (pinned) ---------- */
const places = $$('.place');
if (pinned && !reduced) {
  const n = places.length, bgs = $$('.fan-bg img'), names = $$('.fan-names span'), tabs = $$('.fan-tabs button'), sub = $('#fan-sub');
  const dist = () => innerHeight * 0.6 * (n - 1);
  const st = ScrollTrigger.create({ trigger: '.fan-pin', start: 'top top', end: () => `+=${dist()}`, pin: true, scrub: true, invalidateOnRefresh: true });
  let cur = 0, act = -1;
  const layout = (p: number) => {
    const vw = innerWidth;
    places.forEach((el, i) => {
      const d = i - p, a = Math.abs(d);
      gsap.set(el, { xPercent: -50, yPercent: -50, x: d * vw * 0.085, y: a * 14, rotation: d * 7, scale: 1 - Math.min(a, 3) * 0.075, opacity: clamp(1.5 - a * 0.42, 0, 1), zIndex: 50 - Math.round(a * 10), rotationY: d * -4 });
    });
    const k = clamp(Math.round(p), 0, n - 1);
    if (k !== act) {
      act = k;
      bgs.forEach((b, i) => b.classList.toggle('on', i === k));
      tabs.forEach((b, i) => b.classList.toggle('on', i === k));
      names.forEach((s, i) => gsap.to(s, { opacity: i === k ? 1 : 0, yPercent: i === k ? -50 : i < k ? -140 : 40, duration: 0.7, ease: 'power3.out', overwrite: true }));
      gsap.fromTo(sub, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.9, onStart: () => (sub.textContent = `${site.places[k].line} ${site.places[k].months}.`) });
    }
  };
  names.forEach((s, i) => gsap.set(s, { yPercent: i === 0 ? -50 : 40, opacity: i === 0 ? 1 : 0 }));
  gsap.ticker.add(() => { const t = st.progress * (n - 1); cur += (t - cur) * 0.12; layout(cur); });
  tabs.forEach((b, i) => b.addEventListener('click', () => scrollToY(st.start + (st.end - st.start) * (i / (n - 1)))));
} else if (!reduced) {
  gsap.from('.place', { opacity: 0, y: 50, duration: 1.2, ease: 'power3.out', stagger: 0.12, scrollTrigger: { trigger: '.fan-cards', start: 'top 80%' } });
}

/* ---------- MONTHS (pinned, one month at a time) ---------- */
const seasonsEl = $$('.m-season');
if (pinned && !reduced) {
  const monthsEls = $$('.m-month'), idx = $$('.m-index li');
  const steps = monthsEls.length;
  const stM = ScrollTrigger.create({ trigger: '.m-pin', start: 'top top', end: () => `+=${innerHeight * 0.48 * steps}`, pin: true, scrub: true, invalidateOnRefresh: true });
  let cs = -1, cm = -1;
  const kindFor = (si: number): Kind => site.seasons[si].weather as Kind;
  let kindNow: Kind = 'rain';
  weather($('#m-weather') as HTMLCanvasElement, () => kindNow, onScreen($('.m-pin')));
  gsap.set(monthsEls.filter((m) => !m.classList.contains('on')), { opacity: 0, yPercent: 24 });
  gsap.ticker.add(() => {
    const m = clamp(Math.floor(stM.progress * steps), 0, steps - 1), s = Math.floor(m / 2);
    if (m === cm) return;
    cm = m;
    if (s !== cs) {
      const prev = cs; cs = s; kindNow = kindFor(s);
      seasonsEl.forEach((el, i) => { if (i === s) { el.classList.add('on'); gsap.fromTo(el, { opacity: 0 }, { opacity: 1, duration: 1.1, ease: 'power2.out' }); gsap.fromTo($('.m-photo', el), { scale: 1.12 }, { scale: 1.02, duration: 3.2, ease: 'power2.out' }); } else if (i === prev) gsap.to(el, { opacity: 0, duration: 1.1, onComplete: () => el.classList.remove('on') }); else el.classList.remove('on'); });
    }
    monthsEls.forEach((el, i) => {
      if (i === m) { el.classList.add('on'); gsap.fromTo(el, { opacity: 0, yPercent: 24 }, { opacity: 1, yPercent: 0, duration: 1, ease: 'power3.out', overwrite: true }); }
      else if (el.classList.contains('on')) { gsap.to(el, { opacity: 0, yPercent: -18, duration: 0.55, ease: 'power2.in', overwrite: true, onComplete: () => el.classList.remove('on') }); }
    });
    idx.forEach((li, i) => li.classList.toggle('on', i === m));
  });
  idx.forEach((li, i) => li.addEventListener('click', () => scrollToY(stM.start + ((stM.end - stM.start) * (i + 0.5)) / steps)));
  idx[0].classList.add('on');
  // egg: hold on the monsoon photograph for two seconds
  let hold = 0;
  const mp = $('.m-pin');
  mp.addEventListener('pointerdown', () => { if (cs === 0) hold = window.setTimeout(() => shower(mp), 2000); });
  ['pointerup', 'pointerleave', 'pointercancel'].forEach((t) => mp.addEventListener(t, () => clearTimeout(hold)));
} else if (!reduced) {
  seasonsEl.forEach((el) => gsap.fromTo($('.m-photo', el), { scale: 1.12 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true } }));
  const mp = $('.m-pin'); let hold = 0;
  seasonsEl[0].addEventListener('pointerdown', () => (hold = window.setTimeout(() => shower(seasonsEl[0]), 2000)));
  ['pointerup', 'pointerleave', 'pointercancel'].forEach((t) => seasonsEl[0].addEventListener(t, () => clearTimeout(hold)));
  void mp;
}

/* ---------- HEART (pinned, headline slides sideways) ---------- */
if (pinned && !reduced) {
  const title = $('#heart-title');
  const tl = gsap.timeline({ scrollTrigger: { trigger: '.heart-pin', start: 'top top', end: () => `+=${innerHeight * 1.8}`, pin: true, scrub: 0.6, invalidateOnRefresh: true } });
  tl.fromTo(title, { x: () => innerWidth * 0.04 }, { x: () => -(title.scrollWidth - innerWidth * 0.82), ease: 'none', duration: 1 }, 0);
  const speeds = [-40, -75, -30, -95, -55, -80];
  $$('.d').forEach((d, i) => tl.fromTo(d, { y: 120 + i * 20, rotation: i % 2 ? 3 : -3 }, { y: () => speeds[i] * 5, rotation: 0, ease: 'none', duration: 1 }, 0));
  tl.fromTo('.tree.tl', { x: -80 }, { x: 60, ease: 'none', duration: 1 }, 0);
  tl.fromTo('.tree.tr', { x: 80 }, { x: -60, ease: 'none', duration: 1 }, 0);
  tl.fromTo('.fern', { y: 80 }, { y: -30, ease: 'none', duration: 1 }, 0);
  tl.fromTo('.heart-text', { opacity: 0, y: 60 }, { opacity: 1, y: 0, ease: 'power2.out', duration: 0.3 }, 0.55);
}

/* ---------- WATER (frame grows to full bleed) ---------- */
if (pinned && !reduced) {
  weather($('#mist') as HTMLCanvasElement, () => 'mist', onScreen($('.water-pin')));
  const tl = gsap.timeline({ scrollTrigger: { trigger: '.water-pin', start: 'top top', end: () => `+=${innerHeight * 1.2}`, pin: true, scrub: 0.6, invalidateOnRefresh: true } });
  tl.fromTo('.water-frame', { clipPath: 'inset(15vh 14vw 15vh 14vw)' }, { clipPath: 'inset(0vh 0vw 0vh 0vw)', ease: 'none', duration: 0.6 }, 0);
  tl.fromTo('.water-frame img', { scale: 1.2 }, { scale: 1, ease: 'none', duration: 1 }, 0);
  tl.fromTo('.water-copy h2', { opacity: 0, y: 70 }, { opacity: 1, y: 0, ease: 'power2.out', duration: 0.35 }, 0.4);
  tl.fromTo('.water-copy p', { opacity: 0, y: 30 }, { opacity: 1, y: 0, ease: 'power2.out', duration: 0.3 }, 0.6);
} else if (!reduced) {
  gsap.from('.water-frame img', { scale: 1.15, ease: 'none', scrollTrigger: { trigger: '.water-frame', start: 'top bottom', end: 'bottom top', scrub: true } });
}

/* ---------- STORIES, TRIPS, STAYS ---------- */
if (!reduced) {
  $$('.story').forEach((f, i) => {
    gsap.from(f, { opacity: 0, y: 90, duration: 1.4, ease: 'power3.out', scrollTrigger: { trigger: f, start: 'top 90%' } });
    gsap.fromTo($('img', f), { yPercent: -6, scale: 1.12 }, { yPercent: 6, scale: 1.12, ease: 'none', scrollTrigger: { trigger: f, start: 'top bottom', end: 'bottom top', scrub: true } });
    void i;
  });
  gsap.from('.tile', { opacity: 0, y: 70, duration: 1.2, ease: 'power3.out', stagger: 0.1, scrollTrigger: { trigger: '.mosaic', start: 'top 82%' } });
  gsap.fromTo('.away img', { yPercent: -6, scale: 1.14 }, { yPercent: 6, scale: 1.14, ease: 'none', scrollTrigger: { trigger: '.away', start: 'top bottom', end: 'bottom top', scrub: true } });
  gsap.from('.away-copy', { opacity: 0, y: 40, duration: 1.2, ease: 'power3.out', scrollTrigger: { trigger: '.away', start: 'top 70%' } });
  gsap.fromTo('.cta-sea', { scale: 1.2 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: '#cta', start: 'top bottom', end: 'bottom top', scrub: true } });
  gsap.from('.cta-copy p, .cta-copy .btn', { opacity: 0, y: 30, duration: 1, stagger: 0.12, scrollTrigger: { trigger: '.cta-copy', start: 'top 75%' } });
}
// centred carousel: the nearest slide to the middle grows
const car = $('#car'); const slides = $$('.slide');
if (car) {
  const upd = () => {
    const cx = car.getBoundingClientRect().left + car.clientWidth / 2;
    slides.forEach((s) => { const r = s.getBoundingClientRect(); const d = Math.min(1, Math.abs(r.left + r.width / 2 - cx) / (r.width * 1.1)); s.style.setProperty('--s', String(1 - d * 0.2)); s.style.setProperty('--o', String(1 - d * 0.35)); });
  };
  car.addEventListener('scroll', upd, { passive: true }); addEventListener('resize', upd);
  requestAnimationFrame(() => { car.scrollLeft = (car.scrollWidth - car.clientWidth) / 2; upd(); });
  // drag to scroll with a mouse
  let down = false, sx = 0, sl = 0;
  car.addEventListener('pointerdown', (e) => { if (e.pointerType !== 'mouse') return; down = true; sx = e.clientX; sl = car.scrollLeft; car.style.scrollSnapType = 'none'; });
  addEventListener('pointerup', () => { if (!down) return; down = false; car.style.scrollSnapType = ''; });
  addEventListener('pointermove', (e) => { if (down) car.scrollLeft = sl - (e.clientX - sx); });
}

/* ---------- FOOTER word, and easter eggs ---------- */
const word = $('#bigword');
{
  const t = word.textContent || '';
  word.textContent = '';
  const chars = [...t].map((c) => { const s = document.createElement('span'); s.className = 'ch'; s.textContent = c; word.appendChild(s); return s; });
  if (!reduced) {
    gsap.set(chars, { yPercent: 110 });
    gsap.to(chars, { yPercent: 0, duration: 1.4, ease: 'power3.out', stagger: 0.07, scrollTrigger: { trigger: word, start: 'top 92%' } });
  }
}
word.addEventListener('click', () => boat(word));

let typed = '';
addEventListener('keydown', (e) => {
  if ((e.target as HTMLElement)?.tagName === 'INPUT') return;
  typed = (typed + e.key.toLowerCase()).slice(-4);
  if (typed === 'onam') pookalam(innerWidth / 2, innerHeight / 2);
});
{ // touch: long-press the hero headline
  let t = 0; const h = $('#hero-title');
  h.addEventListener('pointerdown', (e) => (t = window.setTimeout(() => pookalam(e.clientX, e.clientY), 700)));
  ['pointerup', 'pointerleave', 'pointercancel'].forEach((ev) => h.addEventListener(ev, () => clearTimeout(t)));
}
{ // idle for 20 s: a kingfisher lands
  let idle = 0; const arm = () => { clearTimeout(idle); idle = window.setTimeout(kingfisher, 20000); };
  ['pointermove', 'keydown', 'scroll', 'pointerdown'].forEach((e) => addEventListener(e, arm, { passive: true })); arm();
}

addEventListener('load', () => ScrollTrigger.refresh());
