# EVM Group homepage (concept)

Homepage only: a highlight reel in the design language of esrbespoke.au, about the reference's size (9,044 px, 314 words, 9 sections against 6,870, 319 and 7). Astro 7, plain CSS, GSAP and Lenis.

## Files
- `src/data/site.ts`: the homepage content (short, curated).
- `src/data/archive.ts`: the client's full content from the current website. It is not rendered. It is the source for the linked pages.
- Design system, size targets, section map and the list of what was moved: `.claude/skills/design-craft/references/clients/evm-group-section-map.md`.

## Links to pages that are not built yet
`/about`, `/people`, `/history`, `/marques` (and `/marques/<name>`), `/sectors` (and `/sectors/<name>`), `/recognition`, `/reviews`, `/careers`, `/contact`. They 404 until built.

## Placeholders and things to confirm
- Copy and figures come from evmgroup.co.in and need client confirmation. The Chairman's message (on `/about`) says 1957; the history says 1952.
- Car, motorcycle, sector and showroom images are generated for this concept (cars from the client's press photos as references). Replace with real photography.
- The hero film is cut from free Coverr stock clips (free for commercial use, no attribution).
- The EVM mark is redrawn as SVG in one colour (`public/evm-mark.svg`). Check it against the original.
- Labels are sentence case (owner's rule); the reference uses small uppercase.

## Run
`npm install`, `npm run dev`. Demo deploy: `node scripts/stage.mjs` (serves under `/evm`; not yet added to the root `wrangler.jsonc` or `demo-index`).
