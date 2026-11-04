import gsap from 'gsap';

const layer = () => document.getElementById('egg-layer') as HTMLElement;

/** Onam flower carpet: rings of petals bloom outward, then fade. */
export function pookalam(cx: number, cy: number) {
  const dpr = Math.min(devicePixelRatio || 1, 2);
  const c = document.createElement('canvas');
  c.width = innerWidth * dpr; c.height = innerHeight * dpr;
  layer().appendChild(c);
  const ctx = c.getContext('2d')!;
  ctx.scale(dpr, dpr);
  const colours = ['#f4f3ef', '#d94f7a', '#2fc25f', '#e8743b', '#ffffff'];
  const rings = Math.min(8, Math.floor(Math.min(innerWidth, innerHeight) / 100));
  const st = { p: 0 };
  const draw = () => {
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    for (let r = 1; r <= rings; r++) {
      const local = Math.min(1, Math.max(0, st.p * (rings + 1) - r + 1));
      if (local <= 0) continue;
      const radius = r * 46, n = 6 + r * 6, col = colours[(r - 1) % colours.length];
      for (let k = 0; k < n; k++) {
        const a = (k / n) * Math.PI * 2 + r * 0.3;
        ctx.save();
        ctx.translate(cx + Math.cos(a) * radius * local, cy + Math.sin(a) * radius * local);
        ctx.rotate(a);
        ctx.fillStyle = col;
        ctx.beginPath(); ctx.ellipse(0, 0, 16 * local, 6 * local, 0, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      }
    }
    ctx.fillStyle = '#f4f3ef'; ctx.beginPath(); ctx.arc(cx, cy, 14 * Math.min(1, st.p * 4), 0, Math.PI * 2); ctx.fill();
  };
  gsap.to(st, { p: 1, duration: 2.4, ease: 'power2.out', onUpdate: draw })
    .then(() => gsap.to(c, { opacity: 0, duration: 1.2, delay: 0.9 }))
    .then(() => c.remove());
}

/** Snake boat: a vallam with tiny oarsmen rows across the wave. */
export function boat(anchor: HTMLElement) {
  const r = anchor.getBoundingClientRect();
  const y = Math.min(innerHeight - 90, Math.max(60, r.top + r.height * 0.82));
  const NS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', '0 0 420 90'); svg.setAttribute('width', '420');
  svg.style.cssText = `position:absolute;left:0;top:${y - 70}px;overflow:visible`;
  let g = '<path d="M6 56 C40 66 120 70 210 70 C300 70 380 66 414 44 C410 56 395 62 380 64 C300 76 120 78 30 68 Z" fill="#12803a"/><path d="M414 44 C418 34 416 26 408 20" stroke="#12803a" stroke-width="5" fill="none" stroke-linecap="round"/>';
  for (let i = 0; i < 12; i++) {
    const x = 40 + i * 28;
    g += `<g class="oar"><circle cx="${x}" cy="40" r="7" fill="#f4f3ef"/><rect x="${x - 5}" y="46" width="10" height="16" rx="4" fill="#f4f3ef"/><line x1="${x}" y1="50" x2="${x - 14}" y2="84" stroke="#f4f3ef" stroke-width="3" stroke-linecap="round"/></g>`;
  }
  svg.innerHTML = g;
  layer().appendChild(svg);
  const wake = document.createElement('div');
  wake.style.cssText = `position:absolute;left:0;top:${y + 2}px;height:6px;width:260px;border-radius:6px;background:rgba(243,241,234,.5)`;
  layer().appendChild(wake);
  gsap.fromTo(svg, { x: -460 }, { x: innerWidth + 40, duration: 5.2, ease: 'power1.inOut', onComplete: () => svg.remove() });
  gsap.fromTo(wake, { x: -700, opacity: 0.8 }, { x: innerWidth - 120, opacity: 0, duration: 5.6, ease: 'power1.inOut', onComplete: () => wake.remove() });
  svg.querySelectorAll('.oar').forEach((o, i) => gsap.to(o, { rotation: 10, transformOrigin: '50% 40px', duration: 0.28, yoyo: true, repeat: 18, delay: i * 0.02, ease: 'sine.inOut', svgOrigin: undefined }));
}

/** Kingfisher: perches at the right edge after a quiet spell; click it and it dives. */
let bird: HTMLElement | null = null;
export function kingfisher() {
  if (bird) return;
  const x = Math.max(20, innerWidth - 120), y = Math.max(90, innerHeight * 0.62);
  bird = document.createElement('button');
  bird.setAttribute('aria-label', 'A kingfisher. Click to watch it dive.');
  bird.style.cssText = `position:absolute;left:${x}px;top:${y}px;width:52px;height:44px;padding:0;border:0;background:none;cursor:pointer;pointer-events:auto`;
  bird.innerHTML = '<svg viewBox="0 0 52 44" width="52" height="44"><ellipse cx="24" cy="24" rx="16" ry="11" fill="#1d8fa3"/><ellipse cx="24" cy="30" rx="12" ry="6" fill="#ee9a4d"/><circle cx="38" cy="16" r="9" fill="#1d8fa3"/><path d="M45 15 L58 18 L45 20 Z" fill="#2c2623"/><circle cx="40" cy="14" r="1.6" fill="#fff"/><path d="M10 26 L0 38" stroke="#2c2623" stroke-width="3" stroke-linecap="round"/></svg>';
  layer().appendChild(bird);
  const b = bird;
  gsap.from(b, { x: 120, y: -120, opacity: 0, duration: 0.9, ease: 'power3.out' });
  const leave = () => gsap.to(b, { x: -200, y: -160, opacity: 0, duration: 0.9, ease: 'power2.in', onComplete: () => { b.remove(); bird = null; } });
  const t = window.setTimeout(leave, 9000);
  b.addEventListener('click', () => {
    clearTimeout(t);
    const ring = (d: number) => {
      const o = document.createElement('div');
      o.style.cssText = `position:absolute;left:${x + 26}px;top:${y + 150}px;width:20px;height:20px;margin:-10px;border:2px solid #f4f3ef;border-radius:50%`;
      layer().appendChild(o);
      gsap.to(o, { scale: 7, opacity: 0, duration: 1.4, delay: d, ease: 'power2.out', onComplete: () => o.remove() });
    };
    gsap.timeline()
      .to(b, { y: 150, rotation: 20, duration: 0.45, ease: 'power2.in' })
      .call(() => { ring(0); ring(0.25); ring(0.5); })
      .to(b, { opacity: 0, duration: 0.2 })
      .call(() => { b.remove(); bird = null; });
  });
}

/** Monsoon: a shower fills the photograph for a few seconds, then clears. */
export function shower(host: HTMLElement) {
  const c = document.createElement('canvas');
  const r = host.getBoundingClientRect();
  const w = Math.round(r.width), h = Math.round(r.height);
  c.width = w; c.height = h;
  c.style.cssText = `position:absolute;left:${r.left}px;top:${r.top}px;width:${w}px;height:${h}px`;
  layer().appendChild(c);
  const ctx = c.getContext('2d')!;
  const drops = Array.from({ length: 520 }, () => ({ x: Math.random() * w, y: Math.random() * h, v: 700 + Math.random() * 600, l: 14 + Math.random() * 26 }));
  const st = { a: 0 };
  let last = performance.now();
  const step = () => {
    const now = performance.now(), dt = Math.min(0.05, (now - last) / 1000); last = now;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = `rgba(20,36,30,${0.28 * st.a})`; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = `rgba(235,245,240,${0.55 * st.a})`; ctx.lineWidth = 1.4; ctx.beginPath();
    for (const d of drops) { d.y += d.v * dt; d.x -= d.v * dt * 0.12; if (d.y > h) { d.y = -20; d.x = Math.random() * (w + 80); } ctx.moveTo(d.x, d.y); ctx.lineTo(d.x - d.l * 0.12, d.y + d.l); }
    ctx.stroke();
  };
  gsap.ticker.add(step);
  gsap.timeline()
    .to(st, { a: 1, duration: 0.8, ease: 'power2.out' })
    .to(st, { a: 0, duration: 1.8, delay: 2.4, ease: 'power2.in' })
    .call(() => { gsap.ticker.remove(step); c.remove(); });
}
