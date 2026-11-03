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
