// Measures how much a page moves, section by section, so "plain" or "unfinished" sections can be found and compared with a reference.
//
//   node motion-probe.mjs <url> [--vs <reference url>] [--wait 7000]
//
// For every <section> / <footer> (or, failing that, every tall top-level block) it reports:
//   scroll  elements whose transform, opacity, clip-path or filter changes while the page is scrolled (reveals, scrubs, parallax)
//   hover   interactive elements (links, buttons, images, list items) whose look changes on hover
//   pointer elements that move when the mouse moves across the section (parallax, magnetic, tilt)
// A section with all three at 0 has no motion at all. Also reports canvases, videos and the smooth-scroll response to one wheel notch
// (a faster first 60 ms means a snappier, more responsive feel). With --vs it runs the reference too and prints both side by side.
// It also looks for doubled or misaligned hairlines once each section has settled (two horizontal border lines 2 to 30 px apart that overlap).
// It measures the presence of motion, not its quality: still look at the real thing.
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
const vsIdx = args.indexOf('--vs');
const vs = vsIdx > -1 ? args[vsIdx + 1] : null;
const wait = Number(args[args.indexOf('--wait') + 1]) || 7000;
if (!url) { console.error('usage: node motion-probe.mjs <url> [--vs <reference url>] [--wait 7000]'); process.exit(1); }

async function probe(target) {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(target, { waitUntil: 'load', timeout: 60000 }).catch(() => {});
  await page.waitForTimeout(wait); // let the intro finish
  const info = await page.evaluate(() => {
    let blocks = [...document.querySelectorAll('section, footer')].filter((e) => e.getBoundingClientRect().height > 250);
    if (blocks.length < 3) blocks = [...(document.querySelector('main') || document.body).children].filter((e) => e.getBoundingClientRect().height > 300);
    blocks.forEach((b, i) => b.setAttribute('data-mp', i));
    return { n: blocks.length, total: document.documentElement.scrollHeight, vh: innerHeight };
  });
  const tuple = (sel) => page.evaluate((s) => {
    const root = document.querySelector(`[data-mp="${s}"]`); if (!root) return {};
    const out = {}; let i = 0;
    for (const el of root.querySelectorAll('*')) {
      if (i > 500) break; const r = el.getBoundingClientRect(); if (r.width < 4 || r.height < 4) continue;
      const cs = getComputedStyle(el); out[i++] = [cs.transform, cs.opacity, cs.clipPath, cs.filter].join('|');
    }
    return out;
  }, sel);
  const sections = [];
  for (let s = 0; s < info.n; s++) {
    const geo = await page.evaluate((i) => { const r = document.querySelector(`[data-mp="${i}"]`).getBoundingClientRect(); return { top: r.top + scrollY, h: r.height, name: (document.querySelector(`[data-mp="${i}"]`).innerText || '').trim().replace(/\s+/g, ' ').slice(0, 28) }; }, s);
    // scroll through the section in steps and watch it
    const seen = new Map();
    const steps = 10; const start = Math.max(0, geo.top - 700), end = Math.min(info.total - info.vh, geo.top + geo.h - 100);
    for (let k = 0; k <= steps; k++) {
      await page.evaluate((y) => window.scrollTo(0, y), Math.round(start + ((end - start) * k) / steps)); await page.waitForTimeout(260);
      const t = await tuple(s);
      for (const [key, v] of Object.entries(t)) { if (!seen.has(key)) seen.set(key, new Set()); seen.get(key).add(v); }
    }
    const scroll = [...seen.values()].filter((v) => v.size >= 2).length;
    // hover and pointer tests with the section in view
    await page.evaluate((y) => window.scrollTo(0, y), Math.round(Math.max(0, geo.top - 20))); await page.waitForTimeout(600);
    const hover = await page.evaluate(async (i) => {
      const root = document.querySelector(`[data-mp="${i}"]`); const cands = [...root.querySelectorAll('a, button, img, li, [role="button"], h2, h3')].filter((e) => { const r = e.getBoundingClientRect(); return r.width > 20 && r.height > 12 && r.top > 0 && r.bottom < innerHeight; }).slice(0, 5);
      return cands.map((e) => { const r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, i: [...root.querySelectorAll('*')].indexOf(e) }; });
    }, s);
    const look = (idx) => page.evaluate(([i, n]) => { const el = document.querySelector(`[data-mp="${i}"]`).querySelectorAll('*')[n]; if (!el) return ''; const nodes = [el, ...el.querySelectorAll('*')].slice(0, 12); return nodes.map((e) => { const c = getComputedStyle(e); return [c.transform, c.opacity, c.color, c.backgroundColor, c.filter, c.letterSpacing, c.clipPath].join('|'); }).join('#'); }, [s, idx]);
    let hoverHits = 0;
    for (const h of hover) { await page.mouse.move(5, 5); await page.waitForTimeout(150); const before = await look(h.i); await page.mouse.move(h.x, h.y); await page.waitForTimeout(500); const after = await look(h.i); if (before !== after) hoverHits++; }
    const ptBefore = await tuple(s); await page.mouse.move(300, 300); await page.waitForTimeout(150); await page.mouse.move(1100, 650, { steps: 12 }); await page.waitForTimeout(500);
    const ptAfter = await tuple(s); const pointer = Object.keys(ptAfter).filter((k) => ptAfter[k] !== ptBefore[k]).length;
    // settled-state hairlines: two horizontal lines a few pixels apart that overlap read as a doubled or misaligned border
    await page.evaluate((y) => window.scrollTo(0, y), Math.round(Math.max(0, geo.top - 20))); await page.waitForTimeout(2500);
    const lines = await page.evaluate((i) => {
      const root = document.querySelector(`[data-mp="${i}"]`); const out = [];
      const add = (y, x1, x2) => { if (x2 - x1 > 120) out.push([Math.round(y + scrollY), Math.round(x1), Math.round(x2)]); };
      const vis = (w, st, c) => parseFloat(w) >= 1 && st !== 'none' && !/rgba\(.*,\s*0\)$/.test(c);
      for (const el of [root, ...root.querySelectorAll('*')]) {
        const r = el.getBoundingClientRect(); if (r.width < 120 || r.height < 1) continue; const cs = getComputedStyle(el);
        if (vis(cs.borderTopWidth, cs.borderTopStyle, cs.borderTopColor)) add(r.top, r.left, r.right);
        if (vis(cs.borderBottomWidth, cs.borderBottomStyle, cs.borderBottomColor)) add(r.bottom, r.left, r.right);
        if (el.tagName === 'HR') add(r.top, r.left, r.right);
      }
      return out;
    }, s);
    const pairs = [];
    for (let a = 0; a < lines.length; a++) for (let b = a + 1; b < lines.length; b++) {
      const dy = Math.abs(lines[a][0] - lines[b][0]); const overlap = Math.min(lines[a][2], lines[b][2]) - Math.max(lines[a][1], lines[b][1]);
      if (dy >= 2 && dy <= 30 && overlap > 120) pairs.push(`${lines[a][0]} and ${lines[b][0]}`);
    }
    sections.push({ section: s + 1, text: geo.name, height: Math.round(geo.h), scroll, hover: `${hoverHits}/${hover.length}`, pointer, doubled: pairs.length, doubledAt: pairs.slice(0, 3).join('; ') });
  }
  await page.evaluate(() => window.scrollTo(0, 0)); await page.waitForTimeout(800);
  const misc = await page.evaluate(() => ({ canvases: document.querySelectorAll('canvas').length, videos: document.querySelectorAll('video').length }));
  await page.mouse.move(700, 450); await page.mouse.wheel(0, 400);
  const wheel = []; for (let i = 0; i < 6; i++) { await page.waitForTimeout(60); wheel.push(await page.evaluate(() => Math.round(scrollY))); }
  await browser.close();
  return { url: target, pageHeight: info.total, ...misc, wheelScrollYEvery60ms: wheel, sections };
}
const show = (r) => {
  console.log(`\n${r.url}\n  page ${r.pageHeight}px, canvases ${r.canvases}, videos ${r.videos}, wheel notch scrollY every 60 ms: ${r.wheelScrollYEvery60ms.join(', ')}`);
  console.log('  #  height  scroll  hover  pointer  doubled  starts with');
  for (const s of r.sections) console.log(`  ${String(s.section).padEnd(2)} ${String(s.height).padStart(6)}  ${String(s.scroll).padStart(6)}  ${String(s.hover).padStart(5)}  ${String(s.pointer).padStart(7)}  ${String(s.doubled).padStart(7)}  ${s.text}`);
  const dead = r.sections.filter((s) => s.scroll === 0 && s.hover.startsWith('0/') && s.pointer === 0);
  const tot = r.sections.reduce((a, s) => a + s.scroll, 0);
  console.log(`  total elements moving with scroll: ${tot}; sections with NO motion at all: ${dead.length ? dead.map((s) => s.section).join(', ') : 'none'}`);
  const dbl = r.sections.filter((s) => s.doubled > 0);
  if (dbl.length) console.log(`  DOUBLED OR MISALIGNED BORDERS (two horizontal lines 2 to 30 px apart, once settled) in sections: ${dbl.map((s) => `${s.section} (page y ${s.doubledAt})`).join(', ')}. Look at them: one of the two lines should go.`);
  return { tot, dead: dead.length, dbl: dbl.length };
};
const a = show(await probe(url));
if (vs) {
  const b = show(await probe(vs));
  console.log(`\nBuild moves with scroll ${a.tot} vs reference ${b.tot} (${b.tot ? Math.round((a.tot / b.tot) * 100) : '-'}%). Build sections with no motion: ${a.dead}.`);
  if (b.tot && a.tot / b.tot < 0.7) console.log('WARNING: the build has under 70% of the reference\'s scroll motion. It will feel plainer than the reference.');
  if (a.dead) console.log('WARNING: some sections have no motion at all; they will read as unfinished.');
  if (a.dbl) console.log('WARNING: doubled or misaligned borders in the build; fix before delivering.');
}
