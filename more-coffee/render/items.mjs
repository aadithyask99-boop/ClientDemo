// node items.mjs <outDir>  -> flavour tubs ("dose"), sachets ("pack") and the brand sachet as transparent PNGs
import { writeFileSync, mkdirSync } from "node:fs"; import { createRequire } from "node:module"; import { execSync } from "node:child_process";
const { chromium } = createRequire(execSync("npm root -g").toString().trim() + "/")("playwright");
const out = process.argv[2]; mkdirSync(out, { recursive: true });
const fl = ["caramel", "hazelnut", "vanilla", "fudge", "cinnamon"];
const jobs = [...fl.map((f) => [`dose-${f}`, "flavour", f, 1100, 900, { ry: -18, rx: 16, s: 1.5 }]), ...fl.map((f) => [`pack-${f}`, "sachet", f, 560, 1000, { ry: -16, rz: -6, s: 1.25 }]), ["pack-brew", "sachet", "brew", 560, 1000, { ry: -16, rz: -6, s: 1.25 }]];
const b = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
for (const [name, type, f, w, h, pose] of jobs) {
  const p = await b.newPage({ viewport: { width: w, height: h } }); p.on("pageerror", (e) => console.log("ERR", e.message));
  await p.goto(`http://localhost:8765/render/jar.html?type=${type}&flavour=${f}&w=${w}&h=${h}`); await p.evaluate(() => window.ready);
  const d = await p.evaluate((q) => window.pose(q), pose); writeFileSync(`${out}/${name}.png`, Buffer.from(d.split(",")[1], "base64")); await p.close(); console.log(name);
}
await b.close();
