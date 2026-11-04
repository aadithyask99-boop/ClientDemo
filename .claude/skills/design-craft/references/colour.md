# Colour: from the client's core idea

Colour that looks professional is chosen, not decorated. It comes from the client's core idea, and from the reference's own colour rules when there is one. The tool `scripts/palette.mjs` suggests candidates and checks contrast; the judgement is yours.

## 1. Where colour comes from
**The owner's explicit instructions come first** ("make the accent burgundy", "keep it all blue"): do what they say, check it with `palette.mjs`, and if a pairing fails contrast say so and offer the nearest one that passes. Otherwise, in this order:
1. **The reference's colour rules, when the owner loves a reference.** ESR Bespoke is black and white with no accent: keep that. Add the client's colour only if the client needs it, and then as one small accent.
2. **The client's core idea:** the logo colours, the product or subject, the audience and the mood. Read the current site's colours (`capture-site.mjs` report: text colours, background colours, button colours) and the logo. EVM is cars with a red mark; Doves is care, so calm blue; DJ ESKA's gold comes from his logo.
3. **Then the pairing rules below.** Never start from a trendy palette.

## 2. Roles
- **Ground** (background), **ink** (text), **muted** (secondary text), **accent** (one colour for actions and emphasis), **spark** (a rare second colour, about 5% of the page), **line** (hairlines).
- Ground and ink carry about 90% of the page. One accent. Colour in photography does the rest.

## 3. Contrast, always measured
- Body text at 4.5:1 or better against its ground, large type at 3:1, interface parts and icons at 3:1. Muted text counts as text.
- Text over photographs needs a scrim or a calm area; check it, do not assume.

## 4. Pairings that read as professional
Run `node .claude/skills/design-craft/scripts/palette.mjs --classics` for the list with contrast. In short:
- **White or ivory with a deep blue:** trust and clarity. **Ivory with burgundy:** heritage, authority, hospitality. **Cream with forest green:** calm, natural, estates. **Black with gold:** luxury and ceremony. **Charcoal with one signal colour (orange, red):** modern and confident. **Cream with plum:** intimate, care.
- **Contrast comes from lightness:** a deep colour on a pale ground, or a pale colour on a deep ground. Two mid-tones side by side go muddy.
- **Complementary colours** (blue and orange, burgundy and green) are for a spark: one button, one line, one number, never two equal halves.
- **Analogous colours** (neighbouring hues) make a calm, close palette; keep ink and ground neutral so it does not blur.
- **Tint the neutrals toward the brand hue** (a warm white, an ink that is nearly black but slightly red or blue) so the page feels designed, not default.

## 5. What to avoid
- Gradients as decoration (only to depict real light, such as a sunset or a glow that exists in the scene).
- Rainbow accents, neon on white, mid-grey text on white, the brand colour on everything, many tints of the same colour at equal weight.
- Colour that fights the reference: a build in a monochrome reference that suddenly turns red in large areas.

## 6. Meaning varies
Colours carry different meanings by industry and culture (white, red and gold especially). Confirm a bold choice with the owner, and prefer the client's own colours.

## 7. In a job
1. Extract the client's colours from the logo and the current site.
2. Run `palette.mjs <brand hex> --html captures/<client>/palette.html` and look at the four candidates.
3. In the plan, state the palette (ground, ink, accent and, if any, spark), the reason from the client's core idea and the reference, the contrast result, and one alternative, so the owner can choose before the build.
4. Check it on the real page (Impeccable's contrast findings and `checklist.md` item 20).

**Owner's rule: no gold.** Never propose gold, champagne, brass or metallic yellow-brown, and never use "black and gold" or "cream and gold" as a luxury default. Choose another hue from the client's logo or subject.

## Two quiet colours and one loud (owner's observation, 2026-11-04)
The owner noticed that memorable palettes are **two quiet colours plus one loud accent**, and that the accent is what makes a page feel intentional and shows the visitor where to look. Their examples: raspberry pink and mellow white, with a little pastel turquoise so you know where to click; deep maroon and tomato red with one touch of neon yellow; azure navy and snowy white with coral red; raspberry, crimson and deep red (which does not stand out) with a touch of baby yellow; sky blue and white with hot pink so the important things come forward; cobalt black and lavender violet (easy to scroll past) with tropical lime.

More of the owner's combinations (2026-11-04): dusk blue and midnight navy, calm but cool, with a splash of sunset orange so people stop; oxblood red and apricot glow, warm but sleepy, with an electric cyan (the owner wrote "electric scion", read as cyan) so nobody scrolls by; chalk white and ink black, sharp but too safe, with a hit of acid green so it is worth paying for. The owner stressed again that these are **combinations**, not assignments for backgrounds, foregrounds, titles or subtitles.

**It is a principle about proportion and role, not a colour map.** Do not assign colours by element ("titles are this, backgrounds are that"). The quiet colours carry most of the surface and the type, wherever that is. The loud accent is a **highlight laid over things**: the main action, one key word, a mark on a figure or an image, a hover or active state, a small detail that should be found. It may appear on top of a photograph, a number, a line or a shape, not only on buttons. If a palette "blends together" or is "easy to scroll past", the cure is a contrasting accent used this way, not more colours. The accent is not a tint of the quiet colours and not a second ground. Use it sparingly, a small moment per screen.

**The reference decides first.** Colour comes from, in this order: (1) what the owner says; (2) the reference's own palette when the owner loves its look (keep its colour discipline; if it already has an accent keep it, and if it has none, such as ESR, add exactly one from the client's logo or subject); (3) the client's own colours, if they are good; (4) the palette library below, as a menu of tested starting points. The library is never the only allowed set. In the plan, the three palette options may include "the reference's own palette" as one of them.

- Check contrast with `scripts/palette.mjs` or `palette-library.mjs`. Standing rules: no gold, champagne or brass; neon, baby yellow, lime, coral, turquoise and hot pink are fine.

**The palette library (a menu of tested starting points, not the only allowed colours).** `scripts/palettes.json` holds a curated list of two quiet colours plus one loud accent, tagged by mood and subject, starting with the owner's own pairings and a few added ones (marked `source`). Run `node .claude/skills/design-craft/scripts/palette-library.mjs --subject <subject> [--mood <mood>] --html palettes.html`, pick **three** that suit the client and put them in the plan with the sheet; the owner chooses. The client's logo colour is a hint, not a rule: if it is weak or clashes, the palette wins and the logo appears in plain white or ink. Log the accent you used in `fingerprints.md` so the next site picks a different one. Add a row to `palettes.json` whenever the owner likes a new pairing.

