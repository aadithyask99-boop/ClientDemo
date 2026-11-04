// Targeted lookup on motionsites.ai for hero and section ideas: lists the public preview cards under a tag and captures frames of their preview videos.
//
//   node motionsites-shortlist.mjs list <Tag> [<Tag> ...]                      e.g. list Travel 3d
//   node motionsites-shortlist.mjs shots <Tag> <count> --out <dir> [--find <text>]   frames from the first <count> previews (1 s and 4 s in)
//
// Tags are the gallery's own filter buttons (Travel, 3d, Interactive, Landing Page, Hero, Portfolio, Agency, Creative, Wellness ...).
// Choose tags from the client's subject, never crawl everything. It reads only what the public gallery shows (title, tag, the preview video);
// it does not log in and does not touch the paid prompts. Use it after drafting the three hero options, write the MECHANISM of each idea in one
// sentence, and borrow mechanisms, never a template's scene, type, palette or code.
// Limits: 3 tags per list, 12 shots per run, 2.5 s between actions. Stills do not show scroll behaviour; for that open the card (?prompt=<slug>)
// and scroll it, or run motion-probe.mjs on a live site that does the same.
import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';
const req = createRequire(import.meta.url);
function loadPlaywright() {
  for (const t of [() => req('playwright'), () => req(`${process.env.PLAYWRIGHT_DIR}/playwright`), () => req('/opt/node-tools/node_modules/playwright')]) { try { return t(); } catch {} }
  throw new Error('Playwright not found. Set PLAYWRIGHT_DIR.');
}
const { chromium } = loadPlaywright();
const [mode, ...rest] = process.argv.slice(2);
const outI = rest.indexOf('--out'); const out = outI >= 0 ? rest[outI + 1] : null;
const findI = rest.indexOf('--find'); const find = findI >= 0 ? rest[findI + 1].toLowerCase() : null;
const pos = rest.filter((a, i) => !a.startsWith('--') && rest[i - 1] !== '--out' && rest[i - 1] !== '--find');
if (!['list', 'shots'].includes(mode) || !pos.length) { console.error('usage: list <Tag>... | shots <Tag> <count> --out <dir>'); process.exit(1); }
const pause = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, userAgent: 'design-research-bot (human-paced, public previews only)' });
async function openTag(tag) {
  await page.goto('https://motionsites.ai/', { waitUntil: 'load', timeout: 60000 }).catch(() => {});
  await page.waitForTimeout(3500);
  await page.getByRole('button', { name: tag, exact: true }).click().catch(() => { console.error(`No tag button "${tag}"`); });
  await page.waitForTimeout(3000);
}
const cardsOf = () => page.evaluate(() => [...document.querySelectorAll('video')].map((v, i) => {
  let e = v; for (let k = 0; k < 5 && e.parentElement; k++) { e = e.parentElement; if ((e.innerText || '').trim().length > 3) break; }
  const text = (e.innerText || '').replace(/\s+/g, ' ').trim();
  return { i, text: text.slice(0, 60), src: v.currentSrc || v.src || '' };
}).filter((c) => c.src && !/BACKGROUNDS/.test(c.text)));

if (mode === 'list') {
  if (pos.length > 3) { console.error('At most 3 tags per list.'); process.exit(1); }
  for (const tag of pos) { await openTag(tag); const cards = await cardsOf(); console.log(`\n== ${tag} (${cards.length} previews)`); for (const c of cards) console.log(`- ${c.text}  |  ${c.src.split('/').pop()}`); await pause(2500); }
} else {
  const tag = pos[0]; const count = Math.min(Number(pos[1] || 8), 12);
  if (!out) { console.error('--out <dir> is required for shots'); process.exit(1); }
  mkdirSync(out, { recursive: true });
  await openTag(tag);
  let cards = await cardsOf(); if (find) cards = cards.filter((c) => c.text.toLowerCase().includes(find));
  cards = cards.slice(0, count);
  for (const c of cards) {
    const vid = page.locator('video').nth(c.i);
    await vid.scrollIntoViewIfNeeded().catch(() => {}); await pause(1200);
    for (const [n, t] of [['a', 1], ['b', 4]]) {
      await vid.evaluate((v, tt) => { try { v.currentTime = tt; v.play().catch(() => {}); } catch {} }, t).catch(() => {}); await pause(900);
      const name = `${tag.replace(/\W+/g, '')}-${String(c.i).padStart(2, '0')}-${c.text.replace(/\W+/g, '_').slice(0, 30)}-${n}.png`;
      await vid.screenshot({ path: `${out}/${name}` }).catch(() => {});
    }
    console.log(`shot: ${c.text}`); await pause(2500);
  }
}
await browser.close();
