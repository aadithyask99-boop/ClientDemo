// Suggests colour palettes from a brand colour and checks their contrast, so colour comes from the client's core idea and reads well.
//
//   node palette.mjs <brand hex> [--html out.html]
//   node palette.mjs --classics            the tried pairings we use as starting points
//
// For the brand colour it prints four candidate palettes (brand on light, brand ground on dark, a sparing complement, a quiet analogue),
// each as roles: ground, ink, muted, accent and, where useful, spark, with the contrast of every role against the ground and a pass or fail
// for body text (4.5:1) and large text (3:1). Accents that fail are nudged until they pass. A mood line says what the colour usually means.
// It suggests; it does not decide. Judge the palette on the page, and let the client's logo, product and subject lead.
import { writeFileSync } from 'node:fs';
const args = process.argv.slice(2);
const hexArg = args.find((a) => /^#?[0-9a-f]{6}$/i.test(a));
const htmlIdx = args.indexOf('--html');

const toRgb = (h) => { h = h.replace('#', ''); return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)); };
const toHex = (r) => '#' + r.map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('');
function rgbToHsl([r, g, b]) { r /= 255; g /= 255; b /= 255; const mx = Math.max(r, g, b), mn = Math.min(r, g, b); let h = 0, s = 0; const l = (mx + mn) / 2; const d = mx - mn;
  if (d) { s = d / (1 - Math.abs(2 * l - 1)); h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h *= 60; if (h < 0) h += 360; } return [h, s * 100, l * 100]; }
function hslToHex(h, s, l) { h = ((h % 360) + 360) % 360; s = Math.max(0, Math.min(100, s)) / 100; l = Math.max(0, Math.min(100, l)) / 100; const c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs(((h / 60) % 2) - 1)), m = l - c / 2;
  const [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x]; return toHex([(r + m) * 255, (g + m) * 255, (b + m) * 255]); }
const lum = (hex) => { const [r, g, b] = toRgb(hex).map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
const contrast = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
const mix = (a, b, t) => toHex(toRgb(a).map((v, i) => v + (toRgb(b)[i] - v) * t));
// nudge the lightness of a colour until it reaches the target contrast against a ground
function reach(hex, ground, target, dir) { let [h, s, l] = rgbToHsl(toRgb(hex)); for (let i = 0; i < 80 && contrast(hslToHex(h, s, l), ground) < target; i++) l += dir; return hslToHex(h, s, l); }

if (args.includes('--classics')) {
  const rows = [
    ['White and blue', '#ffffff', '#0b3d91', 'trust, clarity, care, finance, health (Doves UK uses #084b9a)'],
    ['Ivory and burgundy', '#f7f1e8', '#6d1a36', 'heritage, professional, hospitality, legal, wine'],
    ['Cream and forest', '#f4f1e8', '#1f4d3a', 'natural, calm, estates, wellbeing, finance'],
    ['Charcoal and signal orange', '#1b1b1b', '#ff5a1f', 'modern, confident, creative, trades (our portfolio)'],
    ['Cream and plum', '#f4ede3', '#2d2230', 'intimate, care, beauty (ILE IFE)'],
    ['Oat and espresso with toffee', '#f1e8d8', '#3a2113', 'warm, tactile, food and drink (Brew More)'],
    ['Black and white with one red', '#ffffff', '#d6111c', 'automotive, performance, editorial restraint; red only as a small accent'],
  ];
  console.log('Tried pairings (ground, accent, what it says):');
  for (const [n, g, a, m] of rows) console.log(`  ${n.padEnd(30)} ${g}  ${a}  contrast ${contrast(g, a).toFixed(1)}:1   ${m}`);
  process.exit(0);
}
if (!hexArg) { console.error('usage: node palette.mjs <brand hex> [--html out.html]  |  --classics'); process.exit(1); }
const seed = ('#' + hexArg.replace('#', '')).toLowerCase();
const [h, s, l] = rgbToHsl(toRgb(seed));

function mood() {
  const red = (h < 15 || h >= 330) && !(h >= 330 && l >= 55);
  const name = s < 12 ? 'a neutral' : red ? (l < 32 ? 'a deep red / burgundy' : 'a red') : h < 40 ? 'an orange' : h < 65 ? 'a yellow / gold' : h < 165 ? 'a green' : h < 200 ? 'a teal' : h < 255 ? 'a blue' : h < 290 ? 'a purple' : 'a pink / magenta';
  const says = s < 12 ? 'restraint, editorial' : red ? (l < 32 ? 'heritage, professional, warm authority; pairs with ivory and charcoal' : 'energy, performance, urgency; use small and sparingly') : h < 40 ? 'warm, friendly, active' : h < 65 ? 'optimism, or luxury when deep and used on black' : h < 165 ? 'nature, growth, calm, trust in finance and wellbeing' : h < 200 ? 'fresh, clean, technical' : h < 255 ? 'trust, clarity, corporate calm' : h < 290 ? 'creative, premium, care' : 'playful, expressive, beauty';
  return `${name} (hue ${Math.round(h)}, saturation ${Math.round(s)}%, lightness ${Math.round(l)}%): ${says}`;
}
const quiet = Math.min(s, 28);
const lightGround = hslToHex(h, Math.min(quiet, 22), 97), lightInk = hslToHex(h, Math.min(s, 30), 9);
const darkGround = hslToHex(h, Math.min(s, 40), 9), darkInk = hslToHex(h, Math.min(quiet, 18), 95);
const compl = hslToHex(h + 180, Math.max(30, Math.min(s, 55)), l < 40 ? 55 : 42);
const palettes = [
  { name: 'A. Brand on light (the professional default)', note: 'near-white ground tinted toward the brand, near-black ink, the brand colour as the single accent', ground: lightGround, ink: lightInk, accent: reach(seed, lightGround, 4.5, -1) },
  { name: 'B. Brand ground, dark', note: 'a very deep version of the brand colour as the ground, near-white ink, a lifted brand colour as accent', ground: darkGround, ink: darkInk, accent: reach(seed, darkGround, 4.5, +1) },
  { name: 'C. Contrast pair, sparing', note: 'light ground and ink, the brand colour plus its complement used on about 5% of the page (one button, one line, one number)', ground: lightGround, ink: lightInk, accent: reach(seed, lightGround, 4.5, -1), spark: reach(compl, lightGround, 3, -1) },
  { name: 'D. Quiet analogue', note: 'neighbouring hues for a calm, close palette; an accent that is a tint of the brand colour', ground: lightGround, ink: lightInk, accent: reach(hslToHex(h + 28, Math.min(s, 60) * 0.85, Math.max(l, 34)), lightGround, 4.5, -1) },
].map((p) => { let t = 0.45, muted = mix(p.ink, p.ground, t); while (t > 0.05 && contrast(muted, p.ground) < 4.6) { t -= 0.05; muted = mix(p.ink, p.ground, t); } return { ...p, muted, line: mix(p.ink, p.ground, 0.85) }; });

console.log(`Brand colour ${seed}: ${mood()}`);
const pass = (c) => (c >= 4.5 ? 'AA text' : c >= 3 ? 'large text only' : 'FAIL');
for (const p of palettes) {
  console.log(`\n${p.name}\n  ${p.note}`);
  for (const role of ['ground', 'ink', 'muted', 'accent', 'spark', 'line']) if (p[role]) { const c = contrast(p[role], p.ground); console.log(role === 'ground' ? `  ${role.padEnd(7)} ${p[role]}` : `  ${role.padEnd(7)} ${p[role]}   on ground ${c.toFixed(1).padStart(4)}:1  ${role === 'line' ? '(hairlines; not text)' : pass(c)}`); }
  const onAccent = contrast(p.ground, p.accent); console.log(`  text on accent (ground colour on the accent, for buttons): ${onAccent.toFixed(1)}:1 ${pass(onAccent)}`);
}
console.log('\nRules: one accent; ground and ink carry about 90% of the page; no gradients except to depict real light; every text colour at 4.5:1 or better on its ground (3:1 for large type). Start from the client\'s logo and subject, and from the reference\'s own colour rules.');
if (htmlIdx > -1) {
  const out = args[htmlIdx + 1];
  const card = (p) => `<section style="background:${p.ground};color:${p.ink};padding:28px;border:1px solid ${p.line}"><h3 style="margin:0 0 6px;font:600 16px system-ui">${p.name}</h3><p style="margin:0 0 14px;color:${p.muted};font:14px system-ui">${p.note}</p><div style="display:flex;gap:10px;flex-wrap:wrap">${['ground', 'ink', 'muted', 'accent', 'spark'].filter((r) => p[r]).map((r) => `<div style="width:120px"><div style="height:56px;background:${p[r]};border:1px solid ${p.line}"></div><div style="font:12px system-ui;margin-top:4px">${r} ${p[r]}</div></div>`).join('')}</div><p style="font:600 28px/1.15 system-ui;margin:18px 0 8px">A headline in the ink colour</p><p style="color:${p.muted};font:16px system-ui;margin:0 0 14px">Body copy in the muted colour, to check it reads.</p><span style="display:inline-block;background:${p.accent};color:${p.ground};padding:10px 18px;font:600 14px system-ui">A button in the accent</span></section>`;
  writeFileSync(out, `<!doctype html><meta charset="utf-8"><title>Palette ${seed}</title><body style="margin:0;display:grid;grid-template-columns:repeat(2,1fr);gap:0">${palettes.map(card).join('')}</body>`);
  console.log(`\nWrote ${out}`);
}
