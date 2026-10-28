// node render.mjs hero|seq <outDir>   -> PNG frames with alpha (convert with to-webp.py)
import { writeFileSync, mkdirSync } from "node:fs"; import { createRequire } from "node:module"; import { execSync } from "node:child_process";
const { chromium } = createRequire(execSync("npm root -g").toString().trim() + "/")("playwright");
const [mode, out] = process.argv.slice(2); mkdirSync(out, { recursive: true });
const ss = (t) => t * t * (3 - 2 * t), lerp = (a, b, t) => a + (b - a) * t;

// ---- hero sprite: 23 frames, upright jar turning (the page tilts the canvas) ----
const hero = (i) => { const t = i / 22; return [{ ry: lerp(-34, 18, t), rx: lerp(5, -3, t), s: 1.4, y: -0.15 }]; };

// ---- scroll sequence: 200 frames, jar choreography keyed to the card timeline ----
// positions (smoothstep between keys). Card centres cross at p = .03 (R), .20 (L), .37 (R), .53 (L); title rises .64-.9
const L = -2.9, R_ = 2.9;
const K0 = [
  [0.000, { s: 0, x: L, y: -4.8, rz: -14 }],
  [0.015, { s: .88, x: L, y: -4.6, rz: -14 }],
  [0.100, { s: .88, x: L, y: -0.15, rz: -11 }],
  [0.105, { s: .88, x: L, y: 0, rz: -10 }],
  [0.150, { s: .88, x: R_, y: 0.1, rz: 9 }],
  [0.260, { s: .88, x: R_, y: 0, rz: 10 }],
  [0.310, { s: .88, x: L, y: 0.1, rz: -10 }],
  [0.425, { s: .88, x: L, y: 0, rz: -9 }],
  [0.475, { s: .88, x: R_, y: 0.1, rz: 9 }],
  [0.585, { s: .88, x: R_, y: 0, rz: 12 }],
  [0.660, { s: 1.15, x: 0, y: 0.2, rz: -20, rx: 8 }],
  [0.720, { s: 1.2, x: 0, y: -0.1, rz: 0, rx: 0 }],
  [0.900, { s: 1.2, x: 0, y: -0.1, rz: 0, rx: 0 }],
  [1.000, { s: 1.2, x: 0, y: -0.9, rz: 0, rx: 0 }],
];
const RY = [[0, -40], [0.015, -30], [0.1, 20], [0.72, 720], [1, 720]];                 // continuous spin, ends facing front
const K1 = [[0, { s: 0, x: -3, y: -6, rz: 14 }], [0.90, { s: 0, x: -3, y: -6, rz: 14 }], [0.94, { s: 1.0, x: -3.0, y: -6, rz: 14 }], [1, { s: 1.0, x: -2.6, y: -2.3, rz: 12 }]];
const K2 = [[0, { s: 0, x: 3, y: -6, rz: -14 }], [0.90, { s: 0, x: 3, y: -6, rz: -14 }], [0.94, { s: 1.0, x: 3.0, y: -6, rz: -14 }], [1, { s: 1.0, x: 2.6, y: -2.3, rz: -12 }]];
const ryAt = (p) => { let i = 0; while (i < RY.length - 2 && p > RY[i + 1][0]) i++; const [p0, a] = RY[i], [p1, b] = RY[i + 1]; return lerp(a, b, Math.min(1, Math.max(0, (p - p0) / (p1 - p0)))); };
const at = (K, p, z) => { let i = 0; while (i < K.length - 2 && p > K[i + 1][0]) i++; const [p0, a] = K[i], [p1, b] = K[i + 1]; const t = Math.min(1, Math.max(0, (p - p0) / (p1 - p0)));
  const o = { z }; for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) o[k] = lerp(a[k] ?? 0, b[k] ?? 0, ss(t)); o.ry = ryAt(p) + (z < 0 ? (K === K1 ? 10 : -10) : 0); return o; };
const seq = (i) => { const p = i / 199; return [at(K0, p, 0.5), at(K1, p, -0.4), at(K2, p, -0.4)]; };

const cfg = mode === "hero" ? { n: 23, w: 1200, h: 1467, f: hero } : { n: 200, w: 2400, h: 1500, f: seq };
const b = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
const pg = await b.newPage({ viewport: { width: cfg.w, height: cfg.h } });
pg.on("pageerror", (e) => console.log("ERR", e.message));
await pg.goto(`http://localhost:8765/render/jar.html?w=${cfg.w}&h=${cfg.h}`); await pg.evaluate(() => window.ready);
for (let i = 0; i < cfg.n; i++) {
  const d = await pg.evaluate((l) => window.poses(l), cfg.f(i));
  writeFileSync(`${out}/${String(i).padStart(3, "0")}.png`, Buffer.from(d.split(",")[1], "base64"));
  if (i % 20 === 0) console.log(mode, i);
}
await b.close();
