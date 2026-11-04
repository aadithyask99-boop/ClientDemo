# God's Own Country: Kerala Tourism homepage concept (kerala2)

A concept homepage for Kerala Tourism (keralatourism.org), made for the owner's portfolio. Not the official site. Astro, plain CSS, GSAP (ScrollTrigger) and Lenis. Inspired by the design language of reddottours.com, not a copy. Plan: `PLAN.md`.

**Tagline:** God's Own Country. **Audience:** foreign visitors, heritage and culture.
**Spine:** one composite fall from the mist of the Western Ghats (Anamudi, 2,695 m) to the sea (0 m), through Munnar, Thekkady, Athirappilly and Kuttanad (below sea level). No counters or diagrams: the photographs and the weather carry the descent.
**Hero:** touchable mist (a canvas fog the cursor or a finger wipes away; it drifts back).
**Palette:** paper `#f3f1ea`, backwater green `#14302a`, vermilion `#ee5a36` (accent only, used over things). **Type:** Newsreader (light) and Albert Sans, self-hosted via Fontsource; stand-ins for Red Dot's licensed fonts.

## Easter eggs (each loads only when found)
- **Pookalam:** type `onam` (touch: long-press the hero headline). A flower carpet blooms and fades.
- **Snake boat:** click or tap the big KERALA word in the footer. A vallam rows across.
- **Kingfisher:** stay idle for 20 seconds and a kingfisher lands at the right edge; click it and it dives.

## Content, facts and honesty
All copy is original (`src/data/site.ts`). Figures are rounded and must be confirmed by the client: Anamudi 2,695 m, 44 rivers, 590 km coast, 35 to 120 km width, Kuttanad below sea level, festival months. "Plan your fall" is the dawn houseboat photograph at full brightness with slow drifting mist (runs only on screen), one line, the title and one button to the official planner. Links go to keralatourism.org (home or destination page); deeper links are not wired.

## Photography
Ten photographs from Unsplash (Unsplash licence); photographer and source page for each are in `credits.json` and on `/credits/`. No generated images, no spend. A mild desaturation (0.9) is baked in so the set reads as one. The Unsplash key was used from an environment variable while sourcing and is not stored anywhere in this repo.

## Behaviour
Desktop (pointer, 820 px and wider, motion allowed): pinned Descent and weather dial, smooth scroll. Phones and reduced motion: the same content as stacked sections, no pins, no weather canvas, no fog. Without JavaScript the page reads as the stacked version.

## Run
`npm install && npm run dev`. Shared deploy: `node scripts/stage.mjs` (serves under `/kerala2`).
