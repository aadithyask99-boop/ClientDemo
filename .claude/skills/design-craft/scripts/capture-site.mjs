// Captures an existing site so its current design can be understood before it is improved.
//
//   node capture-site.mjs <url> [--out captures/<name>] [--video] [--no-phone]
//
// Writes into the output folder:
//   desktop-full.png, desktop-01.png ...   full page (capped at 16000 px) and viewport-height strips at 1440 wide
//   phone-full.png, phone-01.png ...       the same at 390 wide
//   design-language.json, report.md         fonts, sizes, colours, headings, libraries, SEO basics, speed, internal links
//   scroll.webm, scroll-sheet.png           (with --video) a real-time recording of a smooth scroll, and a contact sheet of it
//
// The video is real time, so it can stutter on heavy pages; it is for understanding motion, not for the portfolio.
// For a smooth 60 fps clip use portfolio/scripts/record-demo.mjs (slow, 5 to 15 minutes).
// Only point this at pages the owner is allowed to review (a client's own site). It loads one page, it does not crawl.
import { mkdirSync, writeFileSync, readdirSync, renameSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { execSync, spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';

const req = createRequire(import.meta.url);
function loadPlaywright() {
  const tries = [() => req('playwright'), () => req(`${process.env.PLAYWRIGHT_DIR}/playwright`), () => req('/opt/node-tools/node_modules/playwright'),
    () => req(`${execSync('npm root -g').toString().trim()}/playwright`)];
  for (const t of tries) { try { return t(); } catch {} }
  throw new Error('Playwright not found. Set PLAYWRIGHT_DIR to the folder that contains it.');
}
const { chromium } = loadPlaywright();

const args = process.argv.slice(2);
const url = args.find((a) => /^https?:\/\//.test(a));
if (!url) { console.error('usage: node capture-site.mjs <url> [--out dir] [--video] [--no-phone]'); process.exit(1); }
const opt = (n, d) => { const i = args.indexOf(`--${n}`); return i > -1 ? args[i + 1] : d; };
const host = new URL(url).hostname.replace(/^www\./, '');
const out = resolve(opt('out', `captures/${host}`));
mkdirSync(out, { recursive: true });

async function settle(page) {
  await page.goto(url, { waitUntil: 'load', timeout: 60000 }).catch((e) => console.log('goto:', e.message.split('\n')[0]));
  await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(2500);
}
async function lazyScroll(page) { // reveals lazy images and scroll-triggered sections, then returns to the top
  await page.evaluate(async () => {
    await new Promise((done) => {
      let y = 0;
      const t = setInterval(() => {
        window.scrollBy(0, 450); y += 450;
        if (y > document.documentElement.scrollHeight + 450 || y > 30000) { clearInterval(t); window.scrollTo(0, 0); setTimeout(done, 700); }
      }, 160);
    });
  });
}
async function shoot(browser, label, viewport, mobile) {
  const ctx = await browser.newContext({ viewport, isMobile: mobile, hasTouch: mobile, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  await settle(page);
  await lazyScroll(page);
  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  await page.screenshot({ path: join(out, `${label}-full.png`), fullPage: true, clip: { x: 0, y: 0, width: viewport.width, height: Math.min(height, 16000) } }).catch((e) => console.log('fullPage failed:', e.message.split('\n')[0]));
  const strips = Math.min(Math.ceil(height / viewport.height), label === 'phone' ? 16 : 14);
  for (let i = 0; i < strips; i++) {
    await page.evaluate((y) => window.scrollTo(0, y), i * viewport.height);
    await page.waitForTimeout(900);
    await page.screenshot({ path: join(out, `${label}-${String(i + 1).padStart(2, '0')}.png`) });
  }
  console.log(`${label}: page height ${height}px${height > 16000 ? ' (full-page image is cut at 16000; use the strips)' : ''}, ${strips} strips`);
  let data = null;
  if (label === 'desktop') { await page.evaluate(() => window.scrollTo(0, 0)); await page.waitForTimeout(500); data = await page.evaluate(extract); }
  await ctx.close();
  return data;
}

// Runs inside the page. Weighted by how much text uses each value, so decoration does not outvote the real design.
async function extract() {
  const cv = document.createElement('canvas'); cv.width = cv.height = 1;
  const g = cv.getContext('2d', { willReadFrequently: true });
  const hex = (c) => { // any CSS colour to #rrggbb; null when mostly transparent
    if (!c || c === 'transparent') return null;
    g.clearRect(0, 0, 1, 1); g.fillStyle = '#000'; g.fillStyle = c; g.fillRect(0, 0, 1, 1);
    const [r, gg, b, a] = g.getImageData(0, 0, 1, 1).data;
    if (a < 128) return null;
    return '#' + [r, gg, b].map((n) => n.toString(16).padStart(2, '0')).join('');
  };
  const bump = (o, k, w) => { if (k) o[k] = (o[k] || 0) + w; };
  const top = (o, n = 8) => Object.entries(o).sort((a, b) => b[1] - a[1]).slice(0, n).map(([k, v]) => ({ value: k, weight: Math.round(v) }));
  const pageBg = hex(getComputedStyle(document.body).backgroundColor) || hex(getComputedStyle(document.documentElement).backgroundColor);
  const fonts = {}, sizes = {}, weights = {}, textColors = {}, bgAreas = {}, accents = {};
  const vw = innerWidth;
  for (const el of document.querySelectorAll('body *')) {
    const r = el.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) continue;
    const cs = getComputedStyle(el);
    if (cs.visibility === 'hidden' || cs.display === 'none' || +cs.opacity === 0) continue;
    const own = [...el.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent.trim()).join(' ');
    if (own.length > 1) {
      bump(fonts, cs.fontFamily.split(',')[0].replace(/["']/g, '').trim(), own.length);
      bump(sizes, Math.round(parseFloat(cs.fontSize)) + 'px', own.length);
      bump(weights, cs.fontWeight, own.length);
      bump(textColors, hex(cs.color), own.length);
    }
    const bg = hex(cs.backgroundColor);
    if (bg && r.width * r.height > 20000) bump(bgAreas, bg, Math.min(r.width, vw) * r.height / 1000);
    if ((el.tagName === 'A' || el.tagName === 'BUTTON') && bg) bump(accents, bg, 1);
  }
  const text = (s, n = 14) => [...document.querySelectorAll(s)].map((e) => e.innerText.trim().replace(/\s+/g, ' ')).filter(Boolean).slice(0, n);
  const links = {};
  for (const a of document.querySelectorAll('a[href]')) {
    try { const u = new URL(a.href, location.href); if (u.origin === location.origin && u.pathname !== location.pathname) links[u.pathname] = (a.innerText || '').trim().replace(/\s+/g, ' ').slice(0, 40); } catch {}
  }
  const meta = (n) => document.querySelector(`meta[name="${n}"],meta[property="${n}"]`)?.content || null;
  const html = document.documentElement.innerHTML;
  const libs = { gsap: !!window.gsap, scrollTrigger: !!window.ScrollTrigger, three: !!window.THREE, lenis: !!window.Lenis, jquery: !!window.jQuery, swiper: !!window.Swiper,
    webflow: !!window.Webflow, wordpress: /wp-content|wp-includes/.test(html), wix: !!window.wixBiSession, squarespace: !!window.Static?.SQUARESPACE_CONTEXT, shopify: !!window.Shopify,
    next: !!window.__NEXT_DATA__, framer: /framer/i.test(meta('generator') || '') || !!document.querySelector('[data-framer-name]'), astro: !!document.querySelector('astro-island,[data-astro-cid]') || /astro/i.test(meta('generator') || '') };
  const nav = performance.getEntriesByType('navigation')[0];
  const res = performance.getEntriesByType('resource');
  const seen = (type) => new Promise((resolve) => { const out = []; try { new PerformanceObserver((l) => out.push(...l.getEntries())).observe({ type, buffered: true }); } catch { return resolve(out); } setTimeout(() => resolve(out), 400); });
  const lcp = (await seen('largest-contentful-paint')).slice(-1)[0];
  const cls = (await seen('layout-shift')).filter((e) => !e.hadRecentInput).reduce((s, e) => s + e.value, 0);
  return {
    url: location.href, pageBackground: pageBg, pageHeight: document.documentElement.scrollHeight, wordCount: (document.body.innerText || '').split(/\s+/).filter(Boolean).length,
    fontsInUse: top(fonts, 6), loadedFontFaces: [...new Set([...document.fonts].filter((f) => f.status === 'loaded').map((f) => f.family.replace(/["']/g, '')))],
    fontSizes: top(sizes, 10), fontWeights: top(weights, 5), textColors: top(textColors, 6),
    backgroundColorsByArea: top(bgAreas, 6), buttonAndLinkBackgrounds: top(accents, 5),
    headings: { h1: text('h1', 4), h2: text('h2', 12), h3: text('h3', 12) },
    navLinks: text('header a, nav a', 20), buttons: text('button, [class*="btn"], [class*="button"], a[class*="cta"]', 14),
    internalLinks: links,
    counts: { images: document.images.length, videos: document.querySelectorAll('video').length, canvases: document.querySelectorAll('canvas').length, svgs: document.querySelectorAll('svg').length, iframes: document.querySelectorAll('iframe').length, sections: document.querySelectorAll('section').length },
    libraries: Object.keys(libs).filter((k) => libs[k]),
    seo: { title: document.title, description: meta('description'), canonical: document.querySelector('link[rel=canonical]')?.href || null, lang: document.documentElement.lang || null,
      h1Count: document.querySelectorAll('h1').length, imagesMissingAlt: [...document.images].filter((i) => !i.hasAttribute('alt')).length, ogImage: meta('og:image'),
      jsonLdBlocks: document.querySelectorAll('script[type="application/ld+json"]').length, viewportMeta: !!document.querySelector('meta[name=viewport]') },
    speed: { lcpMs: lcp ? Math.round(lcp.startTime) : null, cls: Math.round(cls * 1000) / 1000, domContentLoadedMs: nav ? Math.round(nav.domContentLoadedEventEnd) : null,
      requests: res.length, transferKB: Math.round((res.reduce((s, r) => s + (r.transferSize || 0), 0) + (nav?.transferSize || 0)) / 1024) },
  };
}

const browser = await chromium.launch();
const desktop = await shoot(browser, 'desktop', { width: 1440, height: 900 }, false);
if (!args.includes('--no-phone')) await shoot(browser, 'phone', { width: 390, height: 844 }, true);

if (args.includes('--video')) {
  const vdir = join(out, '_video');
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 }, recordVideo: { dir: vdir, size: { width: 1280, height: 720 } } });
  const page = await ctx.newPage();
  await page.goto(url, { waitUntil: 'load', timeout: 60000 }).catch(() => {});
  await page.waitForTimeout(5000);
  const total = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight);
  const steps = 60;
  for (let i = 1; i <= steps; i++) { await page.mouse.wheel(0, Math.max(40, Math.min(total, 9000) / steps)); await page.waitForTimeout(200); }
  await page.waitForTimeout(1500);
  await ctx.close();
  const f = readdirSync(vdir).find((x) => x.endsWith('.webm'));
  if (f) {
    renameSync(join(vdir, f), join(out, 'scroll.webm'));
    const probe = spawnSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', join(out, 'scroll.webm')]);
    const dur = parseFloat(probe.stdout?.toString()) || 20;
    spawnSync('ffmpeg', ['-v', 'error', '-y', '-i', join(out, 'scroll.webm'), '-vf', `fps=12/${dur},scale=360:-2,tile=4x3:padding=4:color=white`, '-frames:v', '1', join(out, 'scroll-sheet.png')]);
    console.log(`video: ${dur.toFixed(1)} s -> scroll.webm, scroll-sheet.png`);
  }
}
await browser.close();

writeFileSync(join(out, 'design-language.json'), JSON.stringify(desktop, null, 2));
const d = desktop || {};
const list = (a) => (a || []).map((x) => `${x.value} (${x.weight})`).join(', ') || 'none found';
writeFileSync(join(out, 'report.md'), `# Captured: ${url}

Fonts used (by amount of text): ${list(d.fontsInUse)}
Font sizes: ${list(d.fontSizes)}
Weights: ${list(d.fontWeights)}
Text colours: ${list(d.textColors)}
Background colours (by area): ${list(d.backgroundColorsByArea)}
Button and link backgrounds: ${list(d.buttonAndLinkBackgrounds)}
Libraries and platform (only those exposed as globals; bundled libraries such as GSAP in an Astro build are not detected): ${(d.libraries || []).join(', ') || 'none detected'}
Page background: ${d.pageBackground}
Counts: ${JSON.stringify(d.counts)}
Speed: ${JSON.stringify(d.speed)}
SEO basics: ${JSON.stringify(d.seo)}

Headings
- h1: ${(d.headings?.h1 || []).join(' | ')}
- h2: ${(d.headings?.h2 || []).join(' | ')}

Nav: ${(d.navLinks || []).join(' | ')}
Other pages found (path: link text):
${Object.entries(d.internalLinks || {}).slice(0, 25).map(([p, t]) => `- ${p}  ${t}`).join('\n')}
`);
console.log(`Done. Output in ${out}`);
