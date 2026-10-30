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
  couple: { ratio: '3:4', prompt: `${STYLE} A bride and groom standing close together, full length, turned toward each other tenderly. She wears a long ivory gown with a lace veil and holds a bouquet of dusty-rose roses and lavender. He wears a charcoal tailcoat, cream waistcoat and a small rose buttonhole. Simple gentle faces, tiny pearl details, standing on a short ragged strip of sage grass stitches. Set on a perfectly flat, plain, warm ivory (#F5EFE4) background with nothing else, no frame, no shadow, generous empty margin all round.` },
  venue: { ratio: '3:4', prompt: `${STYLE} Portrait scene: an embroidered Georgian glass orangery with tall arched windows glowing with warm lantern light, set in a walled rose garden at dusk, a gravel path, climbing roses on old brick, strings of tiny lights and a sky of soft peach and lilac. No people.` },
  petals: { ratio: '3:2', prompt: `${STYLE} Six separate loose pieces laid out in a grid of three columns and two rows with wide empty gaps between them: two dusty-rose rose petals, one cream petal, one wisteria lilac blossom, one sage-green leaf, one gold-edged olive leaf. Each piece is small, simple and clearly separated from the others. ${KEY('green #00FF00')}` },
  scenery: { ratio: '16:9', prompt: `${STYLE} Three separate complete objects laid out in a row with wide empty gaps between them, each one cut out cleanly with NO cloth patch, NO fabric backing, NO square or rounded frame and no drop shadow, only the stitched object itself: on the left a small stone village church with a slender spire, arched windows and a tiled roof on a tiny mound of grass; in the middle a large spreading oak tree with a full green crown and sturdy trunk on a tiny mound of grass; on the right a wooden garden bench with a few wildflowers and ivy at its feet. ${KEY('magenta #FF00FF')}` },
  hills: { ratio: '16:9', prompt: `${STYLE} Only the embroidered motif itself, cut out with no cloth patch: a wide panorama strip of gently rolling hills in three overlapping layers of sage, olive and deep green, with tiny round trees, a winding pale path and a few wildflower dots. The tops of the hills meet empty background and the bottom of the hills runs to the bottom edge of the image. ${KEY('magenta #FF00FF')}` },
  vine: { ratio: '9:16', prompt: `${STYLE} Only the embroidered motif itself, cut out with no cloth patch: a tall, narrow, vertical garland of climbing ivy with small white jasmine flowers and a few lilac wisteria clusters, hanging from the top edge and running down to the bottom edge, slim and fairly straight with ragged organic edges. ${KEY('magenta #FF00FF')}` },
  flutter: { ratio: '3:2', prompt: `${STYLE} Six separate small pieces laid out in a grid of three columns and two rows with wide empty gaps between them, each one cut out cleanly with NO cloth patch, NO fabric backing, NO square or rounded frame and no drop shadow, only the stitched shape itself: three butterflies seen from above with wings fully open (one soft sky blue, one golden yellow, one white with pale lilac edges), and three leaves (a green ivy leaf, a sprig of olive leaves, a small russet autumn leaf). ${KEY('magenta #FF00FF')}` },
  pearls: { ratio: '16:9', prompt: `${STYLE} Only the embroidered motif itself, cut out with no cloth patch and no fabric edge: a wide horizontal border band made of two strands of large pearls, a row of teal-green beads, and a trailing vine of dusty-rose roses and sage leaves, running the full width of the image, with ragged organic top and bottom edges. ${KEY('magenta #FF00FF')}` },
  curtain: { ratio: '16:9', prompt: `${STYLE} Only the embroidered motif itself, cut out with no cloth patch and no fabric edge: a very wide curtain of hanging wisteria clusters in lilac and white with pearl strands and trailing ivy, hanging from the top edge across the full width, many long clusters of varying lengths reaching down about two thirds of the image, ragged organic lower edge. ${KEY('magenta #FF00FF')}` },
  rosevine: { ratio: '9:16', prompt: `${STYLE} Only the embroidered motif itself, cut out with no cloth patch and no fabric edge: a tall single trailing vine of dusty-rose roses, sage leaves and gold-thread tendrils, hanging from the top edge and running to the bottom edge, slim, with ragged organic edges. ${KEY('magenta #FF00FF')}` },
  archgate: { ratio: '3:4', prompt: `${STYLE} Only the embroidered motif itself, cut out with no cloth patch and no fabric edge: a grand arched gateway frame made of climbing roses, wisteria and pearls, tall and open in the middle so the middle shows only the plain background. ${KEY('magenta #FF00FF')}` },
  guests: { ratio: '16:9', prompt: `${STYLE} Only the embroidered motif itself, cut out with no cloth patch and no fabric edge: a row of six elegant wedding guests standing close together holding champagne glasses, full length, each figure cut out cleanly around its own silhouette with NO cloth patch, NO fabric backing and no halo between or around them, in garden formal attire (women in long soft sage, blush and lilac dresses, one in a wide hat; men in charcoal and cream suits), simple gentle faces, standing on a narrow ragged strip of grass. ${KEY('magenta #FF00FF')}` },
  icons: { ratio: '3:2', prompt: `${STYLE} Six separate small icons laid out in a grid of three columns and two rows with wide empty gaps, each cut out cleanly with NO cloth patch and no frame: a tiny stone chapel with a rose, two gold wedding rings, a champagne coupe with bubbles, a small tiered wedding cake with a rose on top, a vintage gramophone with music notes, a crescent moon with stars and a hanging lantern. ${KEY('magenta #FF00FF')}` },
  bowframe: { ratio: '1:1', prompt: `${STYLE} Only the embroidered motif itself, cut out with no cloth patch and no fabric edge: a large soft ivory satin ribbon bow with two long trailing ribbon tails, two dusty-rose roses and a few sage leaves tucked into the knot. ${KEY('magenta #FF00FF')}` },
  'story-umbrella': { ratio: '3:4', prompt: `${STYLE} Portrait scene: a rainy railway platform in Bath at dusk, two strangers sharing a single umbrella, warm lamplight on wet cobbles, soft grey-blue and gold. No text.` },
  'story-road': { ratio: '3:4', prompt: `${STYLE} Portrait scene: a small vintage car on a winding road through a lavender field in Provence, a stone hilltop village, golden afternoon light. No text.` },
  'story-fountain': { ratio: '3:4', prompt: `${STYLE} Portrait scene: a man kneeling to propose to a woman beside a stone fountain in a snowy walled garden at dusk, a small dog wearing a bow tie, lantern glow, gentle snowfall. No text.` },
  'story-wedding': { ratio: '3:4', prompt: `${STYLE} Portrait scene: a joyful long supper table in a rose garden at sunset with lanterns, bunting and flowers, guests laughing, warm peach light. No text.` },
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
