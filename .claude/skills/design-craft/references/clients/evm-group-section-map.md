# EVM homepage: design system, motion spec, plan and result (section 11)

Reference: esrbespoke.au, measured on 2026-11-02 and 2026-11-03 (intro at 5 fps, strips at 1440 and 390, computed styles, its page script). Content source: evmgroup.co.in (pages, public data endpoints, contact blocks in its script bundle), read to understand the client and kept in `evm/src/data/archive.ts`. The homepage is a highlight reel: one short moment per kind of content, links for the rest.

## 1. ESR design system
- **Colour:** #000, #fff, #191919 hairlines, #e6e6e6 inactive list text on white, #787776 muted labels. No accent.
- **Grid:** 32px gutter at 1440; columns start at x=32, 380 (26%) and 960 (67%).
- **Type:** weight 500 grotesk. Statement 40px/40px; roller names 92px; row text 20px/24px; headline about 62px. Labels 14px (sentence case here by the owner's rule; the reference uses uppercase).
- **Image treatment:** edge-to-edge photographs about 735px tall; one 216px square tile for the active roller item; film graded dark; 2px corners only.
- **Section patterns:** film hero; label plus one 40px paragraph; full-bleed photograph; roller with sticky tile; 40px paragraph plus numbered rows in the right column; footer on the grid with a black wordmark.

## 2. ESR motion spec (from its script and recording)
- **Smooth scroll:** Lenis-style, lerp 0.1. Wheel notch (scrollY after 60/120/180/240/300/360 ms): 216, 315, 361, 382, 392, 396. Build, with lerp 0.16: 171 to 202 first notch, then 272, 332, 368, 389, 399, about the same curve.
- **Easings and durations:** `expo.out` and `power4.out` for entrances, `expo.inOut` and `power2/3.inOut` for transitions; 0.3 to 1.8 s.
- **Counts in its page chunk:** about 41 `.to`, 20 `fromTo`, 20 timelines, 19 staggers, 3 pins (the left label or tile column is held at "top top" with `pinSpacing:false`), active-item triggers at "top center" to "bottom center", pointer handlers on rows, SplitText on the intro and headline. 18 canvases and 3 videos on the page (canvas purpose not identified).
- **Probe numbers:** 271 elements moving with scroll (257 of them in the footer), sections with no motion: 4 of 8.

## 3. The plan the owner approved ("proceed with your idea")
Owner's changes: use free stock video and pictures, and show brand logos in the marques tile instead of car photos (the generated cars did not match the brands).

| # | Section | Shown | Source | Layout and focal element | Motion |
| --- | --- | --- | --- | --- | --- |
| 1 | Intro and hero film | "Future is our Business" | ESR hero | Full-bleed film, 62px headline | Intro sequence, typed headline and nav |
| 2 | Statement | 1952 story and family, 44 words | ESR statement | 40px, full width, 5 lines | Lines rise from a mask; every word lights up as you read |
| 3 | Photograph (Kochi) | place | ESR photograph | Full-bleed 82vh | Inset opens and image settles, scrubbed |
| 4 | Marques | 8 brands | ESR roller | 92px list, 216px tile with the brand's logo | Letters build as each name rises; tile wipes between logos |
| 5 | Sectors | five sectors, a 30-word statement | ESR services | Black, numbered rows | Words light up, rows drift in with the scroll, tile wipes in on hover |
| 6 | Photograph (Munnar) | hills | ESR photograph | Full-bleed | Same as 3 |
| 7 | Milestones (new) | 1952, 1985, 2013, 2019 | new | Pinned: year at 13vw, tile, one line | Digits roll between dates, caption and tile swap |
| 8 | Proof (new) | One quote, three numbers | new | Black: 40px quote, then three 92px figures | Quote words light up; figures drift in and count up |
| 9 | Where next (new) | Our people, Careers, Contact | new | Three 92px links | Letters build; word under the pointer turns black, others fade, a tile follows the pointer |
| 10 | Footer | Corporate office | ESR footer | Black wordmark | Details drift in; wordmark rises |

## 4. Result (measured)
- `compare-sheets.py`: 10,071 px (1.47x), 350 words (1.1x), 9 sections, no warnings. Compared in two clean rounds.
- `motion-probe.mjs`: 213 elements move with scroll against ESR's 271 (79%, target 70%); sections with no motion: none. Wheel notch curve matches within about 20 px.
- Impeccable (defects only): the detector reads the page at the start of the animations, so it reports dim words, rows and footer labels as low contrast; after scrolling through, every one of them reaches full opacity (checked). Kept deliberately: ESR's pale inactive marques. Fixed: a milestone caption overlap during fast scrolling, an odometer clipping a neighbouring digit.

## 5. Cut or linked (same as before)
All of it is kept in `evm/src/data/archive.ts` for the linked pages: `/about` (mission, vision, messages, 68 years and 12 lakh customers), `/people`, `/history` (23 rows), `/marques` (+ `/marques/<name>`, five more brands and long descriptions), `/sectors` (+ detail), `/recognition`, `/reviews` (ten more testimonials), `/careers`, `/contact`.

## 6. Source material
- Film: Coverr stock (free licence): aerial roads, a mountain hairpin, pedals, a forest road, and two Porsche close-ups plus a white Porsche side shot. Hero is slimmed to 1440 wide and 1.8 MB.
- Stills: CC0 from Openverse (Wikimedia, the WordPress photo directory, rawpixel, StockSnap): Kochi fishing nets, Munnar tea terraces, a Kumarakom resort, cinema seats, a highway truck. The Porsche still is a frame from the Coverr clip.
- Logos: Simple Icons (CC0 files; the marks belong to their owners and the client is an authorised dealer).
- No generated images remain on the page.
