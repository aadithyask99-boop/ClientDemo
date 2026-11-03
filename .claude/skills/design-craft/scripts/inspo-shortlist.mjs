// Discovery on details.so for the plan step: lists the free examples in a few categories, then resolves the real site of the ones you pick.
//
//   node inspo-shortlist.mjs <category> [<category> ...]        e.g. pinned-scroll steps
//   node inspo-shortlist.mjs --resolve <item path> [<item path> ...]   e.g. --resolve /inspo/gravelleduparc-dd3c5d
//
// It reads only what the free public pages show (name, tags, a link), at a human pace, and stops at the limits below. It does not log in,
// does not touch /api/, and does not collect the paid library. The point is to find real live sites worth studying; study them on their own
// sites with capture-site.mjs and motion-probe.mjs, and borrow mechanisms, never code, images or text.
// Limits: 3 categories and 8 resolved items per run, 2.5 s between page loads. For breadth beyond the free slice use the official MCP.
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
const req = createRequire(import.meta.url);
function loadPlaywright() {
  for (const t of [() => req('playwright'), () => req(`${process.env.PLAYWRIGHT_DIR}/playwright`), () => req('/opt/node-tools/node_modules/playwright'), () => req(`${execSync('npm root -g').toString().trim()}/playwright`)]) { try { return t(); } catch {} }
  throw new Error('Playwright not found. Set PLAYWRIGHT_DIR.');
}
const { chromium } = loadPlaywright();
const BASE = 'https://www.details.so';
const args = process.argv.slice(2);
const resolveMode = args[0] === '--resolve';
const items = args.filter((a) => !a.startsWith('--'));
if (!items.length) { console.error('usage: node inspo-shortlist.mjs <category> [...]  |  --resolve <item path> [...]'); process.exit(1); }
if (!resolveMode && items.length > 3) { console.error('At most 3 categories per run.'); process.exit(1); }
if (resolveMode && items.length > 8) { console.error('At most 8 items per run.'); process.exit(1); }
const pause = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, userAgent: 'design-research-bot (human-paced, free pages only)' });

if (!resolveMode) {
  for (const cat of items) {
    await page.goto(`${BASE}/inspo/category/${cat}`, { waitUntil: 'load', timeout: 60000 }).catch(() => {});
    await page.waitForTimeout(3500);
    const cards = await page.evaluate(() => {
      const out = new Map();
      for (const a of document.querySelectorAll('a[href^="/inspo/"]')) {
        const href = a.getAttribute('href');
        if (/category|\/site\//.test(href) && !/\/site\//.test(href)) continue;
        let el = a; for (let i = 0; i < 4 && el.parentElement; i++) { el = el.parentElement; if ((el.innerText || '').replace(/\s+/g, ' ').length > 18) break; }
        const text = (el.innerText || '').replace(/\s+/g, ' ').trim();
        if (/\/site\//.test(href)) { const slug = href.replace('/inspo/site/', ''); const o = out.get(slug) || { slug }; o.text = text.slice(0, 120); out.set(slug, o); }
        else { const m = href.match(/^\/inspo\/([a-z0-9-]+?)-[0-9a-f]{6}$/); if (m) { const o = out.get(m[1]) || { slug: m[1] }; o.item = href; out.set(m[1], o); } }
      }
      return [...out.values()];
    });
    // a card has a site link (slug with the domain ending) and an item link (name plus a hash): join them on the name
    const sites = cards.filter((c) => c.text), itemsOnly = cards.filter((c) => c.item && !c.text);
    const rows = sites.map((c) => { const it = itemsOnly.filter((i) => c.slug.startsWith(i.slug + '-')).sort((a, b) => b.slug.length - a.slug.length)[0]; return { ...c, item: it && it.item }; });
    console.log(`\n== ${cat} (${rows.length} free examples)`);
    for (const c of rows) console.log(`  ${c.slug.padEnd(28)} ${String(c.text || '').slice(0, 62).padEnd(62)} ${c.item || ''}`);
    await pause(2500);
  }
} else {
  for (const path of items) {
    await page.goto(`${BASE}${path}`, { waitUntil: 'load', timeout: 60000 }).catch(() => {});
    await page.waitForTimeout(3000);
    const r = await page.evaluate(() => ({ title: document.title, url: ([...document.querySelectorAll('a')].find((a) => /visit/i.test(a.innerText)) || {}).href }));
    console.log(`${path}  ->  ${r.url || 'no link found'}   (${r.title})`);
    await pause(2500);
  }
}
await browser.close();
