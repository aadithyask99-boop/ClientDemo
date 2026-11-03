// Attention-to-detail audit: repetition and redundancy that the other checks do not see.
//
//   node detail-audit.mjs <url> [--wait 7000]
//
// Reports: (1) every image and video with the sections it appears in, flagging a file used in more than one section, and different files whose
// alt text describes the same subject; (2) text repeated across sections (exact lines, and shared runs of words); (3) numbers and years stated in
// three or more sections; (4) every navigation-like layer (fixed or sticky bars, nav elements, section labels, "see all" links) and destinations
// linked many times. It reports; you judge. One fact in one place, each photograph once, one navigation system.
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
const wait = Number(args[args.indexOf('--wait') + 1]) || 7000;
if (!url) { console.error('usage: node detail-audit.mjs <url> [--wait 7000]'); process.exit(1); }

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto(url, { waitUntil: 'load', timeout: 60000 }).catch(() => {});
await page.waitForTimeout(wait);
const total = await page.evaluate(() => document.documentElement.scrollHeight);
for (let y = 0; y <= total; y += 500) { await page.evaluate((v) => window.scrollTo(0, v), y); await page.waitForTimeout(220); }
await page.evaluate(() => window.scrollTo(0, 0)); await page.waitForTimeout(1200);
const d = await page.evaluate(() => {
  const secs = [...document.querySelectorAll('section, footer, main > *')].filter((e, i, a) => a.indexOf(e) === i && e.getBoundingClientRect().height > 250);
  const secOf = (el) => secs.findIndex((s) => s.contains(el)) + 1;
  const fname = (u) => (u || '').split('/').slice(-1)[0].split('?')[0];
  const media = [];
  for (const im of document.images) { const r = im.getBoundingClientRect(); if (r.width > 60 && !/\.svg$/i.test(im.currentSrc)) media.push({ file: fname(im.currentSrc), sec: secOf(im), alt: im.alt || '' }); }
  for (const v of document.querySelectorAll('video')) media.push({ file: fname(v.currentSrc || (v.querySelector('source') || {}).src), sec: secOf(v), alt: '(video)' });
  for (const el of document.querySelectorAll('body *')) { const m = getComputedStyle(el).backgroundImage.match(/url\(["']?([^"')]+)["']?\)/); if (m && el.getBoundingClientRect().width > 60) media.push({ file: fname(m[1]), sec: secOf(el), alt: '(background)' }); }
  const text = secs.map((s) => (s.innerText || '').replace(/\s+/g, ' ').trim());
  const lines = {};
  for (const el of document.querySelectorAll('p, h1, h2, h3, li, a, span, div')) { if (el.children.length > 2) continue; const t = (el.innerText || '').replace(/\s+/g, ' ').trim(); if (t.length > 25 && t.length < 400) (lines[t] = lines[t] || new Set()).add(secOf(el)); }
  const layers = [];
  for (const e of document.querySelectorAll('body *')) {
    const cs = getComputedStyle(e); const r = e.getBoundingClientRect(); const t = (e.innerText || '').replace(/\s+/g, ' ').trim();
    const isNav = e.tagName === 'NAV' || /nav|menu|breadcrumb/i.test((e.className || '').toString());
    const stuck = (cs.position === 'fixed' || cs.position === 'sticky') && e.querySelector('a, button') && r.width > 40 && r.height < 120;
    if ((isNav || stuck) && t && t.length < 120 && r.width > 20) layers.push({ what: `${e.tagName.toLowerCase()}${e.className ? '.' + e.className.toString().split(' ')[0] : ''}`, pos: cs.position, text: t.slice(0, 60) });
  }
  const labels = [...document.querySelectorAll('.label, [class*="label"], [class*="eyebrow"], [class*="kicker"]')].filter((e) => (e.innerText || '').trim().length < 40 && (e.innerText || '').trim()).map((e) => ({ text: e.innerText.trim().replace(/\s+/g, ' '), sec: secOf(e) }));
  const hrefs = {}; for (const a of document.querySelectorAll('a[href]')) { const h = a.getAttribute('href'); if (h && h !== '#' && !h.startsWith('#')) hrefs[h] = (hrefs[h] || 0) + 1; }
  return { nSec: secs.length, media, text, lines: Object.entries(lines).map(([t, s]) => [t, [...s]]), layers, labels, hrefs };
});
await browser.close();

console.log(`${url}: ${d.nSec} sections`);
// 1. media
const byFile = new Map(); for (const m of d.media) { const e = byFile.get(m.file) || { secs: new Set(), alt: m.alt, n: 0 }; e.secs.add(m.sec); e.n++; byFile.set(m.file, e); }
const files = [...byFile.entries()];
console.log(`\n1. Images and video: ${files.length} distinct files across ${d.nSec} sections`);
for (const [f, e] of files) if (e.secs.size > 1) console.log(`   REUSED  ${f} in sections ${[...e.secs].join(', ')} (${e.n} places)`);
const stop = new Set(['the', 'a', 'an', 'of', 'in', 'on', 'at', 'and', 'with', 'by', 'for', 'to', 'from', 'near', 'view']);
const toks = (s) => new Set(s.toLowerCase().replace(/[^a-z ]/g, ' ').split(' ').filter((w) => w.length > 2 && !stop.has(w)));
for (let i = 0; i < files.length; i++) for (let j = i + 1; j < files.length; j++) { const a = toks(files[i][1].alt), b = toks(files[j][1].alt); const shared = [...a].filter((w) => b.has(w)); if (a.size >= 3 && shared.length >= 3) console.log(`   SAME SUBJECT? ${files[i][0]} and ${files[j][0]} both read "${shared.join(' ')}" (alt text)`); }
// 2. repeated text
console.log('\n2. Repeated text');
let any = false;
for (const [t, s] of d.lines) if (s.length > 1) { any = true; console.log(`   EXACT in sections ${s.join(', ')}: ${t.slice(0, 90)}`); }
const sh = d.text.map((t) => { const w = t.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter(Boolean); const set = new Set(); for (let i = 0; i + 3 <= w.length; i++) set.add(w.slice(i, i + 3).join(' ')); return set; });
for (let i = 0; i < sh.length; i++) for (let j = i + 1; j < sh.length; j++) { const shared = [...sh[i]].filter((x) => sh[j].has(x)); if (shared.length >= 4) { any = true; console.log(`   SHARED WORDING sections ${i + 1} and ${j + 1}: "${shared.slice(0, 3).join('" / "')}"${shared.length > 3 ? ` and ${shared.length - 3} more` : ''}`); } }
if (!any) console.log('   none found');
// 3. numbers and years
const nums = new Map();
d.text.forEach((t, i) => { for (const m of t.match(/\b(1[89]\d\d|20[0-3]\d)\b|\b\d{1,3}(?:,\d{3})+\b/g) || []) { const e = nums.get(m) || new Set(); e.add(i + 1); nums.set(m, e); } });
console.log('\n3. Numbers and years in 3 or more sections');
const rep = [...nums.entries()].filter(([, s]) => s.size >= 3);
console.log(rep.length ? rep.map(([n, s]) => `   ${n} in sections ${[...s].join(', ')}`).join('\n') : '   none');
// 4. navigation
console.log('\n4. Navigation-like layers (bars, menus, sticky items) and labels');
const seen = new Set(); for (const l of d.layers) { const k = l.what + l.text; if (seen.has(k)) continue; seen.add(k); console.log(`   ${l.what} (${l.pos}): "${l.text}"`); }
console.log(`   section labels: ${d.labels.map((l) => `${l.sec}:"${l.text}"`).join(' | ')}`);
const many = Object.entries(d.hrefs).filter(([, n]) => n >= 3);
console.log(many.length ? `   destinations linked 3 or more times: ${many.map(([h, n]) => `${h} x${n}`).join(', ')}` : '   no destination is linked 3 or more times');
console.log('\nOne fact in one place, each photograph once, one navigation system. Section labels that repeat a navigation word read as a second navbar.');
