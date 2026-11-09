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

/* ---------- weather: wind-blown snow over the ridge, pushed by the cursor ---------- */
function initSpindrift() {
  const cv = $('#wSnow'), pin = $('#weatherPin'); if (!cv || !pin) return null;
  const ctx = cv.getContext('2d');
  let W = 0, H = 0, parts = [], on = false, mx = -9999, my = -9999;
  const mk = (any) => ({ x: any ? Math.random() * W : -24, y: H * (0.18 + Math.random() * 0.78), r: 0.7 + Math.random() * 2.2, vx: 1.1 + Math.random() * 2.8, vy: -0.25 + Math.random() * 0.6, a: 0.25 + Math.random() * 0.65, s: Math.random() * 6 });
  const size = () => {
    const dpr = Math.min(devicePixelRatio || 1, 1.5);
    W = cv.clientWidth; H = cv.clientHeight; cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    parts = Array.from({ length: Math.round((W * H) / (fine ? 5600 : 12000)) }, () => mk(true));
  };
  size();
  const tick = () => {
    if (!on || reduce) return;
    ctx.clearRect(0, 0, W, H);
    for (const p of parts) {
      p.s += 0.02; p.x += p.vx + Math.sin(p.s) * 0.45; p.y += p.vy + Math.cos(p.s * 0.8) * 0.4;
      const dx = p.x - mx, dy = p.y - my, d = Math.hypot(dx, dy);
      if (d < 150) { const f = 1 - d / 150; p.x += (dx / (d || 1)) * f * 3.4; p.y += (dy / (d || 1)) * f * 3.4; }
      if (p.x > W + 24 || p.y < -20 || p.y > H + 20) Object.assign(p, mk(false));
      ctx.globalAlpha = p.a; ctx.fillStyle = '#f4f6fa'; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 7); ctx.fill();
    }
    ctx.globalAlpha = 1;
  };
  const io = new IntersectionObserver(([e]) => (on = e.isIntersecting)); io.observe(pin);
  const move = (e) => { const r = cv.getBoundingClientRect(); mx = e.clientX - r.left; my = e.clientY - r.top; };
  const leave = () => { mx = my = -9999; };
  if (fine) { pin.addEventListener('pointermove', move); pin.addEventListener('pointerleave', leave); }
  addEventListener('resize', size);
  gsap.ticker.add(tick);
  return () => { gsap.ticker.remove(tick); io.disconnect(); removeEventListener('resize', size); pin.removeEventListener('pointermove', move); pin.removeEventListener('pointerleave', leave); };
}

/* ---------- weather ---------- */
function initWeather(desktop) {
  const pin = $('#weatherPin');
  const A = state.A, B = state.B;
  const stopSnow = initSpindrift();
  if (!desktop) {
    gsap.set([A.chars, B.chars], { opacity: 1, y: 0 });
    gsap.set('#wFrame', { clipPath: 'inset(0% 0% 0% 0% round 0px)' });
    gsap.set('#wSnow', { opacity: reduce ? 0 : 0.9 });
    return () => stopSnow && stopSnow();
  }
  gsap.set(A.chars, { opacity: 0, y: 36 });
  gsap.set(B.chars, { opacity: 0, y: -30 });
  gsap.set('#wPeak', { yPercent: 28, opacity: 0.15 });
  gsap.set('.w-note', { opacity: 0, y: 24 });
  gsap.set('#wSnow', { opacity: 0 });
  gsap.set('#wFrame', { clipPath: 'inset(100% 8vw 0% 8vw round 22px)' });
  gsap.set('#wFrame img', { scale: 1.22 });
  const tl = gsap.timeline({ scrollTrigger: { trigger: pin, start: 'top top', end: '+=460%', pin: true, scrub: 0.7, anticipatePin: 1 } });
  tl.to('#wPeak', { yPercent: 0, opacity: 1, duration: 0.16, ease: 'power2.out' }, 0)
    .to('#wSnow', { opacity: 1, duration: 0.14 }, 0.06)
    .to('.w-note', { opacity: 1, y: 0, duration: 0.08, stagger: 0.03 }, 0.1)
    .to(A.chars, { opacity: 1, y: 0, duration: 0.1, stagger: { each: 0.004, from: 'random' }, ease: 'power2.out' }, 0.12)
    .to('#wPeak', { yPercent: -6, duration: 0.3, ease: 'none' }, 0.18)
    .to(A.chars, { opacity: 0, y: -70, duration: 0.1, stagger: { each: 0.003, from: 'random' }, ease: 'power2.in' }, 0.46)
    .to('.w-note', { opacity: 0, duration: 0.06 }, 0.46)
    .to('#wSnow', { opacity: 0, duration: 0.12 }, 0.5)
    .to('#wPeak', { opacity: 0.2, yPercent: -16, duration: 0.3, ease: 'none' }, 0.5)
    .to(B.chars, { opacity: 1, y: 0, duration: 0.1, stagger: { each: 0.005, from: 'random' }, ease: 'power2.out' }, 0.52)
    .to('#wFrame', { clipPath: 'inset(30% 8vw 0% 8vw round 22px)', duration: 0.12, ease: 'power2.out' }, 0.54)
    .to('#wFrame', { clipPath: 'inset(0% 0% 0% 0% round 0px)', duration: 0.26, ease: 'power2.inOut' }, 0.68)
    .to('#wFrame img', { scale: 1, duration: 0.42, ease: 'none' }, 0.54)
    .to({}, { duration: 0.06 }, 0.94);

  let stopWind = null;
  if (fine) {
    // the cursor blows the headline letters aside
    const px = gsap.quickTo('#wPeak', 'x', { duration: 1.4, ease: 'power3' });
    const wcs = [...A.wcs, ...B.wcs];
    let mx = -9999, my = -9999, active = false, busy = false;
    const move = (e) => { mx = e.clientX; my = e.clientY; active = true; px(((e.clientX / innerWidth - 0.5) * 2) * 12); };
    const leave = () => { active = false; };
    pin.addEventListener('pointermove', move); pin.addEventListener('pointerleave', leave);
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
    stopWind = () => { gsap.ticker.remove(tick); pin.removeEventListener('pointermove', move); pin.removeEventListener('pointerleave', leave); };
  }
  return () => { stopSnow && stopSnow(); stopWind && stopWind(); };
}

/* ---------- pinned knit: flat and honest, it floats in and the cursor gives it a little parallax ---------- */
function initSpecs(desktop) {
  const words = state.words;
  if (!desktop) { words.forEach((w) => (w.style.opacity = 1)); gsap.set('[data-tag]', { opacity: 1 }); return; }
  const h = innerHeight;
  gsap.set('#spKnit', { transformOrigin: '50% 62%', y: h * 0.7, x: 90, rotation: 12, scale: 0.72, opacity: 0 });
  gsap.set('#spShadow', { opacity: 0, scaleX: 0.4 });
  gsap.set('[data-tag]', { opacity: 0, scale: 0.4, transformOrigin: '0 50%' });
  gsap.set('#spClose p span', { yPercent: 110 });
  const tl = gsap.timeline({ scrollTrigger: { trigger: '#specsPin', start: 'top top', end: '+=280%', pin: true, scrub: 0.8, anticipatePin: 1 } });
  tl.to(words, { opacity: 1, duration: 0.12, stagger: 0.05, ease: 'none' }, 0)
    .to('#spKnit', { y: 0, x: 0, rotation: -3, scale: 1, opacity: 1, duration: 0.42, ease: 'power3.out' }, 0.02)
    .to('#spShadow', { opacity: 1, scaleX: 1, duration: 0.3, ease: 'power2.out' }, 0.2)
    .to('[data-tag]', { opacity: 1, scale: 1, duration: 0.07, stagger: 0.13, ease: 'back.out(2)' }, 0.4)
    .to('#spKnit', { rotation: 2, scale: 1.07, y: -12, duration: 0.5, ease: 'sine.inOut' }, 0.44)
    .to('#spShadow', { scaleX: 0.92, duration: 0.5, ease: 'sine.inOut' }, 0.44)
    .to('#spCta', { opacity: 1, duration: 0.08 }, 0.62)
    .to('#spClose p span', { yPercent: 0, duration: 0.14, stagger: 0.1, ease: 'power3.out' }, 0.74)
    .to('#spKnit', { rotation: -1, scale: 1.03, y: 0, duration: 0.2, ease: 'sine.inOut' }, 0.84);
  if (fine) {
    // the knit drifts a little against the cursor, the way things do at different depths
    const qx = gsap.quickTo('#spTilt', 'x', { duration: 1.1, ease: 'power3' });
    const qy = gsap.quickTo('#spTilt', 'y', { duration: 1.1, ease: 'power3' });
    const pin = $('#specsPin');
    const move = (e) => { qx(-(e.clientX / innerWidth - 0.5) * 30); qy(-(e.clientY / innerHeight - 0.5) * 18); };
    const leave = () => { qx(0); qy(0); };
    pin.addEventListener('pointermove', move); pin.addEventListener('pointerleave', leave);
    return () => { pin.removeEventListener('pointermove', move); pin.removeEventListener('pointerleave', leave); };
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
  const sizes = () => (small.matches ? { a: 2.5, b: 1.6, c: 1.2 } : { a: 1.15, b: 0.78, c: 0.55 }); // figure height as a share of the letter height
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
  mm.add('(min-width: 861px) and (prefers-reduced-motion: no-preference)', () => { const c = [initWeather(true), initSpecs(true)]; initLookbook(); return () => c.forEach((f) => f && f()); });
  mm.add('(max-width: 860px), (prefers-reduced-motion: reduce)', () => { const c = initWeather(false); initSpecs(false); return () => c && c(); });
  initLog();
  initFooterFigs();
}
