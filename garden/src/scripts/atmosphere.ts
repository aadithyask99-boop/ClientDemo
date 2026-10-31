// Ambient life: embroidered petals drifting down on a wind that you can feel. Scrolling fast stirs a gust,
// moving the pointer (or dragging a finger) pushes them aside, and tapping one catches it.
import gsap from 'gsap';
import { petals as shower, toast } from './eggs';

const base = import.meta.env.BASE_URL.replace(/\/$/, '');
// six petals and leaves, plus three more leaves from the butterfly sheet
const SPRITES = [...[0, 1, 2, 3, 4, 5].map((i) => `${base}/art/petal-${i}.webp`), ...[3, 4, 5].map((i) => `${base}/art/fly-${i}.webp`)];
const BUTTERFLIES = [0, 1, 2].map((i) => `${base}/art/fly-${i}.webp`);

interface P {
  x: number; y: number; z: number; s: number; r: number; vr: number;
  ph: number; sp: number; fl: number; fs: number; vy: number; ix: number; iy: number; k: number; turb: number; temp: boolean;
}
interface B { x: number; y: number; vx: number; vy: number; tx: number; ty: number; nt: number; k: number; s: number; fl: number; flee: number }
export interface Atmosphere { gust: (n: number) => void; spawn: (x: number, y: number, n: number) => void }

export function initAtmosphere(reduce: boolean): Atmosphere {
  const none: Atmosphere = { gust() {}, spawn() {} };
  const canvas = document.getElementById('petals') as HTMLCanvasElement | null;
  const ctx = canvas?.getContext('2d');
  if (!canvas || !ctx || reduce) return none;

  const imgs: HTMLImageElement[] = SPRITES.map((src) => { const i = new Image(); i.decoding = 'async'; i.src = src; return i; });
  const bimgs: HTMLImageElement[] = BUTTERFLIES.map((src) => { const i = new Image(); i.decoding = 'async'; i.src = src; return i; });
  const fine = matchMedia('(pointer: fine)').matches;
  const dpr = Math.min(fine ? 1.5 : 1.25, devicePixelRatio || 1);
  let W = 0;
  let H = 0;
  let parts: P[] = [];
  let gustV = 0;
  let caught = 0;
  let bfs: B[] = [];
  let lastMove = 0;
  let tapX = 0;
  let tapY = 0;
  let tapT = -1e9;

  const make = (fromTop: boolean, temp = false, x?: number, y?: number): P => {
    const z = 0.55 + Math.random() * 0.65;
    const small = W < 700 ? 0.8 : 1;
    return {
      x: x ?? Math.random() * (W + 120) - 60, y: y ?? (fromTop ? -60 - Math.random() * 120 : Math.random() * H),
      z, s: (26 + Math.random() * 20) * z * small, r: Math.random() * 6.28, vr: (Math.random() - 0.5) * 1.6,
      ph: Math.random() * 6.28, sp: 0.6 + Math.random() * 0.8, fl: Math.random() * 6.28, fs: 1.2 + Math.random() * 2,
      vy: (24 + Math.random() * 22) * z, ix: 0, iy: 0, k: Math.floor(Math.random() * SPRITES.length), turb: 0.6 + Math.random() * 0.8, temp,
    };
  };
  let lastW = 0;
  // petals and butterflies are only created once; a change in the screen's height (a phone's address bar sliding away as you
  // scroll) just refits the canvas, and a change in width rescales their positions. They never respawn, so nothing jumps.
  const resize = () => {
    const first = !W;
    W = innerWidth;
    H = innerHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    if (!first) {
      if (W !== lastW) { const k = W / lastW; parts.forEach((p) => { p.x *= k; }); bfs.forEach((b) => { b.x *= k; b.tx *= k; }); }
      lastW = W;
      return;
    }
    lastW = W;
    const n = W < 700 ? 8 : 20;
    parts = Array.from({ length: n }, () => make(false));
    bfs = Array.from({ length: W < 700 ? 2 : 4 }, (_, i) => ({ x: Math.random() * W, y: H * 0.25 + Math.random() * H * 0.5, vx: 0, vy: 0, tx: Math.random() * W, ty: Math.random() * H * 0.7, nt: 0, k: i % 3, s: W < 700 ? 34 : 46, fl: Math.random() * 6, flee: 0 }));
  };
  resize();
  addEventListener('resize', resize);

  // scroll speed becomes wind
  let lastY = scrollY;
  let lastT = performance.now();
  addEventListener('scroll', () => {
    const now = performance.now();
    const v = Math.abs(scrollY - lastY) / Math.max(16, now - lastT);
    gustV = Math.min(1.6, gustV + v * 0.22);
    lastY = scrollY;
    lastT = now;
  }, { passive: true });

  // pointer pushes petals aside
  let px = -999;
  let py = -999;
  addEventListener('pointermove', (e) => {
    const dx = e.clientX - px;
    const dy = e.clientY - py;
    px = e.clientX;
    py = e.clientY;
    if (e.pointerType === 'mouse') lastMove = performance.now();
    if (Math.abs(dx) + Math.abs(dy) > 120) return;
    for (const p of parts) {
      const d = Math.hypot(p.x - px, p.y - py);
      if (d < 130) { const f = (1 - d / 130) * 0.9; p.ix += dx * f * 4; p.iy += dy * f * 4; p.vr += dx * f * 0.02; }
    }
  }, { passive: true });

  const spawn = (x: number, y: number, n: number) => {
    for (let i = 0; i < n && parts.length < 60; i++) {
      const p = make(false, true, x + (Math.random() - 0.5) * 30, y + (Math.random() - 0.5) * 20);
      p.ix = (Math.random() - 0.5) * 260;
      p.iy = -80 - Math.random() * 120;
      p.vr = (Math.random() - 0.5) * 6;
      parts.push(p);
    }
  };

  // tap a petal to catch it; tap empty paper to scatter a few
  addEventListener('pointerdown', (e) => {
    const t = e.target as HTMLElement | null;
    tapX = e.clientX;
    tapY = e.clientY;
    tapT = performance.now();
    for (const b of bfs) {
      if (Math.hypot(b.x - e.clientX, b.y - e.clientY) < b.s * 0.9) {
        b.flee = 1.5;
        b.tx = b.x + (b.x - e.clientX) * 8 + (Math.random() - 0.5) * 300;
        b.ty = Math.max(40, b.y - 160 - Math.random() * 220);
        b.vx += (b.x - e.clientX) * 6;
        b.vy -= 220;
        spawn(b.x, b.y, 3);
        return;
      }
    }
    for (const p of parts) {
      if (p.temp && p.y < 0) continue;
      if (Math.hypot(p.x - e.clientX, p.y - e.clientY) < p.s * 0.8 + 12) {
        caught++;
        spawn(p.x, p.y, 4);
        Object.assign(p, make(true));
        if (caught === 8) toast('Eight petals. Make a wish.');
        if (caught === 16) { toast('You have caught sixteen. Here is a shower.', 4200); shower(50); }
        return;
      }
    }
    if (t && !t.closest('button, a, input, textarea, label, .hoop-stage, .ring-egg')) spawn(e.clientX, e.clientY, 3);
  }, { passive: true });

  // the garland and roses sway in the same breeze
  const sway = (sel: string, origin: string, deg: number, dur: number) => {
    const el = document.querySelector<HTMLElement>(`${sel} > img`);
    if (el) gsap.fromTo(el, { rotation: -deg, transformOrigin: origin }, { rotation: deg, transformOrigin: origin, duration: dur, ease: 'sine.inOut', yoyo: true, repeat: -1 });
  };
  sway('.garland', '50% 0%', 1.3, 4.2);
  sway('.roses', '50% 100%', 0.7, 5.1);

  // now and then a gust blows through on its own
  const autoGust = () => { gustV = Math.min(2.2, gustV + 1.1); setTimeout(autoGust, 9000 + Math.random() * 9000); };
  setTimeout(autoGust, 4000);

  let raf = 0;
  let last = performance.now();
  // Adaptive quality: on a device that cannot keep up, drop the heavy full-screen layers rather than stutter.
  let slow = 0;
  let lite = false;
  const frame = (t: number) => {
    if (!fine && t - last < 30) { raf = requestAnimationFrame(frame); return; } // phones: 30 fps (calmer and cheaper)
    const raw = t - last;
    if (!lite) {
      slow = raw > 38 ? slow + 1 : Math.max(0, slow - 2);
      if (slow > 90) {
        lite = true;
        document.documentElement.classList.add('lite');
        parts.length = Math.min(parts.length, 8);
        bfs.length = Math.min(bfs.length, 2);
      }
    }
    const dt = Math.min(0.05, raw / 1000);
    last = t;
    gustV *= Math.exp(-dt * 0.9);
    const calm = 0.25 + 0.35 * Math.sin(t / 7000);
    const night = document.documentElement.classList.contains('night');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      const sway = Math.sin(t * 0.0011 * p.sp + p.ph) * 22 * p.z;
      const target = (calm * 38 + gustV * 150 * p.turb) * p.z + sway;
      p.ix *= Math.exp(-dt * 2.4);
      p.iy *= Math.exp(-dt * 2.4);
      p.x += (target + p.ix) * dt;
      p.y += (p.vy * (1 - Math.min(0.5, gustV * 0.15)) + p.iy) * dt;
      p.r += (p.vr + gustV * 1.2 * p.turb) * dt;
      p.fl += p.fs * dt;
      if (p.y > H + 60 || p.x < -140 || p.x > W + 140) {
        if (p.temp) { parts.splice(i, 1); continue; }
        Object.assign(p, make(true));
      }
      const img = imgs[p.k];
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.r);
      ctx.scale(1, 0.35 + 0.65 * Math.abs(Math.cos(p.fl)));
      ctx.globalAlpha = (0.5 + 0.4 * p.z) * (night ? 0.7 : 1);
      if (img.complete && img.naturalWidth) ctx.drawImage(img, -p.s / 2, -p.s / 2, p.s, (p.s * img.naturalHeight) / img.naturalWidth);
      ctx.restore();
    }
    // butterflies: they wander, drift toward the pointer (or your last tap) and scatter when touched
    for (const b of bfs) {
      b.nt -= dt;
      const attract = fine && t - lastMove < 2600 ? { x: px, y: py } : t - tapT < 3800 ? { x: tapX, y: tapY } : null;
      if (b.flee > 0) b.flee -= dt;
      else if (attract && Math.hypot(attract.x - b.x, attract.y - b.y) < 560) {
        b.tx = attract.x + Math.cos(t / 700 + b.k * 2) * 70;
        b.ty = attract.y + Math.sin(t / 560 + b.k * 2) * 50;
      } else if (b.nt <= 0) {
        b.tx = Math.random() * W;
        b.ty = H * 0.12 + Math.random() * H * 0.72;
        b.nt = 1.6 + Math.random() * 2.4;
      }
      b.vx += ((b.tx - b.x) * 1.05 + Math.sin(t / 320 + b.k) * 30) * dt;
      b.vy += ((b.ty - b.y) * 1.05 + Math.cos(t / 270 + b.k) * 30) * dt;
      const damp = Math.exp(-dt * (b.flee > 0 ? 1.1 : 2.3));
      b.vx *= damp;
      b.vy *= damp;
      const sp = Math.hypot(b.vx, b.vy);
      const cap = b.flee > 0 ? 420 : 150;
      if (sp > cap) { b.vx *= cap / sp; b.vy *= cap / sp; }
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.fl += dt * (11 + sp * 0.03);
      const im = bimgs[b.k];
      if (!(im.complete && im.naturalWidth)) continue;
      ctx.save();
      ctx.translate(b.x, b.y);
      ctx.rotate(Math.atan2(b.vy, b.vx) + Math.PI / 2);
      ctx.scale(0.28 + 0.72 * Math.abs(Math.cos(b.fl)), 1);
      ctx.globalAlpha = night ? 0.75 : 0.96;
      ctx.drawImage(im, -b.s / 2, -b.s / 2, b.s, (b.s * im.naturalHeight) / im.naturalWidth);
      ctx.restore();
    }
    raf = requestAnimationFrame(frame);
  };
  const run = () => { cancelAnimationFrame(raf); if (!document.hidden) { last = performance.now(); raf = requestAnimationFrame(frame); } };
  document.addEventListener('visibilitychange', run);
  run();

  return { gust: (n) => { gustV = Math.min(2.2, gustV + n); }, spawn };
}
