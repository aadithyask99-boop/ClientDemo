// Downloads the chosen Unsplash photos (picks.json: {file: "slot-index"}) at a given width, pings the download endpoint
// as Unsplash guidelines ask, and writes src/data/credits.json. The key comes from UNSPLASH_ACCESS_KEY and is never stored.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
const KEY = process.env.UNSPLASH_ACCESS_KEY;
const [picksFile, resultsFile, outDir, creditsOut] = process.argv.slice(2);
const picks = JSON.parse(readFileSync(picksFile, 'utf8'));
const results = JSON.parse(readFileSync(resultsFile, 'utf8'));
mkdirSync(outDir, { recursive: true });
const credits = [];
for (const [name, spec] of Object.entries(picks)) {
  const [ref, w] = spec.split('@'); const m = ref.match(/^([a-z]+)-(\d+)$/); const p = results[m[1]][+m[2]];
  await fetch(p.dl, { headers: { Authorization: `Client-ID ${KEY}` } });
  const img = await fetch(`${p.raw}&w=${w || 1400}&q=80&fm=jpg&fit=max`);
  writeFileSync(`${outDir}/${name}.jpg`, Buffer.from(await img.arrayBuffer()));
  credits.push({ file: `${name}.jpg`, photographer: p.user, link: p.link });
  console.log('ok', name, p.w + 'x' + p.h, p.user);
}
writeFileSync(creditsOut, JSON.stringify(credits, null, 1));
