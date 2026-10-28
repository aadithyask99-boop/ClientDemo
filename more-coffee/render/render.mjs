// node render.mjs hero|seq <outDir>   -> PNG frames with alpha (convert with to-webp.py)
import { writeFileSync, mkdirSync } from "node:fs"; import { createRequire } from "node:module"; import { execSync } from "node:child_process";
const { chromium } = createRequire(execSync("npm root -g").toString().trim() + "/")("playwright");
const [mode, out] = process.argv.slice(2); mkdirSync(out, { recursive: true });
const ss = (t) => t * t * (3 - 2 * t), lerp = (a, b, t) => a + (b - a) * t;

// ---- hero sprite: 23 frames, upright jar turning (the page tilts the canvas) ----
const hero = (i) => { const t = i / 22; return [{ ry: lerp(-34, 18, t), rx: lerp(5, -3, t), s: 1.38, y: -0.15 }]; };

// ---- scroll sequence: 200 frames, jar choreography keyed to the card timeline ----
const K0 = [
  [0.00, { s: 0, x: -2.7, y: -4.8, ry: -40, rz: -14 }],
  [0.03, { s: .88, x: -2.7, y: -4.6, ry: -30, rz: -14 }],
  [0.15, { s: .88, x: -2.7, y: -0.15, ry: 20, rz: -11 }],
  [0.31, { s: .88, x: -2.7, y: 0.0, ry: 170, rz: -9 }],
  [0.37, { s: .88, x: 2.7, y: 0.1, ry: 215, rz: 9 }],
  [0.52, { s: .88, x: 2.7, y: 0.0, ry: 330, rz: 10 }],
  [0.58, { s: .88, x: -2.7, y: 0.1, ry: 380, rz: -10 }],
  [0.72, { s: .88, x: -2.7, y: 0.0, ry: 500, rz: -9 }],
  [0.78, { s: .88, x: 2.7, y: 0.1, ry: 545, rz: 9 }],
  [0.87, { s: .88, x: 2.7, y: 0.0, ry: 640, rz: 12 }],
  [0.92, { s: 1.15, x: 0, y: 0.2, ry: 700, rz: -22, rx: 8 }],
  [0.96, { s: 1.2, x: 0, y: -0.1, ry: 720, rz: 0, rx: 0 }],
  [1.00, { s: 1.2, x: 0, y: -0.9, ry: 720, rz: 0, rx: 0 }],
];
const K1 = [[0, { s: 0, x: -3, y: -6, ry: 730, rz: 14 }], [0.90, { s: 0, x: -3, y: -6, ry: 730, rz: 14 }], [0.94, { s: 1.0, x: -3.0, y: -6, ry: 730, rz: 14 }], [1, { s: 1.0, x: -2.6, y: -2.3, ry: 700, rz: 12 }]];
const K2 = [[0, { s: 0, x: 3, y: -6, ry: 710, rz: -14 }], [0.90, { s: 0, x: 3, y: -6, ry: 710, rz: -14 }], [0.94, { s: 1.0, x: 3.0, y: -6, ry: 710, rz: -14 }], [1, { s: 1.0, x: 2.6, y: -2.3, ry: 740, rz: -12 }]];
const at = (K, p, z) => { let i = 0; while (i < K.length - 2 && p > K[i + 1][0]) i++; const [p0, a] = K[i], [p1, b] = K[i + 1]; const t = Math.min(1, Math.max(0, (p - p0) / (p1 - p0)));
  const o = { z }; for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) o[k] = lerp(a[k] ?? 0, b[k] ?? 0, k === "ry" ? t : ss(t)); return o; };
const seq = (i) => { const p = i / 199; return [at(K0, p, 0.5), at(K1, p, -0.4), at(K2, p, -0.4)]; };

const cfg = mode === "hero" ? { n: 23, w: 900, h: 1100, f: hero } : { n: 200, w: 1200, h: 750, f: seq };
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
