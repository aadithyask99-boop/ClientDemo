// Ambient life: embroidered petals drifting down on a wind that you can feel. Scrolling fast stirs a gust,
// moving the pointer (or dragging a finger) pushes them aside, and tapping one catches it.
import gsap from 'gsap';
import { chime } from './audio';
import { petals as shower, toast } from './eggs';

const base = import.meta.env.BASE_URL.replace(/\/$/, '');
const SPRITES = [0, 1, 2, 3, 4, 5].map((i) => `${base}/art/petal-${i}.webp`);

interface P {
  x: number; y: number; z: number; s: number; r: number; vr: number;
  ph: number; sp: number; fl: number; fs: number; vy: number; ix: number; iy: number; k: number; turb: number; temp: boolean;
}
export interface Atmosphere { gust: (n: number) => void; spawn: (x: number, y: number, n: number) => void }

export function initAtmosphere(reduce: boolean): Atmosphere {
  const none: Atmosphere = { gust() {}, spawn() {} };
  const canvas = document.getElementById('petals') as HTMLCanvasElement | null;
  const ctx = canvas?.getContext('2d');
  if (!canvas || !ctx || reduce) return none;

  const imgs: HTMLImageElement[] = SPRITES.map((src) => { const i = new Image(); i.decoding = 'async'; i.src = src; return i; });
  const dpr = Math.min(2, devicePixelRatio || 1);
  let W = 0;
  let H = 0;
  let parts: P[] = [];
  let gustV = 0;
  let caught = 0;

  const make = (fromTop: boolean, temp = false, x?: number, y?: number): P => {
    const z = 0.55 + Math.random() * 0.65;
    const small = W < 700 ? 0.8 : 1;
    return {
      x: x ?? Math.random() * (W + 120) - 60, y: y ?? (fromTop ? -60 - Math.random() * 120 : Math.random() * H),
      z, s: (26 + Math.random() * 20) * z * small, r: Math.random() * 6.28, vr: (Math.random() - 0.5) * 1.6,
      ph: Math.random() * 6.28, sp: 0.6 + Math.random() * 0.8, fl: Math.random() * 6.28, fs: 1.2 + Math.random() * 2,
      vy: (34 + Math.random() * 34) * z, ix: 0, iy: 0, k: Math.floor(Math.random() * SPRITES.length), turb: 0.6 + Math.random() * 0.8, temp,
    };
  };
  const resize = () => {
    W = innerWidth;
    H = innerHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    const n = W < 700 ? 11 : 20;
    parts = Array.from({ length: n }, () => make(false));
  };
  resize();
  addEventListener('resize', resize);

  // scroll speed becomes wind
  let lastY = scrollY;
  let lastT = performance.now();
  addEventListener('scroll', () => {
    const now = performance.now();
    const v = Math.abs(scrollY - lastY) / Math.max(16, now - lastT);
    gustV = Math.min(2.2, gustV + v * 0.35);
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
    for (const p of parts) {
      if (p.temp && p.y < 0) continue;
      if (Math.hypot(p.x - e.clientX, p.y - e.clientY) < p.s * 0.8 + 12) {
        caught++;
        chime(2 + (caught % 6), 0.8);
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
  const frame = (t: number) => {
    const dt = Math.min(0.05, (t - last) / 1000);
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
    raf = requestAnimationFrame(frame);
  };
  const run = () => { cancelAnimationFrame(raf); if (!document.hidden) { last = performance.now(); raf = requestAnimationFrame(frame); } };
  document.addEventListener('visibilitychange', run);
  run();

  return { gust: (n) => { gustV = Math.min(2.2, gustV + n); }, spawn };
}
