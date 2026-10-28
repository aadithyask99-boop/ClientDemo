import { gsap } from 'gsap';

(window as unknown as { __orra: boolean }).__orra = true;

const q = <T extends Element = HTMLElement>(s: string, r: ParentNode = document) => r.querySelector<T>(s);
const qa = <T extends Element = HTMLElement>(s: string, r: ParentNode = document) => [...r.querySelectorAll<T>(s)];
const root = document.documentElement;
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

const card = q('[data-card]')!;
const scene = q('[data-scene]')!;

/** Pointer position over the card, -0.5 to 0.5 on each axis (drifts by itself when nobody is moving the pointer) */
const pointer = { x: 0, y: 0, px: 0, py: 0, inside: false, last: performance.now() };

/* ---------- Depth: each layer slides a little with the pointer, the letters the opposite way ---------- */
const layers = qa('[data-depth]', scene).map((el) => ({
  el,
  depth: parseFloat(el.dataset.depth || '0'),
  x: gsap.quickTo(el, 'x', { duration: 1.1, ease: 'power3.out' }),
  y: gsap.quickTo(el, 'y', { duration: 1.1, ease: 'power3.out' }),
}));

const letterEls = [0, 1, 2, 3].map((i) => qa(`.l[data-i="${i}"]`, scene));
const letters = letterEls.map((els) => ({
  els,
  y: els.map((e) => gsap.quickTo(e, 'y', { duration: 0.7, ease: 'power3.out' })),
  s: els.map((e) => gsap.quickTo(e, 'scale', { duration: 0.7, ease: 'power3.out' })),
}));
let letterBox: { c: number; w: number }[] = [];
const measureLetters = () => {
  const r = card.getBoundingClientRect();
  letterBox = letterEls.map((els) => {
    const b = els[0].getBoundingClientRect();
    return { c: (b.left + b.width / 2 - r.left) / r.width - 0.5, w: b.width / r.width };
  });
};

const floaters = qa('.stat', card).map((el) => ({
  el,
  x: gsap.quickTo(el, 'x', { duration: 1.1, ease: 'power3.out' }),
  y: gsap.quickTo(el, 'y', { duration: 1.1, ease: 'power3.out' }),
}));

function applyDepth() {
  const w = card.clientWidth;
  layers.forEach((l) => {
    l.x(-pointer.x * l.depth * w * 2);
    l.y(-pointer.y * l.depth * w * 2);
  });
  floaters.forEach((f, i) => {
    f.x(pointer.x * w * (0.012 + i * 0.006));
    f.y(pointer.y * w * (0.01 + i * 0.005));
  });
  // The letter under the pointer lifts, its neighbours follow a little
  letters.forEach((l, i) => {
    const b = letterBox[i];
    const near = pointer.inside && b ? Math.max(0, 1 - Math.abs(pointer.x - b.c) / (b.w * 1.15)) ** 2 : 0;
    l.y.forEach((fn) => fn(-near * card.clientHeight * 0.022));
    l.s.forEach((fn) => fn(1 + near * 0.025));
  });
}

/* ---------- Light: neon blooms around the pointer ---------- */
const houseEl = q('.house', scene)!;
const lit = { v: 0 };
const setLit = gsap.quickTo(lit, 'v', { duration: 0.6, ease: 'power2.out', onUpdate: () => houseEl.style.setProperty('--hot', lit.v.toFixed(3)) });
function applyLight(cx: number, cy: number) {
  const b = houseEl.getBoundingClientRect();
  const over = cx > b.left - 20 && cx < b.right + 20 && cy > b.top - 20 && cy < b.bottom + 20;
  houseEl.style.setProperty('--nx', `${cx - b.left}px`);
  houseEl.style.setProperty('--ny', `${cy - b.top}px`);
  setLit(over ? 1 : 0);
}

/* ---------- Water: rings spread from the pointer, and the reflection wobbles with its speed ---------- */
const canvas = q<HTMLCanvasElement>('[data-ripples]', scene)!;
const ctx = canvas.getContext('2d')!;
type Ring = { x: number; y: number; r: number; max: number; a: number; speed: number };
const rings: Ring[] = [];
let dpr = 1;
let cw = 0;
let ch = 0;
let running = false;
const horizon = () => ch * 0.56;
const fitCanvas = () => {
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  cw = canvas.clientWidth;
  ch = canvas.clientHeight;
  canvas.width = Math.round(cw * dpr);
  canvas.height = Math.round(ch * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
};
function spawn(x: number, y: number, big = 1) {
  rings.push({ x, y, r: 2, max: (50 + Math.random() * 40) * big * (cw / 1100 + 0.4), a: 0.5, speed: 38 + Math.random() * 18 });
  if (rings.length > 40) rings.shift();
  kick();
}
function kick() {
  if (running) return;
  running = true;
  let t0 = performance.now();
  const frame = (t: number) => {
    const dt = Math.min(0.05, (t - t0) / 1000);
    t0 = t;
    ctx.clearRect(0, 0, cw, ch);
    ctx.lineWidth = 1.2;
    for (let i = rings.length - 1; i >= 0; i--) {
      const g = rings[i];
      g.r += g.speed * dt * (1 - g.r / g.max * 0.55);
      const k = g.r / g.max;
      if (k >= 1) { rings.splice(i, 1); continue; }
      const a = g.a * (1 - k) ** 1.6;
      ctx.strokeStyle = `rgba(255,255,255,${a.toFixed(3)})`;
      ctx.beginPath();
      ctx.ellipse(g.x, g.y, g.r, g.r * 0.2, 0, 0, Math.PI * 2);
      ctx.stroke();
      if (g.r > 14) {
        ctx.strokeStyle = `rgba(255,255,255,${(a * 0.45).toFixed(3)})`;
        ctx.beginPath();
        ctx.ellipse(g.x, g.y, g.r * 0.62, g.r * 0.62 * 0.2, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
    if (rings.length) requestAnimationFrame(frame);
    else { running = false; ctx.clearRect(0, 0, cw, ch); }
  };
  requestAnimationFrame(frame);
}

const disp = q('[data-disp]');
const wobble = { v: 8 };
const setWobble = () => disp?.setAttribute('scale', wobble.v.toFixed(1));
let lastRing = { x: -999, y: -999 };

/* ---------- Pointer input (mouse, pen or a finger dragging) ---------- */
let rect = card.getBoundingClientRect();
const measure = () => { rect = card.getBoundingClientRect(); measureLetters(); fitCanvas(); moveNav(); };

let prev = { x: 0, y: 0, t: 0 };
function onMove(e: PointerEvent) {
  const nx = (e.clientX - rect.left) / rect.width;
  const ny = (e.clientY - rect.top) / rect.height;
  pointer.inside = nx >= 0 && nx <= 1 && ny >= 0 && ny <= 1;
  pointer.x = Math.max(-0.5, Math.min(0.5, nx - 0.5));
  pointer.y = Math.max(-0.5, Math.min(0.5, ny - 0.5));
  pointer.last = performance.now();
  if (reduce) return;
  applyDepth();
  if (!pointer.inside) { setLit(0); return; }
  applyLight(e.clientX, e.clientY);

  const cx = e.clientX - rect.left;
  const cy = e.clientY - rect.top;
  const now = performance.now();
  const speed = Math.hypot(e.clientX - prev.x, e.clientY - prev.y) / Math.max(8, now - prev.t);
  prev = { x: e.clientX, y: e.clientY, t: now };
  if (cy > horizon()) {
    gsap.to(wobble, { v: Math.min(26, 8 + speed * 14), duration: 0.25, overwrite: true, onUpdate: setWobble, onComplete: () => { gsap.to(wobble, { v: 8, duration: 2.2, ease: 'power2.out', onUpdate: setWobble }); } });
    if (Math.hypot(cx - lastRing.x, cy - lastRing.y) > 46) { lastRing = { x: cx, y: cy }; spawn(cx, cy, 0.8); }
  }
}
window.addEventListener('pointermove', onMove, { passive: true });
window.addEventListener('pointerdown', (e) => {
  if (reduce) return;
  const cx = e.clientX - rect.left;
  const cy = e.clientY - rect.top;
  if (cy > horizon() && cx >= 0 && cx <= rect.width) {
    spawn(cx, cy, 1.5);
    window.setTimeout(() => spawn(cx, cy, 1.1), 160);
    window.setTimeout(() => spawn(cx, cy, 0.8), 340);
  }
}, { passive: true });
card.addEventListener('pointerleave', () => { pointer.inside = false; setLit(0); applyDepth(); });

/* With nobody at the controls the scene drifts slowly, so it never looks frozen */
if (!reduce) {
  let nextDrop = 0;
  gsap.ticker.add((time) => {
    if (performance.now() - pointer.last < 2800) return;
    pointer.x = Math.sin(time * 0.32) * 0.14;
    pointer.y = Math.cos(time * 0.24) * 0.08;
    pointer.inside = false;
    applyDepth();
    if (time > nextDrop && rect.width) {
      nextDrop = time + 2.4 + Math.random() * 1.8;
      spawn(rect.width * (0.15 + Math.random() * 0.7), ch * (0.66 + Math.random() * 0.28), 0.9);
    }
  });
}

/* ---------- Time of day ---------- */
const modeBtns = qa<HTMLButtonElement>('[data-mode]');
function setMode(mode: 'dusk' | 'night') {
  root.dataset.mode = mode;
  modeBtns.forEach((b) => {
    const on = b.dataset.mode === mode;
    b.classList.toggle('is-on', on);
    b.setAttribute('aria-pressed', String(on));
  });
  gsap.to(root, { '--night': mode === 'night' ? 1 : 0, duration: reduce ? 0.01 : 1.8, ease: 'power2.inOut', overwrite: true });
}
modeBtns.forEach((b) => b.addEventListener('click', () => setMode(b.dataset.mode as 'dusk' | 'night')));

/* ---------- Navigation: a pill follows the pointer along the links; a menu button on small screens ---------- */
const nav = q('[data-nav]')!;
const pill = q('[data-pill]')!;
const links = qa<HTMLAnchorElement>('.nav__link', nav);
let active = links.find((l) => l.classList.contains('is-active')) || links[0];
function movePill(to: HTMLElement) {
  pill.style.width = `${to.offsetWidth}px`;
  pill.style.transform = `translateX(${to.offsetLeft}px)`;
  links.forEach((l) => l.classList.toggle('is-under', l === to));
}
function moveNav() { movePill(active); }
links.forEach((l) => {
  l.addEventListener('mouseenter', () => movePill(l));
  l.addEventListener('focus', () => movePill(l));
  l.addEventListener('click', (e) => {
    e.preventDefault();
    links.forEach((x) => { x.classList.remove('is-active'); x.removeAttribute('aria-current'); });
    l.classList.add('is-active');
    l.setAttribute('aria-current', 'page');
    active = l;
    movePill(l);
    nav.classList.remove('is-open');
    menuBtn?.setAttribute('aria-expanded', 'false');
  });
});
nav.addEventListener('mouseleave', () => movePill(active));
const menuBtn = q('[data-menu]');
menuBtn?.addEventListener('click', () => {
  const open = nav.classList.toggle('is-open');
  menuBtn.setAttribute('aria-expanded', String(open));
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') { nav.classList.remove('is-open'); menuBtn?.setAttribute('aria-expanded', 'false'); }
});

/* ---------- Glass cards tilt, and the button leans toward the pointer ---------- */
if (fine && !reduce) {
  qa('[data-tilt]').forEach((el) => {
    const rx = gsap.quickTo(el, 'rotationX', { duration: 0.5, ease: 'power3.out' });
    const ry = gsap.quickTo(el, 'rotationY', { duration: 0.5, ease: 'power3.out' });
    gsap.set(el, { transformPerspective: 700 });
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      ry(((e.clientX - r.left) / r.width - 0.5) * 14);
      rx(-((e.clientY - r.top) / r.height - 0.5) * 14);
    });
    el.addEventListener('pointerleave', () => { rx(0); ry(0); });
  });
  const magnet = q('[data-magnet]');
  if (magnet) {
    const mx = gsap.quickTo(magnet, 'x', { duration: 0.5, ease: 'power3.out' });
    const my = gsap.quickTo(magnet, 'y', { duration: 0.5, ease: 'power3.out' });
    window.addEventListener('pointermove', (e) => {
      const r = magnet.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      const near = Math.hypot(dx, dy) < 120;
      mx(near ? dx * 0.28 : 0);
      my(near ? dy * 0.28 : 0);
    }, { passive: true });
  }
}

/* ---------- Intro: the scene settles out of a soft blur, then the interface follows ---------- */
const counters = qa('[data-count]');
function intro() {
  const tl = gsap.timeline({ defaults: { ease: 'power2.out' } });
  const blurIn = (t: gsap.TweenTarget, blur: number, from: gsap.TweenVars, to: gsap.TweenVars, at: number) =>
    tl.fromTo(t, { opacity: 0, filter: `blur(${blur}px)`, ...from }, { opacity: 1, filter: 'blur(0px)', clearProps: 'filter', ...to }, at);

  blurIn(qa('.layer', scene)[0], 18, { scale: 1.1 }, { scale: 1, duration: 3 }, 0);
  letters.forEach((l, i) => l.els.forEach((el) => {
    tl.fromTo(el, { opacity: 0, yPercent: 16, filter: 'blur(22px)' }, { opacity: 1, yPercent: 0, filter: 'blur(0px)', clearProps: 'filter', duration: 2.1 }, 0.5 + i * 0.14);
  }));
  const home = q('.home', scene)!;
  blurIn(home, 14, { scale: 0.96, transformOrigin: '50% 100%' }, { scale: 1, duration: 2.6 }, 1.0);
  const ui = qa('[data-ui]');
  ui.forEach((el, i) => blurIn(el, 9, { y: 16 }, { y: 0, duration: 1.5 }, 1.9 + i * 0.12));
  counters.forEach((c) => {
    const target = parseInt(c.dataset.count || '0', 10);
    const o = { v: 0 };
    c.textContent = '0';
    tl.to(o, { v: target, duration: 2.2, ease: 'power2.out', onUpdate: () => { c.textContent = String(Math.round(o.v)); } }, 2.4);
  });
  return tl;
}

/* ---------- Start ---------- */
measure();
window.addEventListener('resize', measure);
document.fonts?.ready.then(measure);
setMode('dusk');
gsap.set(root, { '--night': 0 });

if (reduce) {
  moveNav();
} else {
  const imgs = qa<HTMLImageElement>('img', scene);
  const ready = Promise.all(imgs.map((i) => (i.decode ? i.decode().catch(() => undefined) : Promise.resolve())));
  Promise.race([ready, new Promise((r) => window.setTimeout(r, 2500))]).then(() => {
    measure();
    intro();
  });
}
