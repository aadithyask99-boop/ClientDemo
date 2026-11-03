# EVM Group homepage (concept)

Homepage only: a highlight reel in the design language and motion of esrbespoke.au (10,071 px, 350 words, 9 sections against 6,870, 319 and 7). Astro 7, plain CSS, GSAP (ScrollTrigger) and Lenis.

## Files
- `src/data/site.ts`: the homepage content (short, curated).
- `src/data/archive.ts`: the client's full content from the current website. Not rendered. Source for the linked pages.
- `src/scripts/main.ts`: all motion (intro, split text, scrubbed reveals, roller, pinned milestones, counters, pointer tile).
- Design system, motion spec, plan, measurements: `.claude/skills/design-craft/references/clients/evm-group-section-map.md`.

## Source material (no generated images on the page) and licences
- **Hero film** (`public/video/hero.mp4`, 1920x1080, 14.6 s, about 3.65 Mbps; `hero-phone.mp4`, 720x1080 crop, about 2.2 Mbps, used under 860 px wide): cut from six Coverr clips taken at Coverr's 1080p tier, the highest it offers (no 4K): car-driving-on-a-curvy-road-9744, red-ford-gt-car-7551, rear-view-of-a-porsche-911-turbo-s-9150, road-in-the-mountains-7132, rear-view-of-a-porsche-gt3-3421, parking-a-white-porsche-5544. Coverr licence: free for commercial use, no attribution required. The film is a stand-in for the client's own footage.
- **Full-bleed photographs** (CC0, WordPress Photo Directory originals at 2048 px, exported at native size): "Kochi, Kerala, India" (`photo-kochi`), "Tea Plantation at Munnar, Kerala." (`photo-tea`), "A scenic view of the beautiful Munnar valley, Kerala" (`tea-wide`). Larger CC0 originals exist on Wikimedia Commons (for example "Tea Fields Of Munnar, Kerala, India", 4032 px, and "Kerala Backwaters at Dawn", 3456 px), but upload.wikimedia.org returned HTTP 429 from the cloud container; swapping them in would make the photographs sharp on retina screens.
- **Tiles** (CC0): "A Backwater Villas resort located in Kumarakom" (WordPress Photo Directory), "Free theater seat image" (rawpixel), "Highway Road" (StockSnap); the Porsche tile is a frame from the Coverr clip above.
- **Logos:** Simple Icons SVGs (CC0 files). The marks belong to their owners; the client is an authorised dealer.
- Replace all of it with the client's own film and photography.

## Links to pages that are not built yet
`/about`, `/people`, `/history`, `/marques` (and `/marques/<name>`), `/sectors` (and `/sectors/<name>`), `/recognition`, `/reviews`, `/careers`, `/contact`. They 404 until built.

## To confirm with the client
- Copy and figures come from evmgroup.co.in. The Chairman's message (on `/about`) says 1957; the history says 1952.
- The EVM mark is redrawn as SVG in one colour (`public/evm-mark.svg`). Check it against the original.
- Labels are sentence case (owner's rule); the reference uses small uppercase.

## Run
`npm install`, `npm run dev`. Demo deploy: `node scripts/stage.mjs` (serves under `/evm`; not yet added to the root `wrangler.jsonc` or `demo-index`).
