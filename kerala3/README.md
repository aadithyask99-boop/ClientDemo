# God's Own Country: Kerala Tourism homepage concept (kerala3)

A concept homepage for Kerala Tourism (keralatourism.org). Not the official site. Astro, plain CSS, GSAP (ScrollTrigger) and Lenis. Plan: `PLAN.md`.

**Mode:** replicate-and-extend of reddottours.com (the owner's recording and a capture of the page). The section order, the pinned destination fan, the By Month list (rebuilt as a full-bleed photograph scene), the grow-to-full-bleed frame, the sideways headline over a dark section, the centred carousel and the footer follow Red Dot. One new section: Water. The pill button is Kerala green (from the logo) instead of Red Dot's brown.
**Tagline:** God's Own Country. **Audience:** foreign visitors; heritage, culture and what to expect in each month.
**Spine:** one year in Kerala. Each section has a season job, shown only as weather and light inside photographs.
**Fonts:** Newsreader Light and Albert Sans, stand-ins for Red Dot's licensed F37 Wicklow and PP Neue Montreal.

## Three heroes (switch with the review pill at the bottom left, or `#hero=1|2|3`)
1. **Three seasons:** stills cycle monsoon, Onam, December mist, with soft rain or mist and cut-out foliage that drifts with the cursor.
2. **Rain on the glass:** a misted window over a backwater; the cursor wipes it clear, rain runs trails, it clouds over again.
3. **Through the leaves:** layered foliage; scrolling carries the camera through into the backwater.
The review pill and the two unused heroes are removed once the owner chooses.

## Easter eggs
- Type `onam` (touch: long-press the headline): a pookalam flower carpet blooms.
- Click or tap the big KERALA footer word: a snake boat rows across.
- Hold the monsoon photograph (June and July in the months scene) for two seconds: a shower fills it.
- Stay idle for 20 seconds: a kingfisher lands; click it and it dives.

## Content, facts and honesty
All copy is original (`src/data/site.ts`). Illustrative, to be confirmed by Kerala Tourism: best-month ranges per place, the trips (names, nights, months), festival dates and the monthly notes, "44 rivers". The visitor-quote and journal sections were cut so nothing invented is presented as a review.

## Images
Photographs from Unsplash (Unsplash licence), credits in `credits.json` and on `/credits/`. Foliage cut-outs (`public/img/leaf/`) are generated with Seedream (shared style prompt in `public/img/leaf/README.txt`), keyed from flat magenta; AI-generated art may not be copyrightable. Spend: $0.252 of the $2 cap. The Unsplash key is read from an environment variable and is not stored.

## Behaviour
Desktop (pointer, 820 px and wider, motion allowed): pinned fan, months scene, heart and water scenes; smooth scroll. Phones and reduced motion: the same content stacked, no pins, no weather canvases. Without JavaScript the page reads as the stacked version.

## Run
`npm install && npm run dev`. Shared deploy: `node scripts/stage.mjs` (serves under `/kerala3`).
