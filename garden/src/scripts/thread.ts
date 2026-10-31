// The gold thread, as a real rope. Its route down the page (hero to the swans) is only a loose tether. Every point is a
// Verlet particle; the rope is pinned at each section's knot like string strung between hooks, its links cannot stretch
// (so a push becomes a wave that swings and overshoots), gravity makes it hang, and it drifts on a slow wind. The mouse
// pushes it; on a phone only the tilt (gravity) sensor moves it, never a tap. Drawn as an SVG that scrolls with the page, so it
// cannot drift out of step with the content; only the points near the screen are simulated and drawn.
import { chime } from './audio';
import { tilt } from './sensors';

type Pt = { x: number; y: number; knot: boolean };

const SP = 22; // px between particles
const K_REST = 3.4; // a gentle pull back toward the route, so it keeps its shape but can swing
const K_NEIGH = 10; // a little bending stiffness
const DAMP = 0.993; // low damping, so it swings and overshoots
const WIND = 40;
const GRAVITY = 36; // it hangs, just a little
const TILT_G = 700; // sideways acceleration at full tilt
const RIPPLE = 900; // how hard rotating or shaking the phone ripples the string
const REPEL = 2300;
const DRAG = 6;
const R = 190; // pointer reach
const MAX_DISP = 210;
const LINK = SP * 1.08; // each link may be up to 8% longer than its resting span: that slack is what lets the rope bow and swing

export function initThread(reduce: boolean): () => void {
  const svg = document.getElementById('thread') as unknown as SVGSVGElement;
  const shadowP = document.getElementById('th-shadow') as unknown as SVGPathElement;
  const solidP = document.getElementById('th-solid') as unknown as SVGPathElement;
  const aheadP = document.getElementById('th-ahead') as unknown as SVGPathElement;
  const needleG = document.getElementById('th-needle') as unknown as SVGGElement;
  const root = document.documentElement;
  const coarse = matchMedia('(pointer: coarse)').matches;
  void svg;
  let W = 0;
  let H = 0;
  let n = 0;
  let rx = new Float32Array(0);
  let ry = new Float32Array(0);
  let x = new Float32Array(0);
  let y = new Float32Array(0);
  let ox = new Float32Array(0);
  let oy = new Float32Array(0);
  let pinned = new Uint8Array(0); // 1 where the rope is tied (the knots)

  // ---------- the route ----------
  let sideCount = 0;
  const anchor = (el: HTMLElement): Pt => {
    const vw = root.clientWidth;
    const knot = el.querySelector<HTMLElement>('.knot');
    const r = (knot ?? el).getBoundingClientRect();
    if (knot) return { x: r.left + r.width / 2 + scrollX, y: r.top + r.height / 2 + scrollY, knot: true };
    // sections without a knot: wide screens use the left margin before the journey and the right after it; phones the left margin
    const px = vw >= 900 ? (sideCount++ === 0 ? vw * 0.135 : vw * 0.865) : Math.max(30, vw * 0.08); // clear of the ivy at the screen edges
    return { x: px, y: r.top + scrollY + Math.min(r.height * 0.1, 56), knot: false };
  };

  let rebuilds = 0;
  let lastW = 0;
  let lastDocH = 0;
  // note the screen's size. This is cheap and never touches the rope, because on a phone the address bar sliding
  // away changes the height while you scroll, and that must not reset anything.
  const fit = () => {
    W = root.clientWidth;
    H = innerHeight;
  };
  const build = () => {
    rebuilds++;
    // remember how far each point is from its resting place, so a rebuild keeps the rope's swing instead of snapping it
    const keep = n ? { n, dx: Float32Array.from(x, (v, i) => v - rx[i]), dy: Float32Array.from(y, (v, i) => v - ry[i]) } : null;
    fit();
    lastW = W;
    lastDocH = document.body.scrollHeight;
    const wide = W >= 900;
    sideCount = 0;

    const pts: Pt[] = [];
    const cue = document.querySelector<HTMLElement>('.getting');
    // phones: it starts under the names. Wide screens: it hangs in from above the page, down the left margin, so it never has a loose end
    if (wide) pts.push({ x: W * 0.135, y: -30, knot: false });
    else if (cue) { const r = cue.getBoundingClientRect(); pts.push({ x: W / 2, y: r.bottom + scrollY + 6, knot: false }); }
    document.querySelectorAll<HTMLElement>('[data-knot]').forEach((el) => pts.push(anchor(el)));
    const finale = document.getElementById('finale');
    if (finale) pts.push({ x: wide ? W * 0.865 : Math.max(30, W * 0.08), y: finale.getBoundingClientRect().top + scrollY + 30, knot: false });
    const swans = document.getElementById('swans');
    if (swans) { const r = swans.getBoundingClientRect(); pts.push({ x: W / 2, y: r.top + scrollY + r.height * 0.55, knot: false }); }
    if (pts.length < 2) return;

    // sample each cubic segment densely, then resample at an even spacing along the whole route
    const dense: number[] = [pts[0].x, pts[0].y];
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1];
      const b = pts[i];
      const dy = b.y - a.y;
      const sway = (a.knot && b.knot ? (wide ? 46 : 0) : wide ? 0 : 12) * (i % 2 ? 1 : -1);
      const c1x = a.x + sway, c1y = a.y + dy * 0.45, c2x = b.x - sway, c2y = b.y - dy * 0.45;
      const steps = Math.max(8, Math.ceil(Math.hypot(b.x - a.x, dy) / 5));
      for (let s = 1; s <= steps; s++) {
        const t = s / steps, u = 1 - t;
        dense.push(
          u * u * u * a.x + 3 * u * u * t * c1x + 3 * u * t * t * c2x + t * t * t * b.x,
          u * u * u * a.y + 3 * u * u * t * c1y + 3 * u * t * t * c2y + t * t * t * b.y,
        );
      }
    }
    const out: number[] = [dense[0], dense[1]];
    let carry = 0;
    for (let i = 2; i < dense.length; i += 2) {
      let ax = dense[i - 2], ay = dense[i - 1];
      const bx = dense[i], by = dense[i + 1];
      let seg = Math.hypot(bx - ax, by - ay);
      while (carry + seg >= SP) {
        const f = (SP - carry) / seg;
        ax += (bx - ax) * f;
        ay += (by - ay) * f;
        out.push(ax, ay);
        seg = Math.hypot(bx - ax, by - ay);
        carry = 0;
      }
      carry += seg;
    }
    n = out.length / 2;
    rx = new Float32Array(n); ry = new Float32Array(n);
    for (let i = 0; i < n; i++) { rx[i] = out[2 * i]; ry[i] = out[2 * i + 1]; }
    x = Float32Array.from(rx); y = Float32Array.from(ry);
    ox = Float32Array.from(rx); oy = Float32Array.from(ry);
    pinned = new Uint8Array(n);
    pinned[0] = 1;
    pinned[n - 1] = 1;
    for (const a of pts) { // tie the rope at every anchor (knots, section tops, the swans)
      let best = 0, bd = 1e9;
      for (let i = 0; i < n; i++) { const d = Math.abs(rx[i] - a.x) + Math.abs(ry[i] - a.y); if (d < bd) { bd = d; best = i; } }
      pinned[best] = 1;
    }
    if (keep && Math.abs(keep.n - n) <= 12) {
      for (let i = 0; i < Math.min(n, keep.n); i++) {
        if (pinned[i]) continue;
        x[i] = ox[i] = rx[i] + keep.dx[i];
        y[i] = oy[i] = ry[i] + keep.dy[i];
      }
    }
  };

  // ---------- inputs ----------
  let pX = -9999, pY = -9999, pVX = 0, pVY = 0, pT = -1e9; // pointer, in page coordinates
  addEventListener('pointermove', (e) => {
    if (e.pointerType === 'touch') return; // a finger scrolling must not push the thread; only a mouse or pen does
    const now = performance.now();
    const nx = e.clientX + scrollX, ny = e.clientY + scrollY;
    const dt = Math.max(8, now - pT) / 1000;
    if (now - pT < 200) { pVX = pVX * 0.6 + ((nx - pX) / dt) * 0.4; pVY = pVY * 0.6 + ((ny - pY) / dt) * 0.4; } else { pVX = 0; pVY = 0; }
    const cap = 2200; // a fast flick should push the string, not fling it
    pVX = Math.max(-cap, Math.min(cap, pVX)); pVY = Math.max(-cap, Math.min(cap, pVY));
    pX = nx; pY = ny; pT = now;
  }, { passive: true });

  let tiltX = 0, tiltY = 0;

  let lastScroll = scrollY, gust = 0;
  addEventListener('scroll', () => { gust = Math.min(1.6, gust + Math.abs(scrollY - lastScroll) * 0.008); lastScroll = scrollY; }, { passive: true });

  // ---------- simulation ----------
  const kick = (i: number, f: number) => {
    for (let k = Math.max(1, i - 6); k < Math.min(n - 1, i + 7); k++) ox[k] -= f * (1 - Math.abs(k - i) / 7) * 0.016;
  };
  const step = (dt: number, t: number) => {
    const top = scrollY - 500, bottom = scrollY + H + 500;
    const idle = t - pT > 1400;
    tiltX += (tilt.x - tiltX) * 0.06;
    tiltY += (tilt.y - tiltY) * 0.06;
    const ripple = tilt.jerk * RIPPLE + tilt.shake * RIPPLE;
    tilt.jerk *= 0.95;
    tilt.shake *= 0.96;
    gust *= 0.97;
    let lo = -1, hi = -1;
    for (let i = 1; i < n - 1; i++) {
      if (ry[i] < top || ry[i] > bottom) { x[i] = ox[i] = rx[i]; y[i] = oy[i] = ry[i]; continue; }
      if (lo < 0) lo = i;
      hi = i;
      if (pinned[i]) { x[i] = ox[i] = rx[i]; y[i] = oy[i] = ry[i]; continue; }
      let ax = (rx[i] - x[i]) * K_REST + ((x[i - 1] + x[i + 1]) * 0.5 - x[i]) * K_NEIGH;
      let ay = (ry[i] - y[i]) * K_REST + ((y[i - 1] + y[i + 1]) * 0.5 - y[i]) * K_NEIGH + GRAVITY;
      ax += Math.sin(t * 0.0006 + i * 0.045) * WIND + Math.sin(t * 0.0022 + i * 0.07) * gust * 130 + tiltX * TILT_G + ripple * (0.55 + 0.45 * Math.sin(i * 0.07 + t * 0.006));
      ay += Math.cos(t * 0.0005 + i * 0.05) * WIND * 0.3 + tiltY * TILT_G;
      if (!idle) {
        const dx = x[i] - pX, dy = y[i] - pY;
        const d = Math.hypot(dx, dy);
        if (d < R && d > 0.01) {
          const w = (1 - d / R) * (1 - d / R);
          ax += (dx / d) * w * REPEL + pVX * w * DRAG;
          ay += (dy / d) * w * REPEL * 0.5 + pVY * w * DRAG;
        }
      }
      const vx = (x[i] - ox[i]) * DAMP, vy = (y[i] - oy[i]) * DAMP;
      ox[i] = x[i]; oy[i] = y[i];
      x[i] += vx + ax * dt * dt;
      y[i] += vy + ay * dt * dt;
    }
    if (lo < 0) return;
    // the rope cannot stretch: a few passes of distance constraints, fixed at the knots and at the edge of the simulated stretch
    for (let it = 0; it < 7; it++) {
      for (let i = Math.max(0, lo - 1); i <= Math.min(n - 2, hi); i++) {
        const j = i + 1;
        const wi = pinned[i] || i < lo ? 0 : 1;
        const wj = pinned[j] || j > hi ? 0 : 1;
        const sum = wi + wj;
        if (!sum) continue;
        const dx = x[j] - x[i], dy = y[j] - y[i];
        const d = Math.hypot(dx, dy) || 0.0001;
        if (d <= LINK) continue; // a rope can bunch up (no push when slack), it only cannot stretch
        const diff = (d - LINK) / d;
        x[i] += (dx * diff * wi) / sum; y[i] += (dy * diff * wi) / sum;
        x[j] -= (dx * diff * wj) / sum; y[j] -= (dy * diff * wj) / sum;
      }
    }
    for (let i = lo; i <= hi; i++) {
      if (pinned[i]) continue;
      if (x[i] < 10) x[i] = 10; else if (x[i] > W - 10) x[i] = W - 10; // never swing off the screen
      const ex = x[i] - rx[i], ey = y[i] - ry[i], e = Math.hypot(ex, ey);
      if (e > MAX_DISP) { x[i] = rx[i] + (ex / e) * MAX_DISP; y[i] = ry[i] + (ey / e) * MAX_DISP; }
    }
  };

  // a light smoothing pass so a push bends the string in an arc instead of kinking it
  const smooth = () => {
    const top = scrollY - 500, bottom = scrollY + H + 500;
    for (let pass = 0; pass < 2; pass++) {
      for (let i = 1; i < n - 1; i++) {
        if (ry[i] < top || ry[i] > bottom || pinned[i]) continue;
        x[i] += ((x[i - 1] + x[i + 1]) * 0.5 - x[i]) * 0.07;
        y[i] += ((y[i - 1] + y[i + 1]) * 0.5 - y[i]) * 0.07;
      }
    }
  };

  // ---------- drawing ----------
  let tip = 0;
  const firstAbove = (yy: number) => { let lo = 0, hi = n - 1; while (lo < hi) { const m = (lo + hi) >> 1; if (ry[m] < yy) lo = m + 1; else hi = m; } return lo; };
  const r1 = (v: number) => Math.round(v * 10) / 10;
  const trace = (i0: number, i1: number) => {
    let d = 'M' + r1(x[i0]) + ' ' + r1(y[i0]);
    for (let i = i0 + 1; i < i1; i++) d += 'Q' + r1(x[i]) + ' ' + r1(y[i]) + ' ' + r1((x[i] + x[i + 1]) / 2) + ' ' + r1((y[i] + y[i + 1]) / 2);
    return d + 'L' + r1(x[i1]) + ' ' + r1(y[i1]);
  };
  const draw = () => {
    if (n < 3) return;
    // The SVG scrolls natively, so a stretch a screen beyond the viewport each way is drawn: the page may move a long way
    // between two of our updates (momentum scrolling) and the ends of the thread must never be visible.
    const pad = 640;
    const v0 = reduce ? 0 : Math.max(0, firstAbove(scrollY - pad) - 1);
    const v1 = reduce ? n - 1 : Math.min(n - 1, firstAbove(scrollY + H + pad) + 1);
    tip = reduce ? n - 1 : Math.min(n - 1, firstAbove(scrollY + H * 0.62));
    if (tip > v0 + 1) { // the thread already laid
      const d = trace(v0, Math.min(tip, v1));
      solidP.setAttribute('d', d);
      shadowP.setAttribute('d', d);
    } else { solidP.setAttribute('d', ''); shadowP.setAttribute('d', ''); }
    if (!reduce && tip < v1 - 1) aheadP.setAttribute('d', trace(Math.max(v0, tip), v1)); else aheadP.setAttribute('d', '');
    if (!reduce && tip > 1 && tip < n - 1) { // the needle at the tip
      const a = (Math.atan2(y[tip + 1] - y[tip - 1], x[tip + 1] - x[tip - 1]) * 180) / Math.PI;
      needleG.setAttribute('transform', 'translate(' + r1(x[tip]) + ' ' + r1(y[tip]) + ') rotate(' + r1(a) + ')');
      needleG.style.display = '';
    } else needleG.style.display = 'none';
  };

  // tap the needle: it chimes and the thread gives a flick
  let chimeStep = 0;
  addEventListener('pointerdown', (e) => {
    if (reduce || !tip || e.pointerType === 'touch') return;
    if (Math.hypot(e.clientX - x[tip], e.clientY + scrollY - y[tip]) < 30) { chime(chimeStep++ % 8, 0.9); kick(tip, 500); }
  }, { passive: true });

  // ---------- loop ----------
  let raf = 0, last = performance.now(), acc = 0, lastDraw = 0;
  const frame = (t: number) => {
    acc += Math.min(0.05, (t - last) / 1000);
    last = t;
    let guard = 3;
    while (acc >= 1 / 60 && guard--) { step(1 / 60, t); smooth(); acc -= 1 / 60; }
    if (guard < 0) acc = 0;
    if (!coarse || t - lastDraw >= 33) { draw(); lastDraw = t; } // phones: redraw at most 30 times a second
    raf = requestAnimationFrame(frame);
  };
  const run = () => { cancelAnimationFrame(raf); if (reduce) { draw(); return; } if (!document.hidden) { last = performance.now(); raf = requestAnimationFrame(frame); } };
  document.addEventListener('visibilitychange', run);

  let t0 = 0;
  const rebuild = () => { clearTimeout(t0); t0 = window.setTimeout(() => { build(); run(); }, 250); };
  // a change in width, or in the page's height (lazy pictures arriving), rebuilds the route; a change in the screen's height
  // alone (the phone's address bar) changes nothing but the stored size
  addEventListener('resize', () => { if (root.clientWidth !== lastW) rebuild(); else if (innerHeight !== H) fit(); });
  new ResizeObserver(() => { if (Math.abs(document.body.scrollHeight - lastDocH) > 6) rebuild(); }).observe(document.body);
  document.fonts?.ready.then(rebuild);
  addEventListener('load', rebuild);
  build();
  run();

  // handy for tests: how far the visible part of the string has been pushed off its route
  (window as unknown as { __thread?: unknown }).__thread = {
    displacement: () => { let m = 0; for (let i = 0; i < n; i++) if (ry[i] > scrollY && ry[i] < scrollY + H) m = Math.max(m, Math.hypot(x[i] - rx[i], y[i] - ry[i])); return m; },
    points: () => n,
    rebuilds: () => rebuilds,
    health: () => { let nan = 0, stretch = 0, off = 0; for (let i = 0; i < n; i++) { if (!Number.isFinite(x[i]) || !Number.isFinite(y[i])) nan++; if (x[i] < -2 || x[i] > W + 2) off++; if (i) stretch = Math.max(stretch, Math.hypot(x[i] - x[i - 1], y[i] - y[i - 1]) / SP); } return { nan, stretch: +stretch.toFixed(2), off }; },
    at: (cy: number) => { const i = firstAbove(scrollY + cy); return [x[i], y[i] - scrollY]; },
  };
  return build;
}
