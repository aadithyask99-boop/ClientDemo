/**
 * Live, interactive art for the case-study tiles. Each tile draws on a canvas, only while it is on screen.
 * Hover and click do something that fits the project: a radar that works, a network that gets infected and
 * recovers, cloud layers that fan apart and get scanned, and a threat feed that speeds up where you look.
 */
type Ptr = { x: number; y: number; in: boolean };
type Art = { draw: (t: number, dt: number) => void; click: (x: number, y: number) => void; hint?: () => void };

const TAU = Math.PI * 2;
const MONO = '500 10px "IBM Plex Mono", ui-monospace, monospace';
const rgb = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255] as const;
};
const rgba = (hex: string, a: number) => { const [r, g, b] = rgb(hex); return `rgba(${r},${g},${b},${a})`; };
const ALERT = '#ff6b4a';

// A tiny deterministic random, so every tile looks the same on every visit
const seeded = (seed: number) => () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };

function background(ctx: CanvasRenderingContext2D, W: number, H: number) {
  const g = ctx.createLinearGradient(0, 0, W, H);
  g.addColorStop(0, '#0a1830');
  g.addColorStop(1, '#050b16');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
}

function label(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, color: string, boxed = true) {
  ctx.font = MONO;
  const w = ctx.measureText(text).width + 12;
  if (boxed) {
    ctx.fillStyle = 'rgba(5,11,22,0.82)';
    ctx.fillRect(x, y - 11, w, 17);
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 0.5, y - 10.5, w - 1, 16);
  }
  ctx.fillStyle = color;
  ctx.fillText(text, x + 6, y + 1);
}

/* ---------------- Radar: a sweep that finds contacts; hover reads bearing and range; click pings ---------------- */
function radar(ctx: CanvasRenderingContext2D, W: () => number, H: () => number, accent: string, ptr: Ptr): Art {
  const r = seeded(7);
  type Blip = { a: number; d: number; lit: number; name: string; flagged: number };
  const blips: Blip[] = Array.from({ length: 10 }, (_, i) => ({ a: r() * TAU, d: 0.2 + r() * 0.75, lit: 0, name: `CONTACT ${String(i + 1).padStart(2, '0')}`, flagged: 0 }));
  const pings: { x: number; y: number; t: number }[] = [];
  let ang = -Math.PI / 2;
  let n = blips.length;

  return {
    draw(_t, dt) {
      const w = W(), h = H();
      background(ctx, w, h);
      const cx = w * 0.6, cy = h * 0.52, R = Math.min(w * 0.46, h * 0.56);
      ctx.lineWidth = 1;
      // rings and spokes
      [0.2, 0.4, 0.6, 0.8, 1].forEach((k, i) => { ctx.strokeStyle = rgba(accent, 0.42 - i * 0.06); ctx.beginPath(); ctx.arc(cx, cy, R * k, 0, TAU); ctx.stroke(); });
      ctx.strokeStyle = rgba(accent, 0.12);
      for (let i = 0; i < 8; i++) { ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos((i * TAU) / 8) * R, cy + Math.sin((i * TAU) / 8) * R); ctx.stroke(); }

      // the sweep, and the blips it passes
      const prev = ang;
      ang = (ang + dt * 1.0) % TAU;
      const span = (ang - prev + TAU) % TAU;
      for (const b of blips) {
        const a = (b.a % TAU + TAU) % TAU;
        const pa = (prev % TAU + TAU) % TAU;
        if (((a - pa + TAU) % TAU) <= span) b.lit = 1;
        b.lit = Math.max(0, b.lit - dt * 0.42);
        b.flagged = Math.max(0, b.flagged - dt);
      }
      if (ctx.createConicGradient) {
        const trail = 1.2;
        const g = ctx.createConicGradient(ang - trail, cx, cy);
        const f = trail / TAU;
        g.addColorStop(0, rgba(accent, 0));
        g.addColorStop(f, rgba(accent, 0.4));
        g.addColorStop(Math.min(1, f + 0.0005), rgba(accent, 0));
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.fill();
      }
      ctx.strokeStyle = accent; ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(ang) * R, cy + Math.sin(ang) * R); ctx.stroke();

      // blips
      let near: { b: Blip; x: number; y: number } | null = null;
      let nearD = 22;
      for (const b of blips) {
        const x = cx + Math.cos(b.a) * b.d * R, y = cy + Math.sin(b.a) * b.d * R;
        const warn = b.flagged > 0;
        const col = warn ? ALERT : accent;
        const glow = Math.max(b.lit, warn ? 0.9 : 0);
        if (glow > 0.02) { ctx.fillStyle = rgba(col, 0.22 * glow); ctx.beginPath(); ctx.arc(x, y, 5 + 11 * glow, 0, TAU); ctx.fill(); }
        ctx.fillStyle = rgba(col, 0.25 + 0.75 * glow);
        ctx.beginPath(); ctx.arc(x, y, 3, 0, TAU); ctx.fill();
        if (ptr.in) { const d = Math.hypot(ptr.x - x, ptr.y - y); if (d < nearD) { nearD = d; near = { b, x, y }; } }
      }
      // click pings
      for (let i = pings.length - 1; i >= 0; i--) {
        const p = pings[i];
        p.t += dt;
        if (p.t > 1.4) { pings.splice(i, 1); continue; }
        ctx.strokeStyle = rgba(ALERT, 0.8 * (1 - p.t / 1.4));
        ctx.beginPath(); ctx.arc(p.x, p.y, p.t * 70, 0, TAU); ctx.stroke();
      }
      // pointer: crosshair, bearing and range, and the nearest contact
      if (ptr.in) {
        const dx = ptr.x - cx, dy = ptr.y - cy;
        const range = Math.hypot(dx, dy);
        if (range < R * 1.02) {
          ctx.strokeStyle = rgba(accent, 0.5); ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(ptr.x, ptr.y); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(ptr.x - 10, ptr.y); ctx.lineTo(ptr.x + 10, ptr.y); ctx.moveTo(ptr.x, ptr.y - 10); ctx.lineTo(ptr.x, ptr.y + 10); ctx.stroke();
          const brg = (Math.atan2(dx, -dy) * 180 / Math.PI + 360) % 360;
          label(ctx, `BRG ${String(Math.round(brg)).padStart(3, '0')}°  RNG ${(range / R * 24).toFixed(1)} KM`, Math.min(ptr.x + 14, w - 150), Math.max(ptr.y - 14, 18), accent);
        }
        if (near) {
          const q = near as { b: Blip; x: number; y: number };
          ctx.strokeStyle = q.b.flagged > 0 ? ALERT : accent; ctx.lineWidth = 1.4;
          ctx.beginPath(); ctx.arc(q.x, q.y, 11, 0, TAU); ctx.stroke();
          label(ctx, `${q.b.name} · ${q.b.flagged > 0 ? 'FLAGGED' : 'TRUSTED'}`, Math.min(q.x + 16, w - 170), q.y + 22, q.b.flagged > 0 ? ALERT : accent);
        }
      }
    },
    click(x, y) {
      const w = W(), h = H();
      const cx = w * 0.6, cy = h * 0.52, R = Math.min(w * 0.46, h * 0.56);
      const dx = x - cx, dy = y - cy;
      if (Math.hypot(dx, dy) > R) return;
      pings.push({ x, y, t: 0 });
      // A new contact appears where you pinged, flagged for a few seconds, then cleared
      if (blips.length > 16) blips.splice(10, 1);
      blips.push({ a: Math.atan2(dy, dx), d: Math.hypot(dx, dy) / R, lit: 1, name: `CONTACT ${String(++n).padStart(2, '0')}`, flagged: 5 });
    },
  };
}

/* ---------------- Network: hover lights nodes; click starts an infection that spreads, then recovers ---------------- */
function network(ctx: CanvasRenderingContext2D, W: () => number, H: () => number, accent: string, ptr: Ptr): Art {
  const r = seeded(11);
  const cols = 8, rows = 4;
  type Node = { u: number; v: number; sick: number; heal: number; hop: number; name: string };
  const nodes: Node[] = [];
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) nodes.push({ u: (i + 0.5 + (j % 2) * 0.35 - 0.17) / cols + (r() - 0.5) * 0.03, v: (j + 0.55) / rows + (r() - 0.5) * 0.04, sick: 0, heal: 0, hop: 0, name: `NODE ${String(j * cols + i + 1).padStart(2, '0')}` });
  const idx = (i: number, j: number) => j * cols + i;
  const edges: [number, number][] = [];
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
    if (i + 1 < cols) edges.push([idx(i, j), idx(i + 1, j)]);
    if (j + 1 < rows) edges.push([idx(i, j), idx(i, j + 1)]);
    if (i + 1 < cols && j + 1 < rows && (i + j) % 2 === 0) edges.push([idx(i, j), idx(i + 1, j + 1)]);
  }
  const adj: number[][] = nodes.map(() => []);
  edges.forEach(([a, b]) => { adj[a].push(b); adj[b].push(a); });
  const packets = Array.from({ length: 7 }, () => ({ e: Math.floor(r() * edges.length), p: r(), s: 0.25 + r() * 0.35 }));
  let clock = 0;
  let demoed = false;

  const infect = (start: number) => {
    // breadth-first, so the infection spreads hop by hop
    const seen = new Set([start]);
    let frontier = [start];
    nodes[start].hop = 0;
    for (let hop = 0; frontier.length && hop < 9; hop++) {
      const next: number[] = [];
      for (const n of frontier) {
        nodes[n].sick = clock + hop * 0.14;
        nodes[n].heal = clock + hop * 0.14 + 1.5 + hop * 0.06;
        for (const m of adj[n]) if (!seen.has(m)) { seen.add(m); next.push(m); }
      }
      frontier = next;
    }
  };
  const state = (n: Node) => (clock < n.sick || n.sick === 0 ? 'ok' : clock < n.heal ? 'sick' : clock < n.heal + 1.1 ? 'healed' : 'ok');

  return {
    draw(_t, dt) {
      clock += dt;
      const w = W(), h = H();
      background(ctx, w, h);
      const px = (n: Node) => n.u * w, py = (n: Node) => n.v * h;
      if (!demoed && clock > 1.4) { demoed = true; infect(idx(5, 1)); } // one demonstration, so it is clear something happens
      // edges
      for (const [a, b] of edges) {
        const A = nodes[a], B = nodes[b];
        const sa = state(A), sb = state(B);
        const hot = sa === 'sick' && sb === 'sick';
        let al = 0.2;
        if (ptr.in) { const d = Math.min(Math.hypot(ptr.x - px(A), ptr.y - py(A)), Math.hypot(ptr.x - px(B), ptr.y - py(B))); al += Math.max(0, 1 - d / 110) * 0.55; }
        ctx.strokeStyle = hot ? rgba(ALERT, 0.8) : rgba(accent, al);
        ctx.lineWidth = hot ? 1.6 : 1;
        ctx.beginPath(); ctx.moveTo(px(A), py(A)); ctx.lineTo(px(B), py(B)); ctx.stroke();
      }
      // packets travelling along the links
      for (const k of packets) {
        k.p += dt * k.s;
        if (k.p > 1) { k.p = 0; k.e = Math.floor(Math.random() * edges.length); }
        const [a, b] = edges[k.e];
        const x = px(nodes[a]) + (px(nodes[b]) - px(nodes[a])) * k.p, y = py(nodes[a]) + (py(nodes[b]) - py(nodes[a])) * k.p;
        ctx.fillStyle = rgba('#ffffff', 0.7);
        ctx.beginPath(); ctx.arc(x, y, 1.8, 0, TAU); ctx.fill();
      }
      // nodes
      let near: Node | null = null;
      let nearD = 30;
      for (const n of nodes) {
        const x = px(n), y = py(n), s = state(n);
        const hover = ptr.in ? Math.max(0, 1 - Math.hypot(ptr.x - x, ptr.y - y) / 90) : 0;
        if (ptr.in) { const d = Math.hypot(ptr.x - x, ptr.y - y); if (d < nearD) { nearD = d; near = n; } }
        const col = s === 'sick' ? ALERT : s === 'healed' ? '#ffffff' : accent;
        const rad = 3 + hover * 3.5 + (s === 'sick' ? 2 : 0);
        if (hover > 0.05 || s !== 'ok') { ctx.fillStyle = rgba(col, 0.18 + 0.2 * hover); ctx.beginPath(); ctx.arc(x, y, rad + 9, 0, TAU); ctx.fill(); }
        ctx.fillStyle = rgba(col, s === 'ok' ? 0.6 + 0.4 * hover : 1);
        ctx.beginPath(); ctx.arc(x, y, rad, 0, TAU); ctx.fill();
      }
      if (near) {
        const n = near as Node;
        const s = state(n);
        label(ctx, `${n.name} · ${s === 'sick' ? 'ENCRYPTED' : s === 'healed' ? 'RESTORED' : 'HEALTHY'}`, Math.min(px(n) + 14, w - 170), Math.max(py(n) - 16, 18), s === 'sick' ? ALERT : accent);
      }
    },
    click(x, y) {
      let best = 0, bd = Infinity;
      nodes.forEach((n, i) => { const d = Math.hypot(x - n.u * W(), y - n.v * H()); if (d < bd) { bd = d; best = i; } });
      infect(best);
    },
  };
}

/* ---------------- Planes: layers fan apart and tilt with the pointer; click runs a posture scan ---------------- */
function planes(ctx: CanvasRenderingContext2D, W: () => number, H: () => number, accent: string, ptr: Ptr): Art {
  const names = ['IDENTITY', 'NETWORK', 'DATA'];
  let spread = 0;
  let scan = -1;
  let ok = 0;
  const hit = (px: number, py: number, cx: number, cy: number, hw: number, hh: number) => Math.abs(px - cx) / hw + Math.abs(py - cy) / hh <= 1;

  return {
    draw(_t, dt) {
      const w = W(), h = H();
      background(ctx, w, h);
      spread += ((ptr.in ? 1 : 0) - spread) * Math.min(1, dt * 5);
      if (scan >= 0) { scan += dt / 1.7; if (scan > 1.25) { scan = -1; } }
      const hw = Math.min(w * 0.25, h * 0.52), hh = hw * 0.5;
      const gap = h * (0.14 + 0.08 * spread);
      const mx = ptr.in ? (ptr.x / w - 0.5) : 0, my = ptr.in ? (ptr.y / h - 0.5) : 0;
      // Which layer is under the pointer? Test top to bottom.
      const centres = names.map((_, i) => ({ x: w * 0.42 + mx * (14 + i * 16), y: h * 0.5 + (i - 1) * gap + my * 8 }));
      let hover = -1;
      if (ptr.in) for (let i = 0; i < 3; i++) if (hit(ptr.x, ptr.y, centres[i].x, centres[i].y, hw, hh)) { hover = i; break; }
      // connectors
      ctx.strokeStyle = rgba(accent, 0.25); ctx.setLineDash([3, 4]); ctx.lineWidth = 1;
      [[0, -1], [0, 1], [-1, 0], [1, 0]].forEach(([sx, sy]) => { ctx.beginPath(); ctx.moveTo(centres[0].x + sx * hw, centres[0].y + sy * hh); ctx.lineTo(centres[2].x + sx * hw, centres[2].y + sy * hh); ctx.stroke(); });
      ctx.setLineDash([]);
      // draw bottom layer first
      for (let i = 2; i >= 0; i--) {
        const c = centres[i];
        const on = hover === i;
        const scanned = scan >= 0 && scan * 1.25 > (i + 0.5) / 3 * 0.9;
        ctx.beginPath(); ctx.moveTo(c.x, c.y - hh); ctx.lineTo(c.x + hw, c.y); ctx.lineTo(c.x, c.y + hh); ctx.lineTo(c.x - hw, c.y); ctx.closePath();
        ctx.fillStyle = rgba(accent, on ? 0.5 : 0.26 - (hover >= 0 ? 0.08 : 0) + (scanned ? 0.12 : 0));
        ctx.fill();
        ctx.strokeStyle = rgba(accent, on ? 1 : 0.7);
        ctx.lineWidth = on ? 2 : 1.2;
        ctx.stroke();
        // label to the right
        const lx = c.x + hw + 14;
        ctx.font = MONO;
        ctx.fillStyle = rgba('#ffffff', on ? 1 : 0.6);
        ctx.fillText(`${names[i]}${scanned && scan >= 0 ? '  ✓' : ''}`, lx, c.y + 3);
        if (on) { ctx.fillStyle = rgba(accent, 0.9); ctx.fillText(['MFA ENFORCED', '12 SEGMENTS ISOLATED', 'ENCRYPTED AT REST'][i], lx, c.y + 17); }
      }
      // the scan beam
      if (scan >= 0) {
        const t = Math.min(1, scan);
        const y = centres[0].y - hh + t * (centres[2].y - centres[0].y + hh * 2);
        const g = ctx.createLinearGradient(0, y - 18, 0, y + 2);
        g.addColorStop(0, rgba('#ffffff', 0)); g.addColorStop(1, rgba('#ffffff', 0.5));
        ctx.fillStyle = g;
        ctx.fillRect(centres[0].x - hw * 1.1, y - 18, hw * 2.2, 20);
        ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(centres[0].x - hw * 1.1, y); ctx.lineTo(centres[0].x + hw * 1.1, y); ctx.stroke();
        ok = 3;
      }
      if (scan < 0 && ok) label(ctx, 'POSTURE SCAN · 3 / 3 LAYERS OK', 16, h - 22, accent);
    },
    click() { scan = 0; ok = 0; },
  };
}

/* ---------------- Stream: a live feed that speeds up and lights where you look; click flags an indicator ---------------- */
function stream(ctx: CanvasRenderingContext2D, W: () => number, H: () => number, accent: string, ptr: Ptr): Art {
  const r = seeded(23);
  const lines = 14;
  type Seg = { x: number; len: number; id: string; hot: number };
  const rows: { speed: number; segs: Seg[] }[] = Array.from({ length: lines }, (_, i) => {
    const segs: Seg[] = [];
    let x = r() * 80;
    while (x < 1400) { const len = 14 + r() * 70; segs.push({ x, len, id: Math.floor(r() * 0xfffff).toString(16).padStart(5, '0').toUpperCase(), hot: 0 }); x += len + 10 + r() * 40; }
    return { speed: 22 + ((i * 37) % 55), segs };
  });
  const flags: { row: number; x: number; t: number }[] = [];

  return {
    draw(_t, dt) {
      const w = W(), h = H();
      background(ctx, w, h);
      const span = Math.max(w + 120, 1400);
      let tip: { x: number; y: number; id: string; hot: boolean } | null = null;
      rows.forEach((row, i) => {
        const y = h * 0.09 + (i * h * 0.82) / (lines - 1);
        const prox = ptr.in ? Math.max(0, 1 - Math.abs(ptr.y - y) / 60) : 0;
        const mult = 1 + prox * 3.2;
        for (const s of row.segs) {
          s.x -= row.speed * mult * dt;
          if (s.x + s.len < -10) s.x += span;
          const near = ptr.in && Math.abs(ptr.y - y) < 14 && ptr.x > s.x - 6 && ptr.x < s.x + s.len + 6;
          s.hot = Math.max(near ? 1 : 0, s.hot - dt * 1.4);
          const a = 0.24 + (i % 4) * 0.12 + prox * 0.35;
          ctx.strokeStyle = s.hot > 0.05 ? rgba('#ffffff', 0.4 + 0.6 * s.hot) : rgba(accent, Math.min(1, a));
          ctx.lineWidth = 1.6 + s.hot * 1.4 + prox * 0.8;
          ctx.beginPath(); ctx.moveTo(s.x, y); ctx.lineTo(s.x + s.len, y); ctx.stroke();
          if (near) tip = { x: s.x, y, id: s.id, hot: false };
        }
      });
      // flagged indicators
      for (let i = flags.length - 1; i >= 0; i--) {
        const f = flags[i];
        f.t += dt; f.x -= 30 * dt;
        if (f.t > 4) { flags.splice(i, 1); continue; }
        const y = h * 0.09 + (f.row * h * 0.82) / (lines - 1);
        ctx.fillStyle = rgba(ALERT, 0.25 * (1 - f.t / 4)); ctx.beginPath(); ctx.arc(f.x, y, 12 + f.t * 6, 0, TAU); ctx.fill();
        ctx.strokeStyle = ALERT; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(f.x - 28, y); ctx.lineTo(f.x + 28, y); ctx.stroke();
        if (f.t < 3) label(ctx, 'FLAGGED · IOC', f.x - 40, y - 14, ALERT);
      }
      if (tip) { const q = tip as { x: number; y: number; id: string }; label(ctx, `IOC 0x${q.id} · ACTOR UNKNOWN`, Math.min(q.x + 8, w - 200), Math.max(q.y - 16, 18), accent); }
    },
    click(_x, y) {
      let best = 0, bd = Infinity;
      for (let i = 0; i < lines; i++) { const d = Math.abs(y - (h() * 0.09 + (i * h() * 0.82) / (lines - 1))); if (d < bd) { bd = d; best = i; } }
      flags.push({ row: best, x: ptrX(), t: 0 });
    },
  };
  function h() { return H(); }
  function ptrX() { return ptr.x > 0 ? ptr.x : W() / 2; }
}

const makers: Record<string, typeof radar> = { rings: radar, nodes: network, planes, stream };

export function initTiles(reduce: boolean) {
  const tiles = [...document.querySelectorAll<HTMLElement>('[data-tile]')];
  const live: { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D; art: Art; visible: boolean; w: number; h: number; tile: HTMLElement }[] = [];
  let raf = 0;
  let last = 0;

  const loop = (now: number) => {
    const dt = Math.min(0.05, last ? (now - last) / 1000 : 0.016);
    last = now;
    let any = false;
    for (const l of live) {
      if (!l.visible) continue;
      any = true;
      const dpr = Math.min(window.devicePixelRatio, 1.5);
      l.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      l.art.draw(now / 1000, dt);
    }
    raf = any ? requestAnimationFrame(loop) : 0;
    if (!any) last = 0;
  };
  const wake = () => { if (!raf) raf = requestAnimationFrame(loop); };

  for (const tile of tiles) {
    const canvas = tile.querySelector<HTMLCanvasElement>('canvas[data-art]');
    const make = canvas && makers[canvas.dataset.art ?? ''];
    const ctx = canvas?.getContext('2d');
    if (!canvas || !make || !ctx) continue;
    const accent = canvas.dataset.accent ?? '#2fd3c8';
    const ptr: Ptr = { x: -1, y: -1, in: false };
    const item = { canvas, ctx, visible: false, w: 1, h: 1, art: null as unknown as Art, tile };
    item.art = make(ctx, () => item.w, () => item.h, accent, ptr);
    live.push(item);

    const fit = () => {
      const dpr = Math.min(window.devicePixelRatio, 1.5);
      item.w = canvas.clientWidth || 1;
      item.h = canvas.clientHeight || 1;
      canvas.width = Math.round(item.w * dpr);
      canvas.height = Math.round(item.h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      item.art.draw(0, 0); // never leave a blank canvas
      tile.classList.add('is-live');
    };
    new ResizeObserver(fit).observe(canvas);
    fit();
    if (reduce) continue;

    new IntersectionObserver(([e]) => { item.visible = e.isIntersecting; if (item.visible) wake(); }, { rootMargin: '60px' }).observe(tile);
    // offsetX/Y are in the canvas's own coordinates, so they stay right while the tile is tilted in 3D
    canvas.addEventListener('pointermove', (e) => { ptr.x = e.offsetX; ptr.y = e.offsetY; ptr.in = true; });
    canvas.addEventListener('pointerleave', () => { ptr.in = false; });
    canvas.addEventListener('pointerdown', (e) => item.art.click(e.offsetX, e.offsetY));
  }
}
