# Maledetta (concept)

A fictional pizzeria group in central London, built as a like-for-like replica of the design language and motion of a reference site (Tripletta, triplettapizza.com) with new content, new art and a different palette. Not a real business. Astro, plain CSS, GSAP (ScrollTrigger, Flip, SplitText), Lenis.

## Run
`npm install && npm run dev` (or `npm run build`). `node scripts/stage.mjs` builds for the shared deploy under `/maledetta`.

## What is replicated, what changed
- Same order, type (Oswald 700 and Merriweather 300), cream ground with one pale/dark pair at a time, loader of colour curtains, one sticker that travels through five places on the page with a spin (GSAP Flip), marquee of names and cut-out food, sunburst, wall of love with prints at different scroll speeds, tagline band, menu overlay (areas, sites, a cursor arrow that springs in, banner that expands).
- Changed: English and London; our own mascot and food; Unsplash photography; palette B (green, red, Tube blue, plum, tangerine; no gold or yellow); the infinite scroll is replaced by a real footer (links, marquee, wordmark and mascot, back to top). The palette still advances when the footer is reached, as the reference does at its loop.
- Left out on purpose (owner rules): hairline rules and the faint vertical grid lines of the wall; body text is 16px or larger (the reference uses 14px).
- Menu: the reference links each restaurant to its own page. There are no sub-pages here, so the last step opens a full-screen site card (address, hours, Book a table).

## Easter eggs
Click the mascot (bite, embers, wordmark flicker); type "ciao" or press and hold the mascot on touch (food rain); click the sunburst (next colour pair).

## Placeholders (invented)
Brand name, nine sites and their addresses, phone numbers (020 7946 0xxx is the range reserved for fiction), opening hours, the shop (no shop exists), all links (`#` or `mailto:hello@maledetta.example`), socials, Book a table. Photography: Unsplash (credits in `src/data/credits.json` and the page source). The mascot and food are generated with Seedream 5.0 Flash (about $0.28 in total): the mascot is woodcut line art turned into a mask (`scripts/process-art.py`, 4 wobbled frames played with CSS steps), the food was shot on magenta and keyed out. The wordmark is rendered once from Oswald through a displacement filter (`scripts/render-wordmark.mjs`).

## Regenerating assets
`scripts/unsplash-search.mjs` and `scripts/unsplash-get.mjs` (key in `UNSPLASH_ACCESS_KEY`, never committed; picks in `art-src/picks.json`). Generation: `.claude/skills/design-craft/scripts/gen-media.mjs art-src/jobs.json`. In a cloud session run node with `NODE_USE_ENV_PROXY=1 NODE_EXTRA_CA_CERTS=/root/.ccr/ca-bundle.crt`, or the proxy-injected OpenRouter key is not applied and requests return 401.
