import { eqSource } from './player';

const canvas = document.querySelector<HTMLCanvasElement>('[data-eq]');
const ctx = canvas?.getContext('2d');
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

if (canvas && ctx) {
  const BAR = 4;
  const GAP = 6;
  let w = 0;
  let h = 0;
  let n = 0;
  let level: number[] = [];
  const buf = new Uint8Array(128);
  let raf = 0;
  let visible = false;

  const size = () => {
    const r = canvas.getBoundingClientRect();
    const dpr = Math.min(devicePixelRatio || 1, 2);
    w = r.width;
    h = r.height;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    n = Math.max(8, Math.floor((w + GAP) / (BAR + GAP)));
    level = new Array(n).fill(0.05);
  };

  // Target height (0 to 1) for each bar at time t
  const target = (t: number, real: boolean, playing: boolean): number[] => {
    const out = new Array(n);
    if (!playing) {
      for (let i = 0; i < n; i++) out[i] = 0.05 + 0.035 * (0.5 + 0.5 * Math.sin(t * 0.9 + i * 0.45));
      return out;
    }
    if (real) {
      const top = Math.min(eqSource.size() || 128, 64);
      for (let i = 0; i < n; i++) {
        // spread the bars over the useful part of the spectrum, bass on the left
        const f = Math.pow(i / (n - 1), 1.35);
        const k = Math.min(top - 1, Math.floor(f * top));
        out[i] = Math.max(0.05, Math.pow(buf[k] / 255, 1.45));
      }
      return out;
    }
    const beat = Math.pow(Math.max(0, Math.cos(t * Math.PI * 4)), 6);
    for (let i = 0; i < n; i++) {
      const x = i / n;
      const wave = 0.5 + 0.5 * Math.sin(t * (2.2 + x * 5) + i * 0.9);
      const body = 0.18 + 0.4 * wave * (1 - 0.55 * x);
      out[i] = Math.min(1, body + beat * (0.4 * (1 - x)));
    }
    return out;
  };

  const draw = (ms: number) => {
    const t = ms / 1000;
    const playing = eqSource.playing();
    const real = playing && eqSource.bins(buf);
    const tg = target(t, real, playing);
    ctx.clearRect(0, 0, w, h);
    const grad = ctx.createLinearGradient(0, h, 0, 0);
    grad.addColorStop(0, 'rgba(214,174,82,0.15)');
    grad.addColorStop(0.55, 'rgba(214,174,82,0.85)');
    grad.addColorStop(1, 'rgba(242,224,168,1)');
    ctx.fillStyle = grad;
    const used = n * BAR + (n - 1) * GAP;
    const x0 = (w - used) / 2;
    for (let i = 0; i < n; i++) {
      const up = tg[i] > level[i];
      level[i] += (tg[i] - level[i]) * (up ? 0.45 : 0.12);
      const bh = Math.max(3, level[i] * h);
      const x = x0 + i * (BAR + GAP);
      const y = h - bh;
      ctx.beginPath();
      if (typeof ctx.roundRect === 'function') ctx.roundRect(x, y, BAR, bh, 2);
      else ctx.rect(x, y, BAR, bh);
      ctx.fill();
    }
    if (visible && !reduce) raf = requestAnimationFrame(draw);
  };

  const start = () => {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(draw);
  };

  size();
  addEventListener('resize', () => { size(); if (reduce || !visible) draw(0); });
  new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    if (visible) start();
    else cancelAnimationFrame(raf);
  }).observe(canvas);
  draw(0);
}
