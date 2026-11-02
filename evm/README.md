# EVM Group homepage (concept)

Homepage only. Astro 7, plain CSS, GSAP and Lenis. All content lives in `src/data/site.ts`.

## Direction
Reference: esrbespoke.au. Job A: its design system and signature moments (intro, typed headline, black and white, three-column grid, statement, full-bleed photograph, marques roller with a sticky tile, numbered rows, footer wordmark). Job B: all of EVM's content, designed as new sections in the same type, grid, colours and motion. The design system, content inventory and section map are in `.claude/skills/design-craft/references/clients/evm-group-section-map.md`.
Font: Hanken Grotesk. Colours: black, white, greys. No red anywhere. Labels are sentence case (owner's rule), the reference uses small uppercase.

## Content source and what needs the client
- Copy comes from evmgroup.co.in (pages, its public data endpoints, and the contact blocks in its script bundle). Typos are fixed.
- Figures "68 years" and "12 lakh customers" are the old site's 2020 numbers. Update them.
- The Chairman's message says the group was established in 1957; the history says 1952. The client should choose.
- Both messages are excerpts: the old site only shows the opening paragraphs behind "Read more".
- Portraits for directors and top management are placeholders (initials in a tile). Real portraits needed.
- The Datsun caption is only its name: the old site has no text for it. EUROREPAR, a sector with no content, is left out.
- Contact and careers forms are a front-end demo. They send nothing. Connect them to the client's mail endpoint.
- Car, motorcycle, truck, hotel, plantation, cinema and showroom images are generated for this concept (cars from the client's own press photos as references). Replace with real photography.
- The hero film is cut from free Coverr stock clips (free for commercial use, no attribution).
- The EVM mark is redrawn as SVG (`public/evm-mark.svg`) in one colour, in a Times-style bold italic. Check it against the original.

## Run
`npm install`, `npm run dev`. Demo deploy: `node scripts/stage.mjs` (serves under `/evm`; not yet added to the root `wrangler.jsonc` or `demo-index`).
