// Night mode: a few slow fireflies drifting over the page. Draws only while night is on and the tab is visible.
export function initFireflies(reduce: boolean): void {
  const c = document.getElementById('fireflies') as HTMLCanvasElement;
  const ctx = c.getContext('2d');
  if (!ctx || reduce) return;
  const dpr = Math.min(2, devicePixelRatio || 1);
  type F = { x: number; y: number; vx: number; vy: number; p: number; r: number };
  let flies: F[] = [];
  const resize = () => {
    c.width = innerWidth * dpr;
    c.height = innerHeight * dpr;
    const n = innerWidth < 700 ? 16 : 30;
    flies = Array.from({ length: n }, () => ({
      x: Math.random() * innerWidth, y: Math.random() * innerHeight,
      vx: (Math.random() - 0.5) * 0.25, vy: (Math.random() - 0.5) * 0.2, p: Math.random() * 6.28, r: 2 + Math.random() * 2.5,
    }));
  };
  resize();
  window.addEventListener('resize', resize);
  let raf = 0;
  const frame = (t: number) => {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    for (const f of flies) {
      f.x += f.vx + Math.sin(t / 2200 + f.p) * 0.18;
      f.y += f.vy + Math.cos(t / 2600 + f.p) * 0.14;
      if (f.x < -20) f.x = innerWidth + 20; if (f.x > innerWidth + 20) f.x = -20;
      if (f.y < -20) f.y = innerHeight + 20; if (f.y > innerHeight + 20) f.y = -20;
      const a = 0.35 + 0.65 * Math.max(0, Math.sin(t / 900 + f.p * 3));
      const g = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.r * 7);
      g.addColorStop(0, `rgba(255, 226, 140, ${0.9 * a})`);
      g.addColorStop(1, 'rgba(255, 226, 140, 0)');
      ctx.fillStyle = g;
      ctx.fillRect(f.x - f.r * 7, f.y - f.r * 7, f.r * 14, f.r * 14);
    }
    raf = requestAnimationFrame(frame);
  };
  const sync = () => {
    cancelAnimationFrame(raf);
    const cl = document.documentElement.classList;
    if ((cl.contains('night') || cl.contains('dusk')) && !document.hidden) raf = requestAnimationFrame(frame);
  };
  new MutationObserver(sync).observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  document.addEventListener('visibilitychange', sync);
  sync();
}
