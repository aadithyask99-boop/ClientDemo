// Night mode: a few slow fireflies drifting over the page. Draws only while night is on and the tab is visible.
// Performance notes: the glow is drawn once and reused (building a gradient per firefly per frame was the biggest cost on
// phones), there are few of them, they update at most 30 times a second, and a change in the screen's height (a phone's
// address bar) only refits the canvas; it never respawns them.
export function initFireflies(reduce: boolean): void {
  const c = document.getElementById('fireflies') as HTMLCanvasElement;
  const ctx = c.getContext('2d');
  if (!ctx || reduce) return;
  const coarse = matchMedia('(pointer: coarse)').matches;
  const dpr = Math.min(coarse ? 1 : 1.5, devicePixelRatio || 1);

  const glow = document.createElement('canvas');
  glow.width = glow.height = 64;
  const g = glow.getContext('2d')!;
  const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, 'rgba(255, 226, 140, 0.95)');
  gr.addColorStop(0.35, 'rgba(255, 226, 140, 0.35)');
  gr.addColorStop(1, 'rgba(255, 226, 140, 0)');
  g.fillStyle = gr;
  g.fillRect(0, 0, 64, 64);

  type F = { x: number; y: number; vx: number; vy: number; p: number; r: number };
  let flies: F[] = [];
  let W = 0;
  let H = 0;
  const fit = () => { W = innerWidth; H = innerHeight; c.width = W * dpr; c.height = H * dpr; };
  fit();
  let lastW = W;
  flies = Array.from({ length: coarse ? 9 : 16 }, () => ({
    x: Math.random() * W, y: Math.random() * H,
    vx: (Math.random() - 0.5) * 0.25, vy: (Math.random() - 0.5) * 0.2, p: Math.random() * 6.28, r: 2 + Math.random() * 2.5,
  }));
  addEventListener('resize', () => {
    if (innerWidth !== lastW) { const k = innerWidth / lastW; flies.forEach((f) => { f.x *= k; }); lastW = innerWidth; }
    fit();
  });

  let raf = 0;
  let last = 0;
  const frame = (t: number) => {
    raf = requestAnimationFrame(frame);
    if (t - last < 33) return; // 30 fps is plenty for a slow glow
    const k = Math.min(3, (t - last) / 16.7);
    last = t;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    for (const f of flies) {
      f.x += (f.vx + Math.sin(t / 2200 + f.p) * 0.18) * k;
      f.y += (f.vy + Math.cos(t / 2600 + f.p) * 0.14) * k;
      if (f.x < -20) f.x = W + 20; else if (f.x > W + 20) f.x = -20;
      if (f.y < -20) f.y = H + 20; else if (f.y > H + 20) f.y = -20;
      ctx.globalAlpha = 0.35 + 0.65 * Math.max(0, Math.sin(t / 900 + f.p * 3));
      const s = f.r * 7;
      ctx.drawImage(glow, f.x - s, f.y - s, s * 2, s * 2);
    }
    ctx.globalAlpha = 1;
  };
  const sync = () => {
    cancelAnimationFrame(raf);
    const cl = document.documentElement.classList;
    if ((cl.contains('night') || cl.contains('dusk')) && !cl.contains('lite') && !document.hidden) raf = requestAnimationFrame(frame);
  };
  new MutationObserver(sync).observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  document.addEventListener('visibilitychange', sync);
  sync();
}
