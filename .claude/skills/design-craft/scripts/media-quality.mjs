// Finds images and video that will look soft or pixelated at their rendered size, so weak stock or open-licence media is caught before delivery.
//
//   node media-quality.mjs <url> [--width 1440] [--height 900]
//
// It scrolls the page to load everything, then for every image, background image and video larger than 150 x 100 px reports the CSS size it is
// drawn at, the natural size of the file, how far it is stretched (a scale above 1.0 means the browser is enlarging it, which shows as softness
// or pixelation), and for video the bitrate (low bitrate shows as blocky, smeared detail). Scale 1.0 to 0.5 is sharp on a normal screen and soft on a
// retina screen; 0.5 or below is sharp on both. Needs the media files to be reachable. Judge by eye too: extract a frame at full size and look.
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
const req = createRequire(import.meta.url);
function loadPlaywright() {
  for (const t of [() => req('playwright'), () => req(`${process.env.PLAYWRIGHT_DIR}/playwright`), () => req('/opt/node-tools/node_modules/playwright'), () => req(`${execSync('npm root -g').toString().trim()}/playwright`)]) { try { return t(); } catch {} }
  throw new Error('Playwright not found. Set PLAYWRIGHT_DIR.');
}
const { chromium } = loadPlaywright();
const args = process.argv.slice(2);
const url = args.find((a) => /^https?:\/\//.test(a));
const opt = (n, d) => { const i = args.indexOf(`--${n}`); return i > -1 ? Number(args[i + 1]) : d; };
if (!url) { console.error('usage: node media-quality.mjs <url> [--width 1440] [--height 900]'); process.exit(1); }
const W = opt('width', 1440), H = opt('height', 900);

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: W, height: H } });
await page.goto(url, { waitUntil: 'load', timeout: 60000 }).catch(() => {});
await page.waitForTimeout(5000);
const total = await page.evaluate(() => document.documentElement.scrollHeight);
for (let y = 0; y <= total; y += Math.round(H * 0.6)) { await page.evaluate((v) => window.scrollTo(0, v), y); await page.waitForTimeout(350); }
await page.waitForTimeout(1500);
const items = await page.evaluate(async () => {
  const out = [];
  const big = (r) => r.width >= 150 && r.height >= 100;
  const scaleFor = (box, nat, fit) => { const sx = box.width / nat.w, sy = box.height / nat.h; return fit === 'cover' ? Math.max(sx, sy) : fit === 'contain' || fit === 'scale-down' ? Math.min(sx, sy) : sx; };
  for (const im of document.images) {
    const r = im.getBoundingClientRect(); if (!big(r) || !im.naturalWidth) continue;
    const fit = getComputedStyle(im).objectFit;
    out.push({ kind: 'image', src: im.currentSrc || im.src, box: [Math.round(r.width), Math.round(r.height)], nat: [im.naturalWidth, im.naturalHeight], scale: scaleFor(r, { w: im.naturalWidth, h: im.naturalHeight }, fit) });
  }
  for (const v of document.querySelectorAll('video')) {
    const r = v.getBoundingClientRect(); if (!big(r) || !v.videoWidth) continue;
    const fit = getComputedStyle(v).objectFit; let bytes = null;
    try { const res = await fetch(v.currentSrc, { method: 'HEAD' }); bytes = Number(res.headers.get('content-length')) || null; } catch {}
    if (!bytes) { const e = performance.getEntriesByName(v.currentSrc)[0]; bytes = e && (e.encodedBodySize || e.transferSize) || null; }
    out.push({ kind: 'video', src: v.currentSrc, box: [Math.round(r.width), Math.round(r.height)], nat: [v.videoWidth, v.videoHeight], scale: scaleFor(r, { w: v.videoWidth, h: v.videoHeight }, fit), duration: v.duration, bytes });
  }
  const seen = new Set();
  for (const el of document.querySelectorAll('body *')) {
    const bg = getComputedStyle(el).backgroundImage; const m = bg && bg.match(/url\(["']?([^"')]+)["']?\)/); if (!m) continue;
    const r = el.getBoundingClientRect(); if (!big(r) || seen.has(m[1] + r.width)) continue; seen.add(m[1] + r.width);
    const nat = await new Promise((res) => { const i = new Image(); i.onload = () => res({ w: i.naturalWidth, h: i.naturalHeight }); i.onerror = () => res(null); i.src = m[1]; });
    if (nat) out.push({ kind: 'background', src: m[1], box: [Math.round(r.width), Math.round(r.height)], nat: [nat.w, nat.h], scale: scaleFor(r, nat, getComputedStyle(el).backgroundSize === 'cover' ? 'cover' : 'none') });
  }
  return out;
});
await browser.close();
const verdict = (s) => (s > 1.0 ? 'UPSCALED: soft or pixelated' : s > 0.5 ? 'sharp on normal screens, soft on retina' : 'sharp');
const short = (u) => u.split('/').slice(-2).join('/').slice(0, 44);
console.log(`${url}  (${W}x${H}); media larger than 150 x 100 px:`);
console.log('  kind        drawn at     file size     scale  verdict                                  file');
let bad = 0, soft = 0;
for (const i of items.sort((a, b) => b.scale - a.scale)) {
  const v = verdict(i.scale); if (i.scale > 1.0) bad++; else if (i.scale > 0.5) soft++;
  console.log(`  ${i.kind.padEnd(10)} ${`${i.box[0]}x${i.box[1]}`.padEnd(11)} ${`${i.nat[0]}x${i.nat[1]}`.padEnd(11)} ${i.scale.toFixed(2).padStart(6)}  ${v.padEnd(40)} ${short(i.src)}`);
  if (i.kind === 'video') {
    const kbps = i.bytes && i.duration ? Math.round((i.bytes * 8) / i.duration / 1000) : null;
    const full = i.box[0] >= W * 0.8;
    console.log(`              video ${i.duration ? i.duration.toFixed(0) + ' s' : '?'}, ${i.bytes ? (i.bytes / 1048576).toFixed(1) + ' MB' : 'size unknown'}, about ${kbps ?? '?'} kbps${kbps && full && kbps < 1500 ? '  <- LOW BITRATE for a full-width clip: expect blockiness and smeared detail' : ''}`);
    if (i.nat[0] < 1920 && full) console.log(`              the source is ${i.nat[0]} px wide for a full-width clip: use 1080p (1920) or better`);
  }
}
console.log(`\n${bad} upscaled, ${soft} soft on retina, ${items.length - bad - soft} sharp. ${bad ? 'Replace the upscaled media with larger originals before delivering.' : 'No upscaled media.'}`);
