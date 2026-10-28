// "The 3pm test": illustrative felt-energy curves across a working day (hour of day, 0-100 index).
// These are drawn for the concept demo, not measured. The page says so.
export const X0 = 7;
export const X1 = 21;

// a regular coffee: a spike, a slump, a second coffee, then the 3pm crash
export const REG = [[7, 36], [7.6, 62], [8.25, 92], [9, 80], [10, 52], [10.75, 44], [11.2, 66], [11.9, 80], [12.7, 62], [13.7, 42], [15, 27], [16, 34], [17.5, 40], [19, 38], [21, 32]];
// a Brew More latte: slower rise, long plateau, gentle fall
export const BM = [[7, 36], [7.8, 56], [8.8, 74], [10, 78], [11.5, 76], [12.8, 72], [14, 66], [15, 62], [16.5, 58], [18, 54], [19.5, 50], [21, 45]];

// chart box (SVG user units)
export const W = 1000, H = 440, L = 70, R = 950, T = 60, B = 400;
export const px = (x) => L + ((x - X0) / (X1 - X0)) * (R - L);
export const py = (y) => B - (y / 100) * (B - T);

// monotone cubic (Fritsch-Carlson): smooth, never overshoots between points
export function makeCurve(pts) {
  const n = pts.length, xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
  const d = [], m = new Array(n);
  for (let i = 0; i < n - 1; i++) d[i] = (ys[i + 1] - ys[i]) / (xs[i + 1] - xs[i]);
  m[0] = d[0]; m[n - 1] = d[n - 2];
  for (let i = 1; i < n - 1; i++) m[i] = d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2;
  for (let i = 0; i < n - 1; i++) {
    if (d[i] === 0) { m[i] = m[i + 1] = 0; continue; }
    const a = m[i] / d[i], b = m[i + 1] / d[i], s = a * a + b * b;
    if (s > 9) { const t = 3 / Math.sqrt(s); m[i] = t * a * d[i]; m[i + 1] = t * b * d[i]; }
  }
  return (x) => {
    if (x <= xs[0]) return ys[0];
    if (x >= xs[n - 1]) return ys[n - 1];
    let i = 0; while (x > xs[i + 1]) i++;
    const h = xs[i + 1] - xs[i], t = (x - xs[i]) / h, t2 = t * t, t3 = t2 * t;
    return (2 * t3 - 3 * t2 + 1) * ys[i] + (t3 - 2 * t2 + t) * h * m[i] + (-2 * t3 + 3 * t2) * ys[i + 1] + (t3 - t2) * h * m[i + 1];
  };
}

export const STEP = 0.05;
export const samples = (f) => { const out = []; for (let x = X0; x <= X1 + 1e-6; x += STEP) out.push([x, f(x)]); return out; };
export const toPath = (pts) => pts.map(([x, y], i) => `${i ? 'L' : 'M'}${px(x).toFixed(1)} ${py(y).toFixed(1)}`).join('');
// cumulative path length (in SVG units) at each sample, so "how far along the line" is exact
export const cumulative = (pts) => { const c = [0]; for (let i = 1; i < pts.length; i++) c.push(c[i - 1] + Math.hypot(px(pts[i][0]) - px(pts[i - 1][0]), py(pts[i][1]) - py(pts[i - 1][1]))); return c; };

// the shaded gap: where the Brew More curve sits above the regular coffee
export function gapPath(reg, bm) {
  const segs = []; let cur = null;
  for (let i = 0; i < reg.length; i++) {
    const up = bm[i][1] > reg[i][1] + 0.5;
    if (up) (cur ??= []).push(i); else if (cur) { segs.push(cur); cur = null; }
  }
  if (cur) segs.push(cur);
  return segs.filter((s) => s.length > 6).map((s) => {
    const top = s.map((i) => `${px(bm[i][0]).toFixed(1)} ${py(bm[i][1]).toFixed(1)}`);
    const bottom = [...s].reverse().map((i) => `${px(reg[i][0]).toFixed(1)} ${py(reg[i][1]).toFixed(1)}`);
    return `M${top.join('L')}L${bottom.join('L')}Z`;
  }).join('');
}

export const fmtHour = (h) => {
  let hh = Math.floor(h), mm = Math.round(((h - hh) * 60) / 5) * 5; if (mm === 60) { hh += 1; mm = 0; }
  const ap = hh >= 12 ? 'pm' : 'am', h12 = ((hh + 11) % 12) + 1;
  return `${h12}:${String(mm).padStart(2, '0')} ${ap}`;
};
