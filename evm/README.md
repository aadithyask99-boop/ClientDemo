# EVM Group homepage (concept)

Homepage only: a highlight reel in the design language and motion of esrbespoke.au (10,071 px, 350 words, 9 sections against 6,870, 319 and 7). Astro 7, plain CSS, GSAP (ScrollTrigger) and Lenis.

## Files
- `src/data/site.ts`: the homepage content (short, curated).
- `src/data/archive.ts`: the client's full content from the current website. Not rendered. Source for the linked pages.
- `src/scripts/main.ts`: all motion (intro, split text, scrubbed reveals, roller, pinned milestones, counters, pointer tile).
- Design system, motion spec, plan, measurements: `.claude/skills/design-craft/references/clients/evm-group-section-map.md`.

## Source material (no generated images on the page)
- Film: Coverr stock clips (free licence, no attribution).
- Photographs: CC0 from Openverse (Wikimedia Commons, WordPress photo directory, rawpixel, StockSnap). Replace with the client's own photography.
- Logos: Simple Icons SVGs. The marks belong to their owners; the client is an authorised dealer.

## Links to pages that are not built yet
`/about`, `/people`, `/history`, `/marques` (and `/marques/<name>`), `/sectors` (and `/sectors/<name>`), `/recognition`, `/reviews`, `/careers`, `/contact`. They 404 until built.

## To confirm with the client
- Copy and figures come from evmgroup.co.in. The Chairman's message (on `/about`) says 1957; the history says 1952.
- The EVM mark is redrawn as SVG in one colour (`public/evm-mark.svg`). Check it against the original.
- Labels are sentence case (owner's rule); the reference uses small uppercase.

## Run
`npm install`, `npm run dev`. Demo deploy: `node scripts/stage.mjs` (serves under `/evm`; not yet added to the root `wrangler.jsonc` or `demo-index`).
