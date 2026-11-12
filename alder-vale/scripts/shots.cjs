// Takes screenshots of the built page at fixed scroll positions: node scripts/shots.cjs <url> <outdir> [width height]
const { chromium } = require('playwright');
const fs = require('fs');
(async () => {
  const [url, out, w = '1440', h = '900'] = process.argv.slice(2);
  fs.mkdirSync(out, { recursive: true });
  const b = await chromium.launch();
  const p = await (await b.newContext({ viewport: { width: +w, height: +h }, deviceScaleFactor: 1 })).newPage();
  const errs = [];
  p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
  p.on('pageerror', (e) => errs.push('PAGEERR ' + e.message));
  p.on('requestfailed', (r) => errs.push('REQFAIL ' + r.url()));
  await p.goto(url, { waitUntil: 'load' });
  await p.waitForTimeout(1200);
  await p.screenshot({ path: `${out}/00-loader.png` });
  await p.waitForTimeout(4200);
  await p.screenshot({ path: `${out}/01-hero.png` });
  const ids = ['collection', 'proof', 'weather', 'specs', 'shelf', 'lookbook', 'log', 'drop', 'footer'];
  let n = 2;
  for (const id of ids) {
    const info = await p.evaluate((id) => { const e = document.getElementById(id); const r = e.getBoundingClientRect(); return { top: r.top + scrollY, h: r.height }; }, id);
    const stops = id === 'weather' ? [0.1, 0.3, 0.55, 0.8, 1.0] : id === 'specs' ? [0.1, 0.4, 0.7, 0.95] : id === 'log' ? [0.15, 0.5, 0.95] : id === 'collection' ? [0, 0.5] : id === 'footer' ? [0.0, 0.6] : [0.1];
    for (const s of stops) {
      const pinned = ['weather', 'specs', 'log'].includes(id);
      const y = pinned ? info.top + (info.h - +h) * s : info.top + Math.max(0, info.h - +h) * s - (id === 'footer' ? 0 : 0);
      await p.evaluate((y) => window.scrollTo(0, y), y);
      await p.waitForTimeout(1700);
      await p.screenshot({ path: `${out}/${String(n++).padStart(2, '0')}-${id}-${Math.round(s * 100)}.png` });
    }
  }
  console.log('errors:', errs.length ? errs.join('\n') : 'none');
  await b.close();
})();
