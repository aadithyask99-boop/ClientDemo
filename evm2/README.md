# EVM Group homepage concept (evm2)

Concept homepage for EVM Group, built as inspiration from esrbespoke.au (calm editorial type, hairline lists, slow easing), not a copy. Astro, plain CSS, GSAP ScrollTrigger, Lenis (desktop pointers), three.js (hero only, loaded after first paint).

**Spine:** one road through Kerala. A red line is drawn down the page with a headlamp and a kilometre readout (000 at Maradu, up to the Munnar hills, back to 000 at home). Every section is a stop: night drive (hero), the lagoon (1952), mileposts (marques), the years like an odometer (milestones), the climb (the group), the people, the odometer (numbers), arrival.

## Run
`npm install && npm run dev`. Content is in `src/data/site.ts`. Deployed under `/evm2` via `scripts/stage.mjs` (listed in the root `wrangler.jsonc`).

## Placeholders and things to confirm
- The live site (evmgroup.co.in) could not be read on 2026-11-03 (expired TLS certificate), so all content comes from the earlier EVM capture in this repo (`evm/`). It needs client confirmation.
- All "Our story", "Every brand", "The full timeline", "Every business", "The wider team" and "Careers" links point to the home page until real URLs are confirmed.
- Photographs (Kochi fishing nets, Munnar tea) are CC0 stock; the four portraits are small (212 px) files from the earlier build and should be replaced with proper photos.
- Brand logos are Simple Icons marks; the brand notes other than Porsche were left out because the earlier capture did not tie them to a brand with certainty.
- The hero road is procedural (no model or footage). Phones with fewer than 4 cores show a static drawn road instead of WebGL.
- Distances on the rail (0, 6, 14, 52, 128, 132, 135 km) are illustrative, not surveyed.

## Checks run
Impeccable (built HTML), detail audit, media quality, motion probe vs esrbespoke.au (70% of its scroll motion, no section without motion), desktop and phone screenshots, reduced motion and no-JavaScript fallbacks.
