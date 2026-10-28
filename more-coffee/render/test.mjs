import { writeFileSync } from "node:fs"; import { createRequire } from "node:module"; import { execSync } from "node:child_process";
const { chromium } = createRequire(execSync("npm root -g").toString().trim() + "/")("playwright");
const out = process.argv[2];
const b = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
const p = await b.newPage({ viewport: { width: 800, height: 800 } });
p.on("console", (m) => console.log("page:", m.text())); p.on("pageerror", (e) => console.log("ERR", e.message));
await p.goto("http://localhost:8765/render/jar.html?size=800"); await p.waitForFunction(() => window.ready, null, { timeout: 60000 }); await p.evaluate(() => window.ready);
const poses = [{ ry: 0, rz: -11 }, { ry: 40, rz: -11 }, { ry: 90, rz: -11 }, { ry: 180, rz: -11 }, { ry: -35, rz: -11, rx: 14 }, { ry: 0, rz: 0, rx: 0 }];
for (let i = 0; i < poses.length; i++) { const t0 = Date.now(); const d = await p.evaluate((q) => window.pose(q), poses[i]); writeFileSync(`${out}/pose${i}.png`, Buffer.from(d.split(",")[1], "base64")); console.log("pose", i, Date.now() - t0, "ms"); }
await b.close();
