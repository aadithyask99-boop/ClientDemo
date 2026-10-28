import { writeFileSync } from "node:fs"; import { createRequire } from "node:module"; import { execSync } from "node:child_process";
const { chromium } = createRequire(execSync("npm root -g").toString().trim() + "/")("playwright");
const out = process.argv[2];
const jobs = [
  ["jar", "brew", 700, 900, { ry: -25, rx: 12, s: 1.3 }], ["jar", "brew", 700, 900, { ry: 15, rx: 8, s: 1.3 }],
  ["flavour", "caramel", 800, 700, { ry: -20, rx: 16, s: 1.5 }], ["flavour", "vanilla", 800, 700, { ry: 0, rx: 16, s: 1.5 }],
  ["sachet", "caramel", 500, 900, { ry: -20, rz: -8, s: 1.5 }], ["sachet", "brew", 500, 900, { ry: 20, rz: 8, s: 1.5 }],
];
const b = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
for (const [i, [type, fl, w, h, pose]] of jobs.entries()) {
  const p = await b.newPage({ viewport: { width: w, height: h } }); p.on("pageerror", (e) => console.log("ERR", e.message)); p.on("console", (m) => m.type() === "error" && console.log("console", m.text()));
  await p.goto(`http://localhost:8765/render/jar.html?type=${type}&flavour=${fl}&w=${w}&h=${h}`); await p.evaluate(() => window.ready);
  const d = await p.evaluate((q) => window.pose(q), pose); writeFileSync(`${out}/q${i}.png`, Buffer.from(d.split(",")[1], "base64")); await p.close();
}
await b.close();
