// @ts-nocheck
// Scroll and pointer motion for the long sections: weather, pinned knit, lookbook, lodge log, footer figures.
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const fine = !matchMedia('(pointer: coarse)').matches && !reduce;

/* ---------- text helpers ---------- */
// words > chars; each char has an outer .wc (pointer wind) and an inner .ch (scroll timeline)
function splitChars(el, sel) {
  const chars = [], wcs = [];
  $$(sel, el).forEach((line) => {
    const txt = line.textContent; line.textContent = '';
    txt.split(' ').forEach((word, wi, arr) => {
      const w = document.createElement('span'); w.className = 'wd';
      [...word].forEach((c) => {
        const o = document.createElement('span'); o.className = 'wc';
        const i = document.createElement('span'); i.className = 'ch'; i.textContent = c;
        o.append(i); w.append(o); chars.push(i); wcs.push(o);
      });
      line.append(w);
      if (wi < arr.length - 1) line.append(document.createTextNode(' '));
    });
  });
  return { chars, wcs };
}
function splitWords(el) {
  const words = [];
  $$('.line', el).forEach((line) => {
    const txt = line.textContent; line.textContent = '';
    txt.split(' ').forEach((w, i, a) => { const s = document.createElement('span'); s.className = 'w'; s.textContent = w + (i < a.length - 1 ? ' ' : ''); words.push(s); line.append(s); });
  });
  return words;
}

/* ---------- weather: ice shards ---------- */
function buildShards() {
  const svg = $('#wShards'); if (!svg || svg.children.length) return;
  const rnd = (a, b) => a + Math.random() * (b - a);
  // base x, base y, angle (deg, -90 is straight up), length, width
  const defs = [
    [210, 600, -118, 400, 40], [300, 600, -108, 470, 50], [120, 600, -126, 330, 34], [380, 600, -98, 360, 36],
    [50, 600, -132, 250, 26], [470, 600, -86, 300, 30],
  ];
  defs.forEach(([x, y, a, len, w]) => {
    const ang = (a * Math.PI) / 180, dx = Math.cos(ang), dy = Math.sin(ang), nx = -dy, ny = dx, bend = len * 0.16 * (a < -90 ? -1 : 1);
    const n = 9, L = [], R = [];
    for (let i = 0; i <= n; i++) {
      const t = i / n, wd = w * Math.pow(1 - t, 0.85) * (1 + rnd(-0.18, 0.18)), off = bend * Math.sin(t * Math.PI * 0.9);
      const cx = x + dx * len * t + nx * off, cy = y + dy * len * t * 1 + ny * off;
      L.push([cx + nx * wd / 2, cy + ny * wd / 2]); R.push([cx - nx * wd / 2, cy - ny * wd / 2]);
    }
    const pts = [...L, ...R.reverse()].map((p) => p.map((v) => v.toFixed(1)).join(',')).join(' ');
    const p = document.createElementNS('http://www.w3.org/2000/svg', 'polygon'); p.setAttribute('points', pts); svg.append(p);
  });
}

/* ---------- weather ---------- */
function initWeather(desktop) {
  const pin = $('#weatherPin');
  buildShards();
  const A = state.A, B = state.B;
  if (!desktop) {
    gsap.set([A.chars, B.chars], { opacity: 1, y: 0 });
    gsap.set('#wFrame', { clipPath: 'inset(0% 0% 0% 0% round 0px)' });
    return;
  }
  gsap.set(A.chars, { opacity: 0, y: 36 });
  gsap.set(B.chars, { opacity: 0, y: -30 });
  gsap.set('#wPeak', { yPercent: 28, opacity: 0.15 });
  gsap.set('#wShards polygon', { transformOrigin: '50% 100%', scaleY: 0 });
  gsap.set('.w-note', { opacity: 0, y: 24 });
  gsap.set('#wFrame', { clipPath: 'inset(100% 8vw 0% 8vw round 22px)' });
  gsap.set('#wFrame img', { scale: 1.22 });
  const tl = gsap.timeline({ scrollTrigger: { trigger: pin, start: 'top top', end: '+=460%', pin: true, scrub: 0.7, anticipatePin: 1 } });
  tl.to('#wPeak', { yPercent: 0, opacity: 1, duration: 0.16, ease: 'power2.out' }, 0)
    .to('#wShards polygon', { scaleY: 1, duration: 0.14, stagger: 0.012, ease: 'power3.out' }, 0.04)
    .to('.w-note', { opacity: 1, y: 0, duration: 0.08, stagger: 0.03 }, 0.1)
    .to(A.chars, { opacity: 1, y: 0, duration: 0.1, stagger: { each: 0.004, from: 'random' }, ease: 'power2.out' }, 0.12)
    .to('#wPeak', { yPercent: -6, duration: 0.3, ease: 'none' }, 0.18)
    .to(A.chars, { opacity: 0, y: -70, duration: 0.1, stagger: { each: 0.003, from: 'random' }, ease: 'power2.in' }, 0.46)
    .to('.w-note', { opacity: 0, duration: 0.06 }, 0.46)
    .to('#wShards', { opacity: 0, y: -40, duration: 0.12 }, 0.5)
    .to('#wPeak', { opacity: 0.2, yPercent: -16, duration: 0.3, ease: 'none' }, 0.5)
    .to(B.chars, { opacity: 1, y: 0, duration: 0.1, stagger: { each: 0.005, from: 'random' }, ease: 'power2.out' }, 0.52)
    .to('#wFrame', { clipPath: 'inset(30% 8vw 0% 8vw round 22px)', duration: 0.12, ease: 'power2.out' }, 0.54)
    .to('#wFrame', { clipPath: 'inset(0% 0% 0% 0% round 0px)', duration: 0.26, ease: 'power2.inOut' }, 0.68)
    .to('#wFrame img', { scale: 1, duration: 0.42, ease: 'none' }, 0.54)
    .to({}, { duration: 0.06 }, 0.94);

  if (fine) {
    // the weather answers the cursor: shards sway and letters are blown aside
    const sx = gsap.quickTo('#wShards', 'x', { duration: 1.2, ease: 'power3' });
    const px = gsap.quickTo('#wPeak', 'x', { duration: 1.4, ease: 'power3' });
    const wcs = [...A.wcs, ...B.wcs];
    let mx = -9999, my = -9999, active = false, busy = false;
    pin.addEventListener('pointermove', (e) => { mx = e.clientX; my = e.clientY; active = true; const r = (e.clientX / innerWidth - 0.5) * 2; sx(-r * 26); px(r * 12); });
    pin.addEventListener('pointerleave', () => { active = false; });
    const tick = () => {
      if (!active && !busy) return;
      busy = false;
      for (const o of wcs) {
        const vis = Number(getComputedStyle(o.firstChild).opacity);
        if (!o._x) { o._x = 0; o._y = 0; o._r = 0; }
        let tx = 0, ty = 0, tr = 0;
        if (active && vis > 0.3) {
          const r = o.getBoundingClientRect(), cx = r.left + r.width / 2 - o._x, cy = r.top + r.height / 2 - o._y;
          const dx = cx - mx, dy = cy - my, d = Math.hypot(dx, dy) || 1;
          if (d < 190) { const f = Math.pow(1 - d / 190, 1.6); tx = (dx / d) * f * 54; ty = (dy / d) * f * 54; tr = (dx / d) * f * 24; }
        }
        o._x += (tx - o._x) * 0.14; o._y += (ty - o._y) * 0.14; o._r += (tr - o._r) * 0.14;
        if (Math.abs(o._x) + Math.abs(o._y) > 0.15) { o.style.transform = `translate(${o._x.toFixed(2)}px, ${o._y.toFixed(2)}px) rotate(${o._r.toFixed(2)}deg)`; busy = true; }
        else if (o.style.transform) { o.style.transform = ''; o._x = o._y = o._r = 0; }
      }
    };
    gsap.ticker.add(tick);
    return () => gsap.ticker.remove(tick);
  }
}

/* ---------- pinned knit ---------- */
function initSpecs(desktop) {
  const words = state.words;
  if (!desktop) { words.forEach((w) => (w.style.opacity = 1)); gsap.set('[data-tag]', { opacity: 1 }); return; }
  const h = innerHeight;
  gsap.set('#spKnit', { transformPerspective: 1500, transformOrigin: '50% 55%', y: h * 0.75, x: 200, rotationZ: 32, rotationX: 62, rotationY: -42, scale: 0.5, opacity: 0 });
  gsap.set('#spShadow', { opacity: 0, scaleX: 0.4 });
  gsap.set('[data-tag]', { opacity: 0, scale: 0.4, transformOrigin: '0 50%' });
  gsap.set('#spClose p span', { yPercent: 110 });
  const tl = gsap.timeline({ scrollTrigger: { trigger: '#specsPin', start: 'top top', end: '+=300%', pin: true, scrub: 0.8, anticipatePin: 1 } });
  tl.to(words, { opacity: 1, duration: 0.12, stagger: 0.05, ease: 'none' }, 0)
    .to('#spKnit', { y: 0, x: 0, rotationZ: -5, rotationX: 0, rotationY: 0, scale: 1, opacity: 1, duration: 0.42, ease: 'power3.out' }, 0.02)
    .to('#spShadow', { opacity: 1, scaleX: 1, duration: 0.3, ease: 'power2.out' }, 0.2)
    .to('[data-tag]', { opacity: 1, scale: 1, duration: 0.07, stagger: 0.13, ease: 'back.out(2)' }, 0.4)
    .to('#spKnit', { rotationY: 24, rotationZ: 5, rotationX: 6, scale: 1.1, y: -14, duration: 0.5, ease: 'sine.inOut' }, 0.44)
    .to('#spShadow', { scaleX: 0.9, duration: 0.5, ease: 'sine.inOut' }, 0.44)
    .to('#spCta', { opacity: 1, duration: 0.08 }, 0.62)
    .to('#spClose p span', { yPercent: 0, duration: 0.14, stagger: 0.1, ease: 'power3.out' }, 0.74)
    .to('#spKnit', { rotationY: 0, rotationZ: -2, scale: 1.04, duration: 0.2, ease: 'sine.inOut' }, 0.84);
  if (fine) {
    const tx = gsap.quickTo('#spTilt', 'rotationY', { duration: 0.9, ease: 'power3' });
    const ty = gsap.quickTo('#spTilt', 'rotationX', { duration: 0.9, ease: 'power3' });
    gsap.set('#spTilt', { transformPerspective: 1500 });
    const pin = $('#specsPin');
    pin.addEventListener('pointermove', (e) => { tx((e.clientX / innerWidth - 0.5) * 20); ty(-(e.clientY / innerHeight - 0.5) * 14); });
    pin.addEventListener('pointerleave', () => { tx(0); ty(0); });
  }
}

/* ---------- lookbook ---------- */
function initLookbook() {
  $$('.lb__col').forEach((col, i) => gsap.to(col, { y: [-80, 100, -40][i], ease: 'none', scrollTrigger: { trigger: '#lookbook', start: 'top bottom', end: 'bottom top', scrub: 0.8 } }));
}

/* ---------- lodge log: plays itself when it comes into view ---------- */
function initLog() {
  const stage = $('#logStage'), flagsEl = $('#logFlags'), path = $('#logPath'), glow = $('#logGlow'), head = $('#logHead'), svg = $('#logLine');
  const flags = JSON.parse(flagsEl.dataset.flags), reviews = JSON.parse($('#logQuote').dataset.reviews);
  const prof = [[0.3, 1.0], [0.4, 0.93], [0.46, 0.85], [0.52, 0.75], [0.58, 0.62], [0.64, 0.5], [0.69, 0.42], [0.727, 0.375]];
  const NATW = 2200, NATH = 1238, OPX = 0.6, OPY = 0.5;
  let len = 0, played = false, flagEls = [];
  function layout() {
    const sw = stage.clientWidth, sh = stage.clientHeight, k = Math.max(sw / NATW, sh / NATH);
    const dw = NATW * k, dh = NATH * k, ox = (sw - dw) * OPX, oy = (sh - dh) * OPY;
    const pts = prof.map(([nx, ny]) => [ox + nx * dw, oy + ny * dh]);
    svg.setAttribute('viewBox', `0 0 ${sw} ${sh}`);
    const d = 'M' + pts.map((p) => p.map((v) => v.toFixed(1)).join(',')).join(' L');
    path.setAttribute('d', d); glow.setAttribute('d', d);
    len = path.getTotalLength();
    [path, glow].forEach((e) => { e.style.strokeDasharray = len; e.style.strokeDashoffset = played ? 0 : len; });
    flagsEl.innerHTML = ''; flagEls = [];
    flags.forEach((f, i) => {
      const p = path.getPointAtLength(len * f.at), last = i === flags.length - 1;
      const el = document.createElement('div'); el.className = 'flag' + (last ? ' is-hi' : '');
      el.style.left = p.x + 'px'; el.style.top = p.y + 'px';
      el.innerHTML = `<span class="flag__pole"></span><span class="flag__cloth"></span><span class="flag__alt">${f.alt}${last ? ' &middot; The lodge' : ''}</span>${last ? '<span class="flag__ring"></span>' : ''}`;
      flagsEl.append(el); flagEls.push(el);
      if (played) el.style.opacity = 1;
    });
  }
  const num = $('#logNum'), to = Number(num.dataset.to), o = { v: 1.8 }, q = $('#logQ'), who = $('#logName'), where = $('#logWhere');
  const faces = ['look-2', 'look-4', 'look-5', 'look-6', 'look-1', 'look-3'];
  const base = $('#logFace').style.backgroundImage.replace(/look-\d\.webp.*$/, '');
  function review(i) {
    const r = reviews[i];
    gsap.to([q, who.parentElement.parentElement], { opacity: 0, y: -8, duration: 0.18, onComplete: () => {
      q.textContent = r.text; who.textContent = r.name; where.textContent = r.where;
      $('#logFace').style.backgroundImage = `${base}${faces[i]}.webp")`;
      gsap.fromTo([q, who.parentElement.parentElement], { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' });
    } });
  }
  function popFlag(i) {
    const el = flagEls[i], last = i === flags.length - 1;
    gsap.set(el, { opacity: 1 });
    gsap.fromTo($('.flag__pole', el), { scaleY: 0 }, { scaleY: 1, duration: 0.35, ease: 'back.out(2)' });
    gsap.fromTo($('.flag__cloth', el), { scaleX: 0 }, { scaleX: 1, duration: 0.45, delay: 0.12, ease: 'elastic.out(1, 0.5)' });
    gsap.fromTo($('.flag__alt', el), { opacity: 0, y: 10, scale: 0.8 }, { opacity: 1, y: 0, scale: 1, duration: 0.45, delay: 0.1, ease: 'back.out(2)', transformOrigin: '0 100%' });
    review(i);
    if (last) { const ring = $('.flag__ring', el); gsap.fromTo(ring, { opacity: 1, scale: 0.5 }, { opacity: 0, scale: 2.8, duration: 1.4, repeat: 2, ease: 'power2.out' }); }
  }
  function play() {
    if (played) return; played = true;
    if (reduce) { [path, glow].forEach((e) => (e.style.strokeDashoffset = 0)); flagEls.forEach((e) => (e.style.opacity = 1)); num.textContent = to.toFixed(1); return; }
    const shown = flags.map(() => false), prog = { p: 0 };
    gsap.to(o, { v: to, duration: 1.5, ease: 'power2.out', onUpdate: () => (num.textContent = o.v.toFixed(1)) });
    gsap.set(head, { opacity: 1 });
    gsap.to(prog, { p: 1, duration: 3.6, delay: 0.5, ease: 'sine.inOut', onUpdate: () => {
      const L = prog.p * len; [path, glow].forEach((e) => (e.style.strokeDashoffset = len - L));
      const pt = path.getPointAtLength(L); head.setAttribute('cx', pt.x); head.setAttribute('cy', pt.y);
      flags.forEach((f, i) => { if (!shown[i] && prog.p >= f.at - 0.005) { shown[i] = true; popFlag(i); } });
    }, onComplete: () => gsap.to(head, { opacity: 0, duration: 0.6 }) });
  }
  num.textContent = (1.8).toFixed(1);
  layout();
  ScrollTrigger.create({ trigger: '#logPin', start: 'top 60%', once: true, onEnter: play });
  let rz; addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(layout, 200); });
}

/* ---------- footer: people stand and sit on top of the letters ---------- */
function initFooterFigs() {
  const word = $('#footWord'), stage = $('#footStage'); if (!word) return;
  const txt = word.textContent; word.textContent = '';
  const chars = [...txt].map((c) => { const s = document.createElement('span'); s.textContent = c; word.append(s); return s; });
  const bl = document.createElement('i'); bl.className = 'bl'; word.append(bl);
  const small = matchMedia('(max-width: 860px)');
  const sizes = () => (small.matches ? { a: 1.9, b: 1.2, c: 0.9 } : { a: 1.15, b: 0.78, c: 0.55 }); // figure height as a share of the letter height
  const figs = $$('.fig');
  function place() {
    const fs = parseFloat(getComputedStyle(word).fontSize);
    const ctx = document.createElement('canvas').getContext('2d'); ctx.font = `900 ${fs}px "Big Shoulders Stencil"`;
    const capH = ctx.measureText('E').actualBoundingBoxAscent || fs * 0.72;
    const sr = stage.getBoundingClientRect(), base = bl.getBoundingClientRect().top - sr.top, capTop = base - capH;
    figs.forEach((f) => {
      const img = $('img', f), ratio = img.getAttribute('width') / img.getAttribute('height');
      const h = capH * sizes()[f.dataset.fig], w = h * ratio;
      const r = chars[Number(f.dataset.on)].getBoundingClientRect(), cx = r.left + r.width / 2 - sr.left;
      f.style.width = w + 'px'; f.style.height = h + 'px';
      f.style.left = (cx - w / 2) + 'px'; f.style.top = (capTop - h + capH * 0.045) + 'px';
    });
  }
  const run = () => place();
  (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(run);
  run(); addEventListener('resize', run);
  if (!reduce) {
    ScrollTrigger.create({ trigger: stage, start: 'top 72%', once: true, onEnter: () => {
      figs.forEach((f, i) => {
        gsap.from(f, { y: -90, opacity: 0, duration: 0.7, delay: i * 0.18, ease: 'bounce.out' });
        gsap.from($('.fig__sh', f), { scaleX: 0.2, opacity: 0, duration: 0.5, delay: 0.3 + i * 0.18, ease: 'power2.out' });
      });
    } });
  }
}

const state = {};
export function initSections() {
  state.A = splitChars($('#wHead'), '[data-line]'); state.B = splitChars($('#wTwo'), '[data-split]'); state.words = splitWords($('#spHead'));
  const mm = gsap.matchMedia();
  mm.add('(min-width: 861px) and (prefers-reduced-motion: no-preference)', () => { buildShards(); const c = [initWeather(true), initSpecs(true)]; initLookbook(); return () => c.forEach((f) => f && f()); });
  mm.add('(max-width: 860px), (prefers-reduced-motion: reduce)', () => { buildShards(); initWeather(false); initSpecs(false); });
  initLog();
  initFooterFigs();
}
