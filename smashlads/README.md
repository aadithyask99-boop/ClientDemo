# Smashley's (concept)

A fictional smash-burger restaurant group in central London, built as a like-for-like replica of the design language and motion of a reference site (cravburgers.shop) with new content, new art and a different palette (cream, cobalt blue, burnt orange; no gold). Astro, plain CSS, GSAP (ScrollTrigger, SplitText), Lenis, a hand-written canvas game.

## Run
`npm install && npm run dev` (or `npm run build`). `node scripts/stage.mjs` builds for the shared deploy under `/smashlads`.

## Replicated from the reference
Mouse Memoirs plus Modak type, wavy section edges, tilted sticker tags, giant hero words with a cut-out burger, tilted photo trio, a blue band with a gloved mascot, a full-bleed photo, an orange band with a dashed route (London instead of world cities), "Feel the change" with a line-art mascot, the preloader (a burger builds, then a CRAVING flash), the nav card that drops from the top right over a blurred page, and the burger cards on a checker band with a hover details panel.

## New (not in the reference)
- **Footer game:** ingredients are tossed up; swipe or drag to slice them in two (half-sprites with juice splats and a blade trail). Bombs end the game; three missed ingredients end it; score, best (saved in localStorage) and a Reset button. Tap to start. The canvas only blocks touch scrolling while a round is live.
- **Build your own:** home-page section. Drag a layer onto the bun or tap it; it drops with a squash. Tap a layer to remove it. Live price and energy, a 12-layer cap, and a 10-layer easter egg. The layers are SVG drawn in code (`src/scripts/builder.ts`) so they stack cleanly.
- **Menu overlay:** the Burgers pill, the nav card and every Order now open a full-screen menu: categories left, items right (burger cards on the checker band for Burgers); an accordion on phones.

## Easter eggs
Press the gloved burger (it jumps and talks); type "smash" or build a 10-layer burger (ingredient rain).

## Placeholders (invented)
Brand name, addresses, phone numbers (020 7946 0xxx), prices, nutrition, all links, "Send to the kitchen" (shows a message only). Photography: Unsplash (credits in `src/data/credits.json` and the page source). Burger cut-outs, ingredient cut-outs, the gloved mascot and the line-art kid are generated with Seedream 5.0 Flash (about $0.31): food shot on magenta and keyed out (`scripts/process-art.py`), the kid as an ink mask recoloured in CSS.

## Regenerating assets
`scripts/unsplash-search.mjs`, `scripts/unsplash-get.mjs` (key in `UNSPLASH_ACCESS_KEY`, never committed; picks in `art-src/picks*.json`); generation `node .claude/skills/design-craft/scripts/gen-media.mjs art-src/jobs.json`. In a cloud session run node with `NODE_USE_ENV_PROXY=1 NODE_EXTRA_CA_CERTS=/root/.ccr/ca-bundle.crt`.
