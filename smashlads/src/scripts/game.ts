// The footer game: ingredients are tossed up, swipe across them to slice them in two, avoid the bombs.
type Kind = 'patty' | 'tomato' | 'lettuce' | 'cheese' | 'onion' | 'pickle' | 'bomb';
type Item = { k: Kind; x: number; y: number; vx: number; vy: number; r: number; rot: number; vr: number; s: number; alive: boolean };
type Half = { k: Kind; x: number; y: number; vx: number; vy: number; rot: number; vr: number; s: number; ang: number; side: 1 | -1; life: number };
type Dot = { x: number; y: number; vx: number; vy: number; life: number; c: string };
const JUICE: Record<Kind, string> = { patty: '#8A3A2A', tomato: '#E23B2E', lettuce: '#67B346', cheese: '#FFB400', onion: '#EADCF5', pickle: '#7BA43A', bomb: '#FF5A1F' };
const FOODS: Kind[] = ['patty', 'tomato', 'lettuce', 'cheese', 'onion', 'pickle'];

export function initGame(reduce: boolean) {
  const foot = document.querySelector('[data-foot]') as HTMLElement | null;
  const cv = document.querySelector('[data-canvas]') as HTMLCanvasElement | null;
  if (!foot || !cv) return;
  const ctx = cv.getContext('2d')!;
  const $ = (s: string) => foot.querySelector(s) as HTMLElement;
  const msg = $('[data-gmsg]'), title = $('[data-gtitle]'), sub = $('[data-gsub]'), scoreEl = $('[data-score]'), bestEl = $('[data-best]');
  const hearts = Array.from(foot.querySelectorAll('[data-lives] svg')) as SVGElement[];
  const sprites: Partial<Record<Kind, HTMLImageElement>> = {};
  (document.querySelectorAll('[data-sprite]') as NodeListOf<HTMLImageElement>).forEach((im) => { sprites[im.dataset.sprite as Kind] = im; });

  let W = 0, H = 0, dpr = 1;
  const resize = () => { dpr = Math.min(2, devicePixelRatio || 1); const r = foot.getBoundingClientRect(); W = r.width; H = r.height; cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); };
  resize(); addEventListener('resize', resize);

  let state: 'ready' | 'live' | 'over' = 'ready';
  let score = 0, lives = 3, best = 0, visible = false, spawnT = 0, elapsed = 0, shake = 0, flash = 0;
  try { best = parseInt(localStorage.getItem('sl-best') || '0', 10) || 0; } catch (e) { /* storage blocked */ }
  bestEl.textContent = String(best);
  let items: Item[] = [], halves: Half[] = [], dots: Dot[] = [], trail: { x: number; y: number; t: number }[] = [];
  const small = () => W < 700;
  const size = () => (small() ? W * 0.24 : Math.min(W * 0.1, 170));
  const G = () => H * 1.5; // gravity in px/s^2

  const setHud = () => { scoreEl.textContent = String(score); hearts.forEach((h, i) => h.classList.toggle('is-lost', i >= lives)); };
  function say(t: string, s: string, show = true) { title.textContent = t; sub.textContent = s; msg.classList.toggle('is-hidden', !show); }
  function reset() {
    items = []; halves = []; dots = []; trail = []; score = 0; lives = 3; spawnT = 0; elapsed = 0; shake = 0; flash = 0; state = 'ready'; cv.classList.remove('is-live');
    setHud(); say('Tap to play', 'Then swipe across the ingredients. Dodge the bombs.');
  }
  function end(why: string) {
    state = 'over'; cv.classList.remove('is-live');
    if (score > best) { best = score; bestEl.textContent = String(best); try { localStorage.setItem('sl-best', String(best)); } catch (e) { /* ignore */ } }
    say(why, `You sliced ${score}. Press Reset to go again.`);
  }
  function toss(kind: Kind) {
    const s = size();
    const x = W * (0.12 + Math.random() * 0.76);
    const apex = H * (0.28 + Math.random() * 0.4); // how high it should climb
    const vy = -Math.sqrt(2 * G() * apex);
    const vx = (W * 0.5 - x) * (0.25 + Math.random() * 0.35);
    items.push({ k: kind, x, y: H + s * 0.6, vx, vy, r: s / 2, rot: Math.random() * 6, vr: (Math.random() - 0.5) * 5, s, alive: true });
  }
  function wave() {
    const n = 1 + (Math.random() < 0.55 ? 1 : 0) + (elapsed > 14 && Math.random() < 0.4 ? 1 : 0);
    for (let i = 0; i < n; i++) {
      const bomb = Math.random() < Math.min(0.2, 0.1 + elapsed * 0.002);
      toss(bomb ? 'bomb' : FOODS[Math.floor(Math.random() * FOODS.length)]);
    }
  }
  function splat(x: number, y: number, c: string, n = 10) { for (let i = 0; i < n; i++) { const a = Math.random() * Math.PI * 2, v = 120 + Math.random() * 360; dots.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 120, life: 0.5 + Math.random() * 0.4, c }); } }

  // slicing: test each blade segment against each item
  const segHit = (ax: number, ay: number, bx: number, by: number, cx: number, cy: number, r: number) => {
    const dx = bx - ax, dy = by - ay, l2 = dx * dx + dy * dy || 1;
    let t = ((cx - ax) * dx + (cy - ay) * dy) / l2; t = Math.max(0, Math.min(1, t));
    return Math.hypot(ax + dx * t - cx, ay + dy * t - cy) < r;
  };
  function slice(ax: number, ay: number, bx: number, by: number) {
    const ang = Math.atan2(by - ay, bx - ax);
    let combo = 0;
    for (const it of items) {
      if (!it.alive || !segHit(ax, ay, bx, by, it.x, it.y, it.r * 0.85)) continue;
      it.alive = false;
      if (it.k === 'bomb') { flash = 1; shake = 18; splat(it.x, it.y, '#FF5A1F', 30); splat(it.x, it.y, '#14162B', 20); end('Boom!'); return; }
      combo++; score += 1;
      splat(it.x, it.y, JUICE[it.k], 12);
      for (const side of [1, -1] as const) halves.push({ k: it.k, x: it.x, y: it.y, vx: it.vx * 0.4 + side * Math.cos(ang + Math.PI / 2) * 160, vy: it.vy * 0.3 + side * Math.sin(ang + Math.PI / 2) * 160 - 60, rot: it.rot, vr: it.vr + side * 2.4, s: it.s, ang: ang - it.rot, side, life: 1.6 });
    }
    if (combo >= 3) { score += combo; say('Combo x' + combo, '', true); setTimeout(() => { if (state === 'live') msg.classList.add('is-hidden'); }, 600); }
    if (combo) setHud();
  }

  // pointer
  let last: { x: number; y: number } | null = null;
  const pos = (e: PointerEvent) => { const r = cv.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
  cv.addEventListener('pointerdown', (e) => {
    const p = pos(e); last = p; trail.push({ ...p, t: performance.now() });
    if (state === 'ready') { state = 'live'; cv.classList.add('is-live'); msg.classList.add('is-hidden'); }
  });
  cv.addEventListener('pointermove', (e) => {
    const p = pos(e);
    const cutting = e.pointerType === 'mouse' ? true : e.buttons > 0; // a mouse slices as it moves, a finger while it is down
    if (cutting) trail.push({ ...p, t: performance.now() });
    if (cutting && last && state === 'live') slice(last.x, last.y, p.x, p.y);
    last = p;
  });
  cv.addEventListener('pointerup', () => { last = null; });
  cv.addEventListener('pointerleave', () => { last = null; });
  $('[data-reset]').addEventListener('click', reset);
  addEventListener('keydown', (e) => { if (e.key.toLowerCase() === 'r' && visible && state === 'over') reset(); });

  new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) { resize(); last = null; } }).observe(foot);

  const img = (k: Kind, x: number, y: number, s: number, rot: number) => { const im = sprites[k]; if (!im || !im.complete) return; ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.drawImage(im, -s / 2, -s / 2, s, s * (im.naturalHeight / im.naturalWidth || 1)); ctx.restore(); };
  let prev = performance.now();
  function frame(now: number) {
    requestAnimationFrame(frame);
    const dt = Math.min(0.033, (now - prev) / 1000); prev = now;
    if (!visible) return;
    ctx.clearRect(0, 0, W, H);
    ctx.save();
    if (shake > 0.3 && !reduce) { ctx.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake); shake *= 0.9; }
    if (state === 'live') {
      elapsed += dt; spawnT -= dt;
      if (spawnT <= 0) { wave(); spawnT = Math.max(0.65, 1.5 - elapsed * 0.012) + Math.random() * 0.5; }
    }
    for (const it of items) {
      it.vy += G() * dt; it.x += it.vx * dt; it.y += it.vy * dt; it.rot += it.vr * dt;
      if (it.alive) img(it.k, it.x, it.y, it.s, it.rot);
      if (it.alive && it.y > H + it.s && it.vy > 0) {
        it.alive = false;
        if (state === 'live' && it.k !== 'bomb') { lives -= 1; setHud(); if (lives <= 0) end('Out of lives'); }
      }
    }
    items = items.filter((it) => it.alive || it.y < H + it.s);
    items = items.filter((it) => it.alive);
    for (const h of halves) {
      h.vy += G() * dt; h.x += h.vx * dt; h.y += h.vy * dt; h.rot += h.vr * dt; h.life -= dt;
      const im = sprites[h.k]; if (!im || !im.complete) continue;
      const s = h.s, ratio = im.naturalHeight / im.naturalWidth || 1;
      ctx.save(); ctx.globalAlpha = Math.max(0, Math.min(1, h.life)); ctx.translate(h.x, h.y); ctx.rotate(h.rot);
      // clip to one half-plane through the centre, along the blade direction (stored in the item's own frame)
      ctx.rotate(h.ang); ctx.beginPath(); ctx.rect(-s, h.side === 1 ? -s : 0, s * 2, s); ctx.clip();
      ctx.rotate(-h.ang); ctx.drawImage(im, -s / 2, -s / 2, s, s * ratio);
      ctx.restore();
    }
    halves = halves.filter((h) => h.life > 0 && h.y < H + 300);
    for (const d of dots) { d.vy += G() * 0.6 * dt; d.x += d.vx * dt; d.y += d.vy * dt; d.life -= dt; ctx.globalAlpha = Math.max(0, d.life * 1.6); ctx.fillStyle = d.c; ctx.beginPath(); ctx.arc(d.x, d.y, 4 + d.life * 5, 0, 7); ctx.fill(); }
    ctx.globalAlpha = 1; dots = dots.filter((d) => d.life > 0);
    // blade trail
    const t = performance.now(); trail = trail.filter((p) => t - p.t < 220);
    if (trail.length > 1) {
      for (let i = 1; i < trail.length; i++) {
        const a = trail[i - 1], b = trail[i], k = 1 - (t - b.t) / 220;
        ctx.strokeStyle = i % 2 ? '#FFFFFF' : '#FF5A1F'; ctx.lineWidth = 2 + k * 9; ctx.lineCap = 'round'; ctx.globalAlpha = k;
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }
    ctx.restore();
    if (flash > 0.02) { ctx.fillStyle = `rgba(255,90,31,${flash * 0.55})`; ctx.fillRect(0, 0, W, H); flash *= 0.9; }
  }
  requestAnimationFrame(frame);
  reset();
}
