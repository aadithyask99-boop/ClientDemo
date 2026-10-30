// Generates the invitation artwork with bytedance-seed/seedream-5-0-flash on OpenRouter.
// Usage (key comes from the encrypted env file):
//   ../scripts/env.sh run -- node scripts/gen-art.mjs [name ...]
// Raw images go to $ART_RAW (default ./art-raw, gitignored). Run scripts/key.py afterwards
// to cut out the transparent pieces and write the webp files into public/art.
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';

const key = process.env.OPENROUTER_API_KEY;
if (!key) throw new Error('OPENROUTER_API_KEY missing (run through scripts/env.sh run)');
const raw = process.env.ART_RAW || 'art-raw';
mkdirSync(raw, { recursive: true });

const STYLE =
  'Hand-embroidered textile artwork, raised satin-stitch and French-knot thread on ivory linen, ' +
  'soft studio light, macro photo realism, muted palette of sage green, ivory, champagne gold, dusty rose and wisteria lilac. ' +
  'No text, no letters, no numbers, no watermark.';

const KEY = (c) => `Isolated on a perfectly flat, uniform pure ${c} background with no shadow, no gradient, no floor, edges fully clear of the frame.`;

const ART = {
  linen: { ratio: '1:1', prompt: 'Flat top-down seamless texture of fine sage green linen fabric, even soft light, subtle weave, no seam, no folds, no stitching, no objects. Photographic.' },
  seal: { ratio: '1:1', prompt: `A single oval scalloped ivory wax seal with a baroque cartouche edge and a thin gold embroidered border, blank smooth centre, seen straight on, centred. ${KEY('green #00FF00')}` },
  villa: { ratio: '9:16', prompt: `${STYLE} Portrait scene: an embroidered Provençal stone farmhouse with sage shutters and terracotta roof, cypress trees, a lavender path and a stone fountain, framed at the top by draped ivory curtains edged with pearl beads. Golden-hour glow.` },
  garland: { ratio: '16:9', prompt: `${STYLE} A wide hanging garland of wisteria clusters, cream roses, trailing ivy and strands of pearls, spanning the full width and hanging from the top edge. ${KEY('magenta #FF00FF')}` },
  roses: { ratio: '16:9', prompt: `${STYLE} Only the embroidered motif itself, cut out with no cloth patch, no fabric edge and no frame: a wide low border of dusty-rose and cream roses, sage leaves, lavender sprigs and buds, spanning the full width, with a ragged organic outline. ${KEY('magenta #FF00FF')}` },
  swans: { ratio: '1:1', prompt: `${STYLE} Only the embroidered motif itself, cut out with no cloth patch, no fabric edge and no frame: two white swans facing each other, their necks curving to form a heart, tiny pearl highlights on the feathers, floating on a short ragged strip of teal water stitches. ${KEY('green #00FF00')}` },
  arch: { ratio: '3:4', prompt: `${STYLE} An arch-shaped frame of roses, wisteria, pearls and sage leaves, open and empty in the middle so the middle shows the plain background colour. ${KEY('magenta #FF00FF')}` },
};

const want = process.argv.slice(2);
for (const [name, a] of Object.entries(ART)) {
  if (want.length && !want.includes(name)) continue;
  if (existsSync(`${raw}/${name}.png`) || existsSync(`${raw}/${name}.jpg`)) { console.log('skip', name); continue; }
  const body = { model: 'bytedance-seed/seedream-5-0-flash', modalities: ['image'], image_config: { aspect_ratio: a.ratio }, messages: [{ role: 'user', content: a.prompt }] };
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', { method: 'POST', headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const d = await res.json();
  const url = d.choices?.[0]?.message?.images?.[0]?.image_url?.url;
  if (!url) { console.log('FAIL', name, JSON.stringify(d).slice(0, 300)); continue; }
  const m = url.match(/^data:image\/(\w+);base64,(.*)$/s);
  writeFileSync(`${raw}/${name}.${m[1] === 'jpeg' ? 'jpg' : m[1]}`, Buffer.from(m[2], 'base64'));
  console.log('ok', name, 'cost', d.usage?.cost);
}
