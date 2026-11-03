// Ink blobs: wobbly circles whose edge never repeats, used for every reveal on the page.
export function blobPoints(cx: number, cy: number, r: number, seed: number, n = 48): [number, number][] {
  const pts: [number, number][] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const k = 1 + 0.2 * Math.sin(a * 3 + seed * 1.7) + 0.13 * Math.sin(a * 5 + seed * 3.1) + 0.07 * Math.sin(a * 9 + seed * 5.3);
    pts.push([cx + Math.cos(a) * r * k, cy + Math.sin(a) * r * k]);
  }
  return pts;
}
export const blobClip = (cx: number, cy: number, r: number, seed: number) =>
  'polygon(' + blobPoints(cx, cy, r, seed).map(([x, y]) => `${x.toFixed(1)}px ${y.toFixed(1)}px`).join(',') + ')';

type Drop = { x: number; y: number; R: number; t0: number; dur: number; seed: number };
const outCubic = (t: number) => 1 - Math.pow(1 - t, 2.2);

/** Ink curtain over the hero: black ink is lifted away by drops that bleed outward. */
export function inkCurtain(canvas: HTMLCanvasElement, onDone: () => void) {
  const ctx = canvas.getContext('2d')!;
  const scale = 0.5;
  let w = 0, h = 0;
  const size = () => {
    const r = canvas.getBoundingClientRect();
    w = Math.max(2, Math.round(r.width * scale));
    h = Math.max(2, Math.round(r.height * scale));
    canvas.width = w; canvas.height = h;
    ctx.fillStyle = '#0f0a07'; ctx.fillRect(0, 0, w, h);
  };
  size();
  const diag = Math.hypot(w, h);
  const drops: Drop[] = [];
  const add = (x: number, y: number, R: number, t0: number, dur: number) => drops.push({ x: x * w, y: y * h, R, t0, dur, seed: Math.random() * 20 });
  // the first drop falls on the face, the rest follow and join
  add(0.5, 0.42, diag * 0.3, 0.2, 3.6);
  add(0.26, 0.55, diag * 0.3, 0.9, 3.8);
  add(0.76, 0.4, diag * 0.3, 1.2, 3.8);
  add(0.5, 0.92, diag * 0.34, 1.7, 3.6);
  add(0.12, 0.1, diag * 0.32, 2.0, 3.4);
  add(0.92, 0.9, diag * 0.32, 2.3, 3.4);
  add(0.55, 0.04, diag * 0.32, 2.6, 3.2);

  const start = performance.now();
  let raf = 0, done = false;
  const draw = (now: number) => {
    const t = (now - start) / 1000;
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillStyle = '#000';
    for (const d of drops) {
      const p = Math.min(1, Math.max(0, (t - d.t0) / d.dur));
      if (p <= 0) continue;
      const r = d.R * outCubic(p);
      const pts = blobPoints(d.x, d.y, r, d.seed);
      ctx.beginPath();
      pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
      ctx.closePath(); ctx.fill();
    }
    if (t > 6.2 && !done) {
      done = true;
      canvas.style.transition = 'opacity .5s'; canvas.style.opacity = '0';
      setTimeout(() => { canvas.remove(); }, 600);
      onDone();
      return;
    }
    raf = requestAnimationFrame(draw);
  };
  raf = requestAnimationFrame(draw);

  // the pointer lifts ink too, so the visitor is part of the reveal
  let last = 0, lx = 0, ly = 0;
  const move = (e: PointerEvent) => {
    if (done) return;
    const r = canvas.getBoundingClientRect();
    const x = (e.clientX - r.left) * scale, y = (e.clientY - r.top) * scale;
    const now = performance.now();
    if (now - last < 70 || Math.hypot(x - lx, y - ly) < 18) return;
    last = now; lx = x; ly = y;
    drops.push({ x, y, R: 70 + Math.random() * 60, t0: (now - start) / 1000, dur: 0.9, seed: Math.random() * 20 });
  };
  canvas.parentElement!.addEventListener('pointermove', move);
  return () => { cancelAnimationFrame(raf); };
}
