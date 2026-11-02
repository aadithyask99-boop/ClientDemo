# EVM Group homepage (concept)

Homepage only. Astro 7, plain CSS, GSAP and Lenis. Content lives in `src/data/site.ts`.

## Direction
Reference: https://www.esrbespoke.au/ (cinematic intro, fast-cut film, plain-text navigation, scroll-driven marque list). Secondary reference: https://forgeautomotive.co.uk/ (interactivity only). Mode: inspiration. Built to the section map in `.claude/skills/design-craft/references/clients/evm-group-section-map.md`. Palette: black, white and pale grey only (no red; the EVM mark is shown in one colour). Font: Hanken Grotesk.

## Placeholder content (needs the client)
- Copy, dates, recognition and the three customer quotes come from the current site and need confirming. "68 years" and "12 lakh customers" are left out on purpose.
- Directors are listed by name and role only; no portraits (the old ones were too low resolution).
- The three customer quotes were dropped: the reference has no testimonials. They remain in the old site copy if the client wants them back.
- Porsche, BMW, MINI, Volkswagen, Skoda, Nissan, Isuzu, BMW Motorrad and Indian scenes, all five sector images and the showroom photo break are generated for this concept (the cars from the client's press photos). Replace with real photography.
- The hero film is cut from free Coverr stock clips (free for commercial use, no attribution required).
- The EVM mark is redrawn as SVG (`public/evm-mark.svg`, one colour) in a Times-style bold italic. Check it against the original. Showing it in one colour instead of the client's red follows the reference; say if the client wants the red back.
- Labels are sentence case, not uppercase, by the owner's rule (the reference uses small uppercase).
- Contact details are not in the source site copy; the footer has none yet.

## Links that lead to pages not built yet
Brand and sector rows link to these routes (they 404 until built): `/marques/{porsche,bmw,mini,volkswagen,skoda,nissan,isuzu,bmw-motorrad,indian-motorcycle}` and `/sectors/{automobile,hotels,plantation,transportation,entertainment}`. The Contact button and the footer anchor scroll in page.

## Run
`npm install`, `npm run dev`. Demo deploy: `node scripts/stage.mjs` (serves under `/evm`; not yet added to the root `wrangler.jsonc` or `demo-index`).
