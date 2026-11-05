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

## Hero 4 v3 (sound, adaptive text, end card)
- **Entrance:** from black, the title appears in the middle, holds, then glides to the top-left corner while the zoom-blur clears (about 5.5 s). Title size fits itself so it never reaches the top bar.
- **Adaptive text:** every text element is checked against the picture behind it each 260 ms (contrast of white and of dark ink against every sampled pixel). White is the default; dark ink only where the picture is light and dark clears almost every pixel; a halo in the opposite tone grows where it still struggles. The top bar turns white over the end card.
- **Pacing:** each place holds about 7.6 s, the cut takes 1.9 s, the title scramble 1.1 s.
- **End card:** after the last place, the Kerala logo (re-drawn as a clean SVG from the official 91 px logo; the palm crown is simplified), GOD'S OWN COUNTRY and a Plan your trip button, then the film restarts.
- **Sound** (off until the visitor turns it on; browsers need a touch): ambient bed per scene (looped with an equal-power overlap so the seam cannot be heard), music bed, a swell on each cut, a voice line per scene with the beds ducking under it. All generated with ElevenLabs (free plan). The voice is **Brian** because the owner's choice, "Douglas - Deep voice", is a Voice Library voice and the free plan cannot use library voices through the API; swap `public/audio/voice-1..7.mp3` for Douglas files made on the website, or upgrade the plan and I regenerate.
- **Video:** re-encoded from the owner's clips at up to 2560 px wide, about 8 Mbps (1080p sources stay at 1920).
- Mute and the sound choice are remembered; sound fades when the hero leaves the screen.
