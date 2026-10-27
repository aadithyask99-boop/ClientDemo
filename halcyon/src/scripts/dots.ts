/**
 * Dot-matrix headline. The text is rasterised once, sampled on a grid, and drawn as small squares. Dots in
 * the letters light up from left to right with scroll, and glow near the pointer.
 */
export function initDots(canvas: HTMLCanvasElement, section: HTMLElement) {
  const source: string[] = JSON.parse(canvas.dataset.lines ?? '[]');
  let lines = source;
  const ctx = canvas.getContext('2d');
  if (!ctx || !source.length) return { setProgress() {} };

  type Dot = { x: number; y: number; u: number; v: number };
  let dots: Dot[] = [];
  let W = 0;
  let H = 0;
  let dpr = 1;
  let progress = 0;
  let mx = -9999;
  let my = -9999;
  let queued = false;

  const build = () => {
    dpr = Math.min(window.devicePixelRatio, 2);
    W = canvas.clientWidth;
    H = canvas.clientHeight;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);

    // On a narrow screen, long lines break in two so the letters can be bigger
    lines = W < 700
      ? source.flatMap((l) => {
          if (l.length < 13 || !l.includes(' ')) return [l];
          const mid = l.length / 2;
          const at = [...l].map((c, i) => (c === ' ' ? i : -1)).filter((i) => i >= 0).sort((a, b) => Math.abs(a - mid) - Math.abs(b - mid))[0];
          return [l.slice(0, at), l.slice(at + 1)];
        })
      : source;

    // Size the text to fit, then draw it to an offscreen mask
    const mask = document.createElement('canvas');
    mask.width = W;
    mask.height = H;
    const m = mask.getContext('2d', { willReadFrequently: true })!;
    const probe = 100;
    m.font = `${probe}px Anton, Impact, sans-serif`;
    const widest = Math.max(...lines.map((l) => m.measureText(l).width));
    const size = Math.min((W * (W < 700 ? 0.78 : 0.64) * probe) / widest, (H * 0.6) / (lines.length * 1.04));
    m.font = `${size}px Anton, Impact, sans-serif`;
    m.textAlign = 'center';
    m.textBaseline = 'middle';
    m.fillStyle = '#fff';
    const lh = size * 1.06;
    const top = H / 2 - (lh * (lines.length - 1)) / 2;
    lines.forEach((l, i) => m.fillText(l, W / 2, top + i * lh));

    const step = W < 700 ? 5 : 7;
    const data = m.getImageData(0, 0, W, H).data;
    dots = [];
    for (let y = step / 2; y < H; y += step) {
      for (let x = step / 2; x < W; x += step) {
        if (data[((y | 0) * W + (x | 0)) * 4 + 3] > 128) dots.push({ x, y, u: x / W, v: y / H });
      }
    }
    draw();
  };

  const draw = () => {
    queued = false;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    const reach = 150;
    // A soft front sweeps across the letters as the section scrolls into view
    const front = progress * 1.35 - 0.2;
    for (const d of dots) {
      const lit = Math.max(0, Math.min(1, (front - d.u) * 5 + 0.0));
      const dx = d.x - mx;
      const dy = d.y - my;
      const near = Math.max(0, 1 - Math.hypot(dx, dy) / reach);
      const glow = near * near;
      const a = 0.13 + 0.5 * lit + 0.4 * glow;
      // Pale blue-white, shifting to a violet-teal glow under the pointer
      const r = Math.round(170 + 40 * glow + 60 * lit * 0.2);
      const g = Math.round(190 - 60 * glow + 40 * lit * 0.2);
      const b = Math.round(215 + 40 * glow);
      ctx.fillStyle = `rgba(${r},${g},${b},${Math.min(1, a).toFixed(3)})`;
      ctx.fillRect(d.x - 1.1, d.y - 1.1, 2.2, 2.2);
    }
  };
  const queue = () => { if (!queued) { queued = true; requestAnimationFrame(draw); } };

  section.addEventListener('pointermove', (e) => {
    const r = canvas.getBoundingClientRect();
    mx = e.clientX - r.left;
    my = e.clientY - r.top;
    queue();
  });
  section.addEventListener('pointerleave', () => { mx = my = -9999; queue(); });

  let t: number | undefined;
  window.addEventListener('resize', () => { clearTimeout(t); t = window.setTimeout(build, 200); });
  (document.fonts?.load('100px Anton') ?? Promise.resolve()).then(build, build);

  return { setProgress(p: number) { if (Math.abs(p - progress) < 0.004 && p !== 0 && p !== 1) return; progress = p; queue(); } };
}
