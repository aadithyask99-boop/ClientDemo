// Usage: UNSPLASH_ACCESS_KEY=... node scripts/unsplash-search.mjs slots.json outdir
// Searches each slot, saves small thumbs + results.json so a human can pick, never stores the key.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
const KEY = process.env.UNSPLASH_ACCESS_KEY;
const [slotsFile, out] = process.argv.slice(2);
mkdirSync(out, { recursive: true });
const slots = JSON.parse(readFileSync(slotsFile, 'utf8'));
const res = {};
for (const [slot, q] of Object.entries(slots)) {
  const r = await fetch(`https://api.unsplash.com/search/photos?query=${encodeURIComponent(q)}&per_page=12&content_filter=high`, { headers: { Authorization: `Client-ID ${KEY}` } });
  if (!r.ok) { console.error(slot, r.status); continue; }
  const d = await r.json();
  res[slot] = d.results.map((p) => ({ id: p.id, w: p.width, h: p.height, user: p.user.name, link: p.links.html, dl: p.links.download_location, raw: p.urls.raw, thumb: p.urls.small, desc: p.alt_description }));
  for (const [i, p] of res[slot].entries()) {
    const t = await fetch(p.thumb); writeFileSync(`${out}/${slot}-${i}.jpg`, Buffer.from(await t.arrayBuffer()));
  }
  console.log(slot, res[slot].length);
}
writeFileSync(`${out}/results.json`, JSON.stringify(res, null, 1));
