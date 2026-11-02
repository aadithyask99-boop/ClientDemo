# EVM Group homepage (concept)

Homepage only. Astro 7, plain CSS, GSAP and Lenis. Content lives in `src/data/site.ts`.

## Direction
Reference: https://www.esrbespoke.au/ (cinematic intro, fast-cut film, plain-text navigation, scroll-driven marque list). Secondary reference: https://forgeautomotive.co.uk/ (interactivity only). Mode: inspiration. Palette: black, off-white and the EVM red. Font: Sora.

## Placeholder content (needs the client)
- Copy, dates, recognition and the three customer quotes come from the current site and need confirming. "68 years" and "12 lakh customers" are left out on purpose.
- Directors are flat placeholder avatars (`src/components/Avatar.astro`), not likenesses. Real portraits needed.
- Porsche, BMW, MINI, Volkswagen, Skoda, Nissan, Isuzu, BMW Motorrad and Indian scenes, all five sector images and the showroom photo break are generated for this concept (the cars from the client's press photos). Replace with real photography.
- The hero film is cut from free Coverr stock clips (free for commercial use, no attribution required).
- The EVM mark is redrawn as SVG (`public/evm-logo.svg`) in a Times-style bold italic. Check it against the original.
- Contact details are not in the source site copy; the footer has none yet.

## Links that lead to pages not built yet
Brand and sector rows link to these routes (they 404 until built): `/marques/{porsche,bmw,mini,volkswagen,skoda,nissan,isuzu,bmw-motorrad,indian-motorcycle}` and `/sectors/{automobile,hotels,plantation,transportation,entertainment}`. The Contact button and the footer anchor scroll in page.

## Run
`npm install`, `npm run dev`. Demo deploy: `node scripts/stage.mjs` (serves under `/evm`; not yet added to the root `wrangler.jsonc` or `demo-index`).
