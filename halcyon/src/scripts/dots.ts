/**
 * Dot-matrix headline. The text is rasterised once and sampled on a grid. Dots in the letters light up from
 * left to right with scroll. The pointer pushes dots out of the way and leaves a coloured wake that fades,
 * and a click sends a ripple through the letters. Everything springs back into place.
 */
export function initDots(canvas: HTMLCanvasElement, section: HTMLElement) {
  const source: string[] = JSON.parse(canvas.dataset.lines ?? '[]');
  const ctx = canvas.getContext('2d');
  if (!ctx || !source.length) return { setProgress() {} };

  type Dot = { x: number; y: number; u: number; ox: number; oy: number; vx: number; vy: number };
  let dots: Dot[] = [];
  let lines = source;
  let W = 0;
  let H = 0;
  let dpr = 1;
  let progress = 0;
  let mx = -9999;
  let my = -9999;
  let inside = false;
  let lastMove = 0;
  let running = false;
  const trail: { x: number; y: number; t: number }[] = [];
  const ripples: { x: number; y: number; t: number }[] = [];
  const REACH = 130; // how far the pointer pushes and lights
  const TRAIL_MS = 900;
  const RIPPLE_MS = 1200;

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
        if (data[((y | 0) * W + (x | 0)) * 4 + 3] > 128) dots.push({ x, y, u: x / W, ox: 0, oy: 0, vx: 0, vy: 0 });
      }
    }
    kick();
  };

  const frame = (now: number) => {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);

    while (trail.length && now - trail[0].t > TRAIL_MS) trail.shift();
    while (ripples.length && now - ripples[0].t > RIPPLE_MS) ripples.shift();

    const front = progress * 1.35 - 0.2; // soft sweep across the letters as the section scrolls into view
    let moving = false;

    for (const d of dots) {
      // --- physics: the pointer and ripples push, a spring pulls back ---
      const px = d.x + d.ox;
      const py = d.y + d.oy;
      let glow = 0;
      let hue = 0;

      if (inside) {
        const dx = px - mx;
        const dy = py - my;
        const dist = Math.hypot(dx, dy);
        if (dist < REACH) {
          const f = (1 - dist / REACH) ** 2;
          const k = (f * 2.4) / (dist || 1);
          d.vx += dx * k;
          d.vy += dy * k;
          glow = Math.max(glow, f);
        }
      }
      for (const r of ripples) {
        const age = now - r.t;
        const radius = age * 0.5;
        const dist = Math.hypot(d.x - r.x, d.y - r.y);
        const band = 46;
        const off = Math.abs(dist - radius);
        if (off < band) {
          const f = (1 - off / band) * (1 - age / RIPPLE_MS);
          const k = (f * 1.6) / (dist || 1);
          d.vx += (d.x - r.x) * k;
          d.vy += (d.y - r.y) * k;
          glow = Math.max(glow, f);
        }
      }
      for (const p of trail) {
        const dist = Math.hypot(d.x - p.x, d.y - p.y);
        if (dist < 70) glow = Math.max(glow, (1 - dist / 70) * (1 - (now - p.t) / TRAIL_MS) * 0.9);
      }
      d.vx += -d.ox * 0.07;
      d.vy += -d.oy * 0.07;
      d.vx *= 0.82;
      d.vy *= 0.82;
      d.ox += d.vx;
      d.oy += d.vy;
      if (Math.abs(d.vx) + Math.abs(d.vy) + Math.abs(d.ox) + Math.abs(d.oy) > 0.05) moving = true;

      // --- colour: pale blue-white, with a violet-to-cyan wake where the pointer has been ---
      const lit = Math.max(0, Math.min(1, (front - d.u) * 5));
      const a = Math.min(1, 0.13 + 0.5 * lit + 0.55 * glow);
      if (glow > 0.02) {
        hue = 200 + 150 * (0.5 + 0.5 * Math.sin(now * 0.0017 + d.x * 0.011 + d.y * 0.007));
        ctx.fillStyle = `hsla(${hue | 0},95%,${64 + 14 * glow | 0}%,${a.toFixed(3)})`;
      } else {
        ctx.fillStyle = `rgba(172,192,216,${a.toFixed(3)})`;
      }
      const s = 2.2 + glow * 1.6;
      ctx.fillRect(d.x + d.ox - s / 2, d.y + d.oy - s / 2, s, s);
    }

    // Keep animating while anything is moving or the pointer is active; otherwise rest
    const active = moving || trail.length > 0 || ripples.length > 0 || (inside && now - lastMove < 1500);
    if (active) requestAnimationFrame(frame);
    else running = false;
  };
  function kick() {
    if (running) return;
    running = true;
    requestAnimationFrame(frame);
  }

  section.addEventListener('pointermove', (e) => {
    const r = canvas.getBoundingClientRect();
    mx = e.clientX - r.left;
    my = e.clientY - r.top;
    inside = true;
    lastMove = performance.now();
    trail.push({ x: mx, y: my, t: lastMove });
    if (trail.length > 28) trail.shift();
    kick();
  });
  section.addEventListener('pointerleave', () => { inside = false; kick(); });
  section.addEventListener('pointerdown', (e) => {
    const r = canvas.getBoundingClientRect();
    ripples.push({ x: e.clientX - r.left, y: e.clientY - r.top, t: performance.now() });
    kick();
  });

  let t: number | undefined;
  window.addEventListener('resize', () => { clearTimeout(t); t = window.setTimeout(build, 200); });
  (document.fonts?.load('100px Anton') ?? Promise.resolve()).then(build, build);

  return { setProgress(p: number) { if (Math.abs(p - progress) < 0.004 && p !== 0 && p !== 1) return; progress = p; kick(); } };
}
