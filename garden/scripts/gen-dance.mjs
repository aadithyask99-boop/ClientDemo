// Makes the dance clip from the couple still (art-raw/couple-small.jpg). By default the still is BOTH the first and last frame
// so the clip loops; with DANCE_LAST=0 only the first frame is fixed, so the clip can end in a different pose (the dip).
//   ../scripts/env.sh run -- node scripts/gen-dance.mjs
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const key = process.env.OPENROUTER_API_KEY;
if (!key) throw new Error('OPENROUTER_API_KEY missing (run through scripts/env.sh run)');
const raw = process.env.ART_RAW || 'art-raw';
const model = process.env.DANCE_MODEL || 'alibaba/wan-3.0';
const frame = `data:image/jpeg;base64,${readFileSync(`${raw}/couple-small.jpg`).toString('base64')}`;
const H = { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' };

const duration = Number(process.env.DANCE_DURATION || 6);
const out = process.env.DANCE_OUT || 'dance';
const prompt = process.env.DANCE_PROMPT ||
  'A slow romantic waltz. The bride and groom turn gently together, then the groom leans the bride back into a graceful, gentle dip with her veil and gown trailing, ' +
  'holds the dip for a moment, then lifts her smoothly back up so they end standing together exactly as they began. ' +
  'Static camera, the flat ivory background stays exactly the same, the hand-embroidered stitched textile look is preserved, smooth slow movement, the couple stays in place.';

const body = {
  model,
  prompt,
  resolution: '480p',
  aspect_ratio: '3:4',
  duration,
  frame_images: [
    { type: 'image_url', image_url: { url: frame }, frame_type: 'first_frame' },
    // DANCE_LAST=0 leaves the ending free (a one-shot dance that ends in the dip) instead of looping back to the still
    ...(process.env.DANCE_LAST === '0' ? [] : [{ type: 'image_url', image_url: { url: frame }, frame_type: 'last_frame' }]),
  ],
};

const r = await fetch('https://openrouter.ai/api/v1/videos', { method: 'POST', headers: H, body: JSON.stringify(body) });
const j = await r.json();
console.log('submit', r.status, JSON.stringify(j).slice(0, 600));
if (!r.ok || !j.polling_url) process.exit(1);

for (let i = 0; i < 90; i++) {
  await new Promise((s) => setTimeout(s, 8000));
  const p = await (await fetch(j.polling_url, { headers: H })).json();
  console.log(i, p.status, p.error || '');
  if (p.status === 'completed') {
    console.log(JSON.stringify(p).slice(0, 500));
    const url = (p.unsigned_urls || p.urls || [])[0];
    const v = await fetch(url, { headers: { Authorization: `Bearer ${key}` } });
    mkdirSync(raw, { recursive: true });
    writeFileSync(`${raw}/${out}.mp4`, Buffer.from(await v.arrayBuffer()));
    console.log(`saved ${out}.mp4`, p.usage?.cost ?? '');
    break;
  }
  if (p.status === 'failed') { console.log(JSON.stringify(p)); process.exit(1); }
}
