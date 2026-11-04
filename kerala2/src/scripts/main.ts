import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { site } from '../data/site';

gsap.registerPlugin(ScrollTrigger);

const $ = <T extends HTMLElement = HTMLElement>(s: string) => document.querySelector(s) as T;
const $$ = <T extends HTMLElement = HTMLElement>(s: string) => Array.from(document.querySelectorAll(s)) as T[];
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const pinned = document.documentElement.classList.contains('pin');
const phone = innerWidth <= 820;

/* ---------- smooth scroll ---------- */
let lenis: Lenis | null = null;
if (!reduced) {
  lenis = new Lenis({ lerp: 0.1, wheelMultiplier: 0.95 });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis!.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
}

/* ---------- altitude readout ---------- */
const altNum = $('#alt-num');
const fmt = (v: number) => {
  const r = Math.round(v);
  return (r < 0 ? '−' : '') + Math.abs(r).toLocaleString('en-US');
};
const alt = { v: 2695 };
const setAlt = () => { altNum.textContent = fmt(alt.v); };

/* ---------- tone (header and numeral follow what is under them) ---------- */
const topEl = $('#top');
const altEl = $('#altitude');
const toneAt = (x: number, y: number) => {
  const el = document.elementsFromPoint(x, y).find((e) => !e.closest('.top, .altitude, .egg-layer'));
  const t = el?.closest('[data-tone]') as HTMLElement | null;
  return t?.dataset.tone === 'light' ? 'light' : 'dark';
};
const updateTone = () => {
  topEl.dataset.on = toneAt(innerWidth / 2, 40);
  altEl.dataset.on = toneAt(70, innerHeight - 50);
};

let lastY = 0, tick = 0;
gsap.ticker.add(() => {
  const y = scrollY;
  if (++tick % 5 === 0) updateTone();
  if (Math.abs(y - lastY) > 4) { topEl.classList.toggle('hide', y > lastY && y > 240); lastY = y; }
  topEl.classList.toggle('solid', y > 120);
});
updateTone(); setAlt();

/* ---------- hero: headline and fog ---------- */
if (!reduced) {
  gsap.set('.line-in', { yPercent: 112 });
  gsap.set('.hero-sub', { opacity: 0, y: 16 });
  gsap.to('.line-in', { yPercent: 0, duration: 1.5, ease: 'power3.out', stagger: 0.14, delay: 0.25 });
  gsap.to('.hero-sub', { opacity: 1, y: 0, duration: 1.2, ease: 'power2.out', delay: 1.0 });
}
gsap.to('.hero-img', { yPercent: 10, ease: 'none', scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: true } });
gsap.to('#fog', { opacity: 0, ease: 'none', scrollTrigger: { trigger: '#hero', start: 'top top', end: '70% top', scrub: true } });

function initFog() {
  const hero = $('#hero');
  const c = $('#fog') as HTMLCanvasElement;
  if (reduced) { c.style.display = 'none'; return; }
  const ctx = c.getContext('2d')!;
  const tex = document.createElement('canvas'); // the fog itself
  const mask = document.createElement('canvas'); // where the visitor has wiped (alpha = cleared)
  const tctx = tex.getContext('2d')!;
  const mctx = mask.getContext('2d')!;
  let W = 0, H = 0, R = 0;
  const build = () => {
    const sc = 0.5;
    W = c.width = tex.width = mask.width = Math.round(hero.clientWidth * sc);
    H = c.height = tex.height = mask.height = Math.round(hero.clientHeight * sc);
    R = Math.max(W, H) * 0.14;
    tctx.clearRect(0, 0, W, H);
    tctx.fillStyle = 'rgba(104,124,116,0.5)';
    tctx.fillRect(0, 0, W, H);
    let seed = 7;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < 46; i++) {
      const x = rnd() * W, y = rnd() * H * 0.9, r = (0.07 + rnd() * 0.16) * Math.max(W, H);
      const g = tctx.createRadialGradient(x, y, 0, x, y, r);
      const a = 0.14 + rnd() * 0.24;
      g.addColorStop(0, `rgba(184,200,193,${a})`);
      g.addColorStop(1, 'rgba(184,200,193,0)');
      tctx.fillStyle = g;
      tctx.fillRect(x - r, y - r, r * 2, r * 2);
    }
    // thinner fog at the bottom so the headline stays calm
    tctx.globalCompositeOperation = 'destination-out';
    const t = tctx.createLinearGradient(0, H * 0.55, 0, H);
    t.addColorStop(0, 'rgba(0,0,0,0)');
    t.addColorStop(1, 'rgba(0,0,0,0.6)');
    tctx.fillStyle = t;
    tctx.fillRect(0, H * 0.55, W, H * 0.45);
    tctx.globalCompositeOperation = 'source-over';
    mctx.clearRect(0, 0, W, H);
  };
  build();
  addEventListener('resize', build);

  // a soft brush sprite, stamped where the visitor wipes; stamps fade with age so the mist drifts back
  const brush = document.createElement('canvas');
  const mkBrush = () => {
    const d = Math.ceil(R * 2.8);
    brush.width = brush.height = d;
    const bc = brush.getContext('2d')!;
    const g = bc.createRadialGradient(d / 2, d / 2, 0, d / 2, d / 2, d / 2);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.5, 'rgba(255,255,255,0.6)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    bc.fillStyle = g; bc.fillRect(0, 0, d, d);
  };
  mkBrush();
  addEventListener('resize', mkBrush);
  type Stamp = { x: number; y: number; k: number; t: number };
  const stamps: Stamp[] = [];
  let lx = -1, ly = -1;
  const wipe = (x: number, y: number, k = 1) => {
    const now = performance.now();
    const add = (px: number, py: number) => { stamps.push({ x: px, y: py, k, t: now }); if (stamps.length > 260) stamps.shift(); };
    if (lx >= 0) {
      const dx = x - lx, dy = y - ly, dist = Math.hypot(dx, dy), step = R * 0.4;
      for (let s = step; s < dist; s += step) add(lx + (dx * s) / dist, ly + (dy * s) / dist);
    }
    add(x, y);
    lx = x; ly = y;
  };
  const pos = (e: PointerEvent) => {
    const r = hero.getBoundingClientRect();
    return [((e.clientX - r.left) / r.width) * W, ((e.clientY - r.top) / r.height) * H] as const;
  };
  hero.addEventListener('pointermove', (e) => { const [x, y] = pos(e); wipe(x, y); });
  hero.addEventListener('pointerleave', () => { lx = -1; });
  hero.addEventListener('pointerdown', (e) => { const [x, y] = pos(e); lx = -1; wipe(x, y, 1.4); });

  // opening sweep so the visitor sees the fog can be wiped
  const sweep = { t: 0 };
  gsap.to(sweep, {
    t: 1, duration: 2.6, delay: 0.5, ease: 'power2.inOut',
    onUpdate: () => { const t = sweep.t; wipe(W * (0.2 + 0.62 * t), H * (0.52 + 0.07 * Math.sin(t * 7)), 1.05); },
    onComplete: () => { lx = -1; },
  });

  let visible = true;
  new IntersectionObserver((es) => { visible = es[0].isIntersecting; }, { threshold: 0 }).observe(hero);
  gsap.ticker.add(() => {
    if (!visible) return;
    const now = performance.now();
    mctx.clearRect(0, 0, W, H);
    for (let i = stamps.length - 1; i >= 0; i--) {
      const st = stamps[i], age = (now - st.t) / 7000;
      if (age >= 1) { stamps.splice(0, i + 1); break; }
      mctx.globalAlpha = Math.pow(1 - age, 1.4) * 0.85;
      const d = R * 2.8 * st.k * (0.9 + 0.1 * (1 - age));
      mctx.drawImage(brush, st.x - d / 2, st.y - d / 2, d, d);
    }
    mctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    ctx.clearRect(0, 0, W, H);
    ctx.drawImage(tex, 0, 0);
    ctx.globalCompositeOperation = 'destination-out';
    ctx.drawImage(mask, 0, 0);
    ctx.globalCompositeOperation = 'source-over';
  });
}
initFog();

/* ---------- statement ---------- */
if (pinned) {
  const tl = gsap.timeline({ scrollTrigger: { trigger: '#statement', start: 'top 35%', end: 'bottom 92%', scrub: 0.6 } });
  tl.fromTo('.sw', { opacity: 0.1, yPercent: 35 }, { opacity: 1, yPercent: 0, stagger: 0.4, ease: 'none', duration: 0.6 })
    .fromTo('#statement-note', { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.5, ease: 'none' }, '>-0.1');
} else {
  gsap.from('.sw', { opacity: 0, y: 40, stagger: 0.2, duration: 1, ease: 'power2.out', scrollTrigger: { trigger: '#statement', start: 'top 70%' } });
  gsap.to(alt, { v: 1600, ease: 'none', onUpdate: setAlt, scrollTrigger: { trigger: '#hero', start: 'top top', endTrigger: '#descent', end: 'top 60%', scrub: true } });
}

/* ---------- the descent ---------- */
const alts = site.stations.map((s) => s.alt);
let descentST: ScrollTrigger | null = null;
let lastAlt = 99999;
gsap.ticker.add(() => {
  if (descentST) {
    const y = scrollY;
    if (y < descentST.start) alt.v = 2695 + (1600 - 2695) * Math.min(1, Math.max(0, y / descentST.start));
    else if (y > descentST.end) alt.v = 0;
  }
  if (dialOn) { const t = site.seasons[dialIndex].short; if (altNum.textContent !== t) altNum.textContent = t; lastAlt = 99999; return; }
  const r = Math.round(alt.v);
  if (r !== lastAlt) { lastAlt = r; setAlt(); }
});
if (pinned) {
  const imgs = $$('.st-img'), names = $$('.st-name-in'), texts = $$('.st-text');
  gsap.set(imgs, { clipPath: (i) => (i === 0 ? 'inset(0% 0% 0% 0%)' : 'inset(101% 0% 0% 0%)') });
  gsap.set(names, { yPercent: 112 });
  gsap.set(texts, { opacity: 0, y: 24 });
  gsap.set('#frame', { scale: 0.94 });
  const tl = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: { trigger: '#descent', start: 'top top', end: '+=420%', scrub: 0.8, pin: '#descent-pin', anticipatePin: 1 },
  });
  tl.to('#frame', { scale: 1, duration: 0.8, ease: 'power1.out' }, 0)
    .to(names[0], { yPercent: 0, duration: 0.6, ease: 'power2.out' }, 0.25)
    .to(texts[0], { opacity: 1, y: 0, duration: 0.5 }, 0.5);
  for (let i = 1; i < site.stations.length; i++) {
    const s = 0.8 + (i - 1) * 1.5 + 1.0;
    tl.to(names[i - 1], { yPercent: -112, duration: 0.35, ease: 'power2.in' }, s)
      .to(texts[i - 1], { opacity: 0, y: -18, duration: 0.3 }, s)
      .to(imgs[i], { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.5, ease: 'power1.inOut' }, s)
      .fromTo(imgs[i].querySelector('img'), { scale: 1.12 }, { scale: 1, duration: 0.5 }, s)
      .to(names[i], { yPercent: 0, duration: 0.45, ease: 'power2.out' }, s + 0.25)
      .to(texts[i], { opacity: 1, y: 0, duration: 0.3 }, s + 0.2)
      .to(alt, { v: alts[i], duration: 0.5, onUpdate: setAlt }, s);
  }
  tl.to({}, { duration: 0.5 }, '>'); // a last dwell
  descentST = tl.scrollTrigger as ScrollTrigger;
} else {
  $$('.st-card').forEach((card, i) => {
    ScrollTrigger.create({
      trigger: card, start: 'top 55%', end: 'bottom 45%',
      onToggle: (self) => { if (self.isActive) gsap.to(alt, { v: alts[i], duration: 0.9, ease: 'power2.out', onUpdate: setAlt }); },
    });
  });
}

/* ---------- when to come ---------- */
const seasons = site.seasons;
let fxMode = 'rain';
if (pinned) {
  const A = 46;
  const wheel = $('#wheel');
  const nameEls = $$('.wheel-name');
  nameEls.forEach((el, i) => { el.style.transform = `rotate(${i * A}deg)`; });
  const sImgs = $$('.se-img'), sTexts = $$('.se-text');
  gsap.set(sImgs.slice(1), { opacity: 0 });
  gsap.set(sTexts, { opacity: 0, y: 16 });
  gsap.set(sTexts[0], { opacity: 1, y: 0 });
  nameEls[0].classList.add('on');
  const total = seasons.length;
  const tl = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: { trigger: '#seasons', start: 'top top', end: `+=${total * 85}%`, scrub: 0.8, pin: '#seasons-pin', anticipatePin: 1 },
  });
  tl.to({}, { duration: 0.9 });
  for (let i = 1; i < total; i++) {
    const s = 0.9 + (i - 1) * 1.5;
    tl.to(wheel, { rotation: -i * A, duration: 0.6, ease: 'power2.inOut' }, s)
      .to(sImgs[i - 1], { opacity: 0, duration: 0.6 }, s)
      .to(sImgs[i], { opacity: 1, duration: 0.6 }, s)
      .to(sTexts[i - 1], { opacity: 0, y: -14, duration: 0.25 }, s)
      .to(sTexts[i], { opacity: 1, y: 0, duration: 0.35 }, s + 0.3)
      .call(() => { nameEls.forEach((n, k) => n.classList.toggle('on', k === i)); fxMode = seasons[i].fx; dialIndex = i; }, undefined, s + 0.3)
      .call(() => { nameEls.forEach((n, k) => n.classList.toggle('on', k === i - 1)); fxMode = seasons[i - 1].fx; dialIndex = i - 1; }, undefined, s + 0.29);
    tl.to({}, { duration: 0.9 }, s + 0.6);
  }
  // wheel starts centred
  gsap.set(wheel, { rotation: 0 });
}

const hide = { seasons: false, foot: false, phoneStack: false };
let dialOn = false, dialIndex = 0;
const altUnit = document.querySelector('.alt-unit') as HTMLElement;
const applySpine = () => {
  gsap.to('#altitude', { autoAlpha: hide.foot || hide.phoneStack ? 0 : 1, duration: 0.4, overwrite: 'auto' });
  dialOn = hide.seasons && pinned;
  altUnit.style.display = dialOn ? 'none' : '';
};
if (phone) ScrollTrigger.create({ trigger: '#hero', start: 'bottom 45%', onEnter: () => { hide.phoneStack = true; applySpine(); }, onLeaveBack: () => { hide.phoneStack = false; applySpine(); } });
ScrollTrigger.create({ trigger: '#seasons', start: 'top 55%', end: 'bottom 45%', onToggle: (self) => { hide.seasons = self.isActive; applySpine(); } });
ScrollTrigger.create({ trigger: '.foot', start: 'top 96%', onEnter: () => { hide.foot = true; applySpine(); }, onLeaveBack: () => { hide.foot = false; applySpine(); } });
if (!pinned) {
  ScrollTrigger.create({
    trigger: '#sea', start: 'top 70%',
    onEnter: () => gsap.to(alt, { v: 0, duration: 1.2, ease: 'power2.out', onUpdate: setAlt }),
    onLeaveBack: () => gsap.to(alt, { v: -2, duration: 0.6, onUpdate: setAlt }),
  });
}


/* weather canvas, drawn only while the section is on screen */
function initFx() {
  const c = $('#fx') as HTMLCanvasElement;
  if (!c || reduced || !pinned) return;
  const ctx = c.getContext('2d')!;
  let W = 0, H = 0;
  const size = () => { W = c.width = Math.round(c.clientWidth * 0.75); H = c.height = Math.round(c.clientHeight * 0.75); };
  size(); addEventListener('resize', size);
  type P = { x: number; y: number; v: number; s: number; r: number; k: number };
  let ps: P[] = [], current = '';
  const mk = (): P => ({ x: Math.random() * W, y: Math.random() * H, v: 0.6 + Math.random(), s: 0.6 + Math.random() * 0.9, r: Math.random() * 6.28, k: Math.random() });
  let visible = false;
  new IntersectionObserver((es) => { visible = es[0].isIntersecting; }, { threshold: 0.05 }).observe($('#seasons-pin'));
  gsap.ticker.add(() => {
    if (!visible) return;
    if (current !== fxMode) { current = fxMode; ps = Array.from({ length: current === 'rain' ? 150 : current === 'haze' ? 0 : 70 }, mk); }
    ctx.clearRect(0, 0, W, H);
    for (const p of ps) {
      if (current === 'rain') {
        p.y += 18 * p.v; p.x -= 3 * p.v;
        ctx.strokeStyle = `rgba(235,242,238,${0.25 + p.k * 0.3})`; ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x + 3 * p.s, p.y - 20 * p.s); ctx.stroke();
        if (p.y > H) { p.y = -30; p.x = Math.random() * (W + 80); }
      } else if (current === 'petals') {
        p.y += 1.1 * p.v; p.x += Math.sin(p.y / 40 + p.r) * 0.9; p.r += 0.02;
        ctx.fillStyle = p.k > 0.5 ? '#ee5a36' : '#f3f1ea';
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r);
        ctx.beginPath(); ctx.ellipse(0, 0, 9 * p.s, 4.5 * p.s, 0, 0, 6.28); ctx.fill(); ctx.restore();
        if (p.y > H + 20) { p.y = -20; p.x = Math.random() * W; }
      } else if (current === 'embers') {
        p.y -= 1.2 * p.v; p.x += Math.sin(p.y / 30 + p.r) * 0.7;
        ctx.fillStyle = p.k > 0.4 ? `rgba(238,90,54,${0.5 + p.k * 0.4})` : 'rgba(255,214,190,0.7)';
        ctx.beginPath(); ctx.arc(p.x, p.y, 1.4 + p.s * 1.6, 0, 6.28); ctx.fill();
        if (p.y < -10) { p.y = H + 10; p.x = Math.random() * W; }
      }
    }
  });
}
initFx();

/* sea section entrance */
if (!reduced) {
  gsap.from(['.planner-title', '#route li', '.planner-help', '.btn'], {
    y: 46, opacity: 0, duration: 1.1, ease: 'power3.out', stagger: 0.07,
    scrollTrigger: { trigger: '#planner', start: 'top 78%' },
  });
  gsap.from('.sea-close', { y: 40, opacity: 0, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: '.sea-close', start: 'top 92%' } });
}
/* ---------- the sea: plan your fall (a photograph that drifts slowly) ---------- */
if (!reduced) {
  gsap.fromTo('#planner-bg img', { scale: 1.02 }, { scale: 1.14, ease: 'none', scrollTrigger: { trigger: '#sea', start: 'top bottom', end: 'bottom top', scrub: true } });
}

/* water filling the word */
(function seaWord() {
  const water = $('#water') as unknown as SVGPathElement;
  const wrap = $('#sea-word');
  const level = { v: reduced ? 1 : 0 };
  let visible = false, t = 0;
  const draw = () => {
    const base = 410 - level.v * 430;
    const pts: string[] = [];
    for (let x = 0; x <= 1600; x += 25) pts.push(`${x} ${(base + 9 * Math.sin(x / 60 + t) + 5 * Math.sin(x / 23 - t * 1.4)).toFixed(1)}`);
    water.setAttribute('d', `M${pts.join(' L')} L1600 460 L0 460 Z`);
  };
  draw();
  if (reduced) return;
  new IntersectionObserver((es) => { visible = es[0].isIntersecting; }, { threshold: 0 }).observe(wrap);
  gsap.to(level, { v: 1, ease: 'none', scrollTrigger: { trigger: wrap, start: 'top 85%', end: 'center 60%', scrub: 0.5 } });
  gsap.ticker.add((_, dt) => { if (!visible) return; t += dt / 700; draw(); });
})();

/* ---------- easter eggs (loaded only when found) ---------- */
let eggs: typeof import('./eggs') | null = null;
const loadEggs = async () => (eggs ||= await import('./eggs'));
let buf = '';
addEventListener('keydown', async (e) => {
  buf = (buf + e.key.toLowerCase()).slice(-4);
  if (buf === 'onam') { (await loadEggs()).pookalam(innerWidth / 2, innerHeight / 2); buf = ''; }
});
{
  let timer = 0;
  altEl.addEventListener('pointerdown', () => {
    timer = window.setTimeout(async () => { (await loadEggs()).pookalam(innerWidth / 2, innerHeight / 2); }, 650);
  });
  ['pointerup', 'pointerleave', 'pointercancel'].forEach((ev) => altEl.addEventListener(ev, () => clearTimeout(timer)));
}
$('#sea-word').addEventListener('click', async () => (await loadEggs()).boat($('#sea-word')));
if (!reduced) {
  let idle = 0;
  const arm = () => {
    clearTimeout(idle);
    idle = window.setTimeout(async () => {
      if (document.hidden) return;
      (await loadEggs()).kingfisher();
    }, 20000);
  };
  ['pointermove', 'scroll', 'keydown', 'touchstart'].forEach((ev) => addEventListener(ev, arm, { passive: true }));
  arm();
}

// links to in-page anchors use smooth scrolling
$('.scroll-cue').addEventListener('click', (e) => {
  e.preventDefault();
  lenis ? lenis.scrollTo('#statement') : $('#statement').scrollIntoView();
});
ScrollTrigger.refresh();
