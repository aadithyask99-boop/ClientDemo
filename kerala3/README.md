# God's Own Country: Kerala Tourism homepage concept (kerala3)

A concept homepage for Kerala Tourism (keralatourism.org). Not the official site. Astro, plain CSS, GSAP (ScrollTrigger) and Lenis. Plan: `PLAN.md`.

**Mode:** replicate-and-extend of reddottours.com (the owner's recording and a capture of the page). The section order, the pinned destination fan, the By Month list (rebuilt as a full-bleed photograph scene), the grow-to-full-bleed frame, the sideways headline over a dark section, the centred carousel and the footer follow Red Dot. One new section: Water. The pill button is Kerala green (from the logo) instead of Red Dot's brown.
**Tagline:** God's Own Country. **Audience:** foreign visitors; heritage, culture and what to expect in each month.
**Spine:** one year in Kerala. Each section has a season job, shown only as weather and light inside photographs.
**Fonts:** Newsreader Light and Albert Sans, stand-ins for Red Dot's licensed F37 Wicklow and PP Neue Montreal.

## Four heroes (switch with the review pill at the bottom left, or `#hero=1|2|3|4`; the page opens on 4)
1. **Three seasons:** stills cycle monsoon, Onam, December mist, with soft rain or mist and cut-out foliage that drifts with the cursor.
2. **Rain on the glass:** a misted window over a backwater; the cursor wipes it clear, rain runs trails, it clouds over again.
3. **Through the leaves:** layered foliage; scrolling carries the camera through into the backwater.
4. **A film of places, replicating the owner's Costa Serenade reference and played as a tourism film** (the page opens on it): hook (a Theyyam fire, from black), wonder (Munnar sunrise), calm (houseboat, Kuttanad), intimacy (Kochi's fishermen), release (the coast). Reference elements: bold grotesk title top-left that starts large and settles, a small Malayalam row under it that fades, a top bar (live Kerala time, four links, a call to action), a small paragraph, (c)2026, SCROLL DOWN, an opening zoom-blur, single-letter glitches to Malayalam letters between cuts, a slanted slice cut (transforms only), a title scramble at each cut and a word-by-word tagline. Additions: text colour follows the footage (five zones sampled every 320 ms with hysteresis), letters near the cursor flip, the footage drifts with the cursor, click, tap or arrow key skips to the next place, scrolling hands the hero to the page. Footage: owner's Pexels clips, encoded to 1080p at 30 fps (`public/video/scene-N.mp4`, 30 MB in all); phones show posters only. Voiceover and music are planned for later (ElevenLabs key from the owner). Malayalam words and tagline lines need a native check.
The review pill and the unused heroes are removed once the owner chooses.

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

## Hero 4, current state
- **Reference sizes:** the first title settles at about 31% of the width (the reference's 29%), starting about 44% in the middle (the reference's 41%); later titles are 78% of that. The tagline is 2.5vw, at most three lines, 40 to 48 characters.
- **Entrance, synced to the fire:** black, then a hard cut at 0.9 s onto the Theyyam clip, which is trimmed to start 8.6 s into the source so its big flare (about 35% of the picture, at 9.8 to 12.5 s in the source) lands about 1.4 s in. The title appears in the middle with it, scrambles in, holds, then glides to the corner at 3.6 s while the zoom-blur clears. A swell sounds on the cut.
- **Colour that follows the footage:** three groups (title, top bar, bottom row) each read the brightness and average hue of the picture right behind them (during a cut, the part of the picture the slanted panel has reached). Light picture, dark ink; dark picture, light ink; the ink carries a quiet tint of the picture's hue (warm yellows are pulled back to neutral, no gold). The decision is smoothed (about half a second) with a wide band and a dwell, so pulsing fire does not make it flicker, and it follows at once around a cut. A soft halo appears only on very mixed pictures.
- **No looping:** clips play once at their own speed. The short ones are slowed (Kuttanad 0.55, Kochi 0.75, the coast 0.5, the Theyyam 0.85) and each scene's hold comes from its clip. The last place keeps moving, slowly, beneath the ending.
- **Ending:** the corner title fades; a separate centred title says GOD'S OWN COUNTRY, glitches into ദൈവത്തിന്റെ സ്വന്തം നാട്, dissolves, and the Kerala logo (redrawn as a clean SVG from the official 91 px logo) takes its place at the same centre; then the film restarts. No button.
- **Sound:** ambient bed per scene, music and a swell on each cut, off until the visitor turns it on; looped with an equal-power overlap. No voiceover (removed at the owner's request).
- **Interaction:** letters near the cursor flip to Malayalam, the footage drifts with the cursor, click, tap or the right arrow skips to the next place, scrolling hands the hero to the page.
