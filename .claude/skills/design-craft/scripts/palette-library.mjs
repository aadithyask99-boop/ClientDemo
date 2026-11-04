// A curated library of palettes: two quiet colours plus one loud accent (see references/colour.md). Pick three that fit the client and show them in the plan.
//
//   node palette-library.mjs                       list every palette with contrast checks
//   node palette-library.mjs --subject travel      only palettes tagged for a subject
//   node palette-library.mjs --mood calm           only palettes tagged for a mood (combine both)
//   node palette-library.mjs --html out.html       also write a visual sheet (a mock hero per palette)
//
// Each palette: ground, quiet (the second quiet colour), ink (text) and accent (the one loud colour). Checks: ink on ground (body text 4.5:1),
// the accent against the ground (4.5:1 means it is safe as small text; lower means use it as a fill or large type only) and the best text colour
// on the accent (4.5:1) so a button label reads. No gold or brass.
// The client's logo is a hint, not a rule: if it clashes or is weak, the palette wins and the logo appears in plain white or ink.
// Add a palette to scripts/palettes.json when the owner likes a new pairing, with moods and subjects; then run this to see the contrast.
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const here = dirname(fileURLToPath(import.meta.url));
const lib = JSON.parse(readFileSync(join(here, 'palettes.json'), 'utf8'));
const args = process.argv.slice(2);
const opt = (n) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1].toLowerCase() : null; };
const subject = opt('--subject'), mood = opt('--mood'), html = opt('--html');
const rgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const lum = (h) => { const [r, g, b] = rgb(h).map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
const cr = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
function check(p) {
  const inkOnGround = cr(p.ink, p.ground);
  const accentOnGround = cr(p.accent, p.ground);
  const texts = [['#000000', cr('#000000', p.accent)], ['#ffffff', cr('#ffffff', p.accent)], [p.ink, cr(p.ink, p.accent)], [p.ground, cr(p.ground, p.accent)]].sort((a, b) => b[1] - a[1]);
  return { inkOnGround, accentOnGround, onAccent: texts[0][0], onAccentRatio: texts[0][1] };
}
let rows = lib.filter((p) => (!subject || p.subjects.includes(subject)) && (!mood || p.moods.includes(mood)));
if (!rows.length) { console.log('No palette matches. Subjects:', [...new Set(lib.flatMap((p) => p.subjects))].join(', '), '| Moods:', [...new Set(lib.flatMap((p) => p.moods))].join(', ')); process.exit(0); }
for (const p of rows) {
  const c = check(p);
  const f = (v, t) => `${v.toFixed(1)}:1 ${v >= t ? 'ok' : 'FAIL'}`;
  console.log(`\n${p.id}  ${p.name}  [${p.source}]\n  ground ${p.ground}  quiet ${p.quiet}  ink ${p.ink}  ACCENT ${p.accent}\n  moods: ${p.moods.join(', ')}  subjects: ${p.subjects.join(', ')}\n  ink on ground ${f(c.inkOnGround, 4.5)} | accent on ground ${c.accentOnGround.toFixed(1)}:1 (${c.accentOnGround >= 4.5 ? 'safe as small text too' : c.accentOnGround >= 3 ? 'fills and large type only' : 'fill with dark text only, never small text'}) | text on accent ${c.onAccent} ${f(c.onAccentRatio, 4.5)}\n  use: ${p.use}`);
}
if (html) {
  const cards = rows.map((p) => { const c = check(p); return `<div class="c" style="background:${p.ground};color:${p.ink}"><i style="background:${p.quiet}"></i><h2 style="color:${p.quiet}">Sample headline</h2><p>${p.name}</p><b style="background:${p.accent};color:${c.onAccent}">Primary action</b><u style="color:${p.accent}">accent word</u></div>`; }).join('');
  writeFileSync(html, `<!doctype html><meta charset=utf8><style>body{margin:0;font:15px system-ui;background:#888;display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:8px;padding:8px}.c{position:relative;padding:26px;min-height:190px}.c h2{margin:0 0 8px;font-size:30px;line-height:1}.c p{margin:0 0 18px;opacity:.85}.c b{display:inline-block;padding:10px 18px;border-radius:99px}.c u{margin-left:16px;text-decoration:none;font-weight:700}.c i{position:absolute;right:0;top:0;width:44px;height:100%}</style>${cards}`);
  console.log(`\nwrote ${html}`);
}
