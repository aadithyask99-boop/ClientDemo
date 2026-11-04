# God's Own Country: Kerala Tourism homepage concept (kerala3): plan for the owner's go

Concept for keralatourism.org, not the official site. **Mode: replicate-and-extend of reddottours.com** (owner: "replicate this Red Dot page, with the motion, the ideas, everything"). New Astro folder `kerala3/`, committed straight to `main`. Tagline **God's Own Country**. Audience: foreign visitors; heritage, culture, and what to expect in each month.

## Reference readout (capture of reddottours.com at 1440 and 390, plus the owner's 96 s recording)
- **Palette:** warm paper `#f4f3ef` (about 60% of the area), cocoa `#2c2623` and near-black `#090807` for dark sections (about 40%), cocoa-grey text `#5c5448`, one dusty rose `#b78984` panel (reviews). Pill CTA is dark brown. Two grounds plus one accent only.
- **Type:** F37 Wicklow Light (31 to 76 px) mixing upright and one italic word, plus PP Neue Montreal grotesk (17 px, regular and medium). Both licensed, so stand-ins: Newsreader Light and Albert Sans.
- **Hero:** full-bleed film that cycles three human moments, headline "Trips of a thousand *lifetimes*" bottom-left, one small line under it, "Scroll to discover" bottom-right; header transparent over the film.
- **Rhythm (in order):** hero film; statement with two overlapping photos; **pinned destination fan** (tilted photo cards over a blurred crossfading photo, a huge uppercase country name over them, a numbered tab row at the bottom); **"This way for ideas": a big two-column list, By Trip Type or By Month**; a framed photograph that grows to full bleed; **dark "The heart of your journey"** (headline wider than the screen sliding sideways, small photos drifting at different speeds, a short paragraph and one button); "Swap the guidebook for a good story" with three tall photos; a six-tile trips grid; a rose testimonial panel beside a photograph; a centred-focus stays carousel; "Get up close" with a three-photo strip; the journal; "Choose your adventure" CTA; dark footer with newsletter and link columns.
- **Photography:** documentary, warm, muted, mostly people at work and in place.
- **Motion:** smooth scroll; headline lines rising and clearing from blur; pinned destination fan stepping by scroll with a 3D-tilted card stack and crossfading background; frame growing to full bleed; headline sliding sideways with photo parallax; centred carousel scale; hover reveals on trip tiles; mega menu drop-down from the header; header goes paper-solid after the hero.
- **Capture status:** the full capture worked (screenshots at 1440 and 390, design language, report). The scroll video was taken from the owner's own recording. `motion-probe` has not been run against Red Dot yet; it read 0 elements last time, so the inventory above (from the recording) is the standard, and the probe is a second check on the build.
- The coloured bars at the top and bottom edge of the owner's recording are the screen recorder, not the site.

## Kept from Red Dot / Changed for Kerala
**Kept:** type feel (light serif with one italic word, plain grotesk), paper/dark alternation, the page order, the pinned destination fan, the By Trip Type / By Month list, the grow-to-full-bleed frame, the sideways headline over dark with drifting photos, the centred carousel, the journal, the footer structure, the header and mega menu, all slow motion.
**Changed:** the subject (Kerala), the words, the photography, **the CTA colour from brown to Kerala green** (taken from the logo at keralatourism.org), the rose panel, one new section (water), the footer's closing word.
**Decision for you (italic):** Red Dot's signature is one italic word in the big serif headlines. I found no recorded rule against italics from you, only the skill's default. Pick: (a) keep one italic word per big headline, as Red Dot does (recommended, you asked for a replicate), or (b) set that word upright in the Kerala green highlight.

## Palette (two quiet colours plus one loud accent)
1. **Recommended, Red Dot with Kerala green:** paper `#f4f3ef`, cocoa `#2c2623`, **Kerala green** CTA `#12803a` (white text 5.0:1) and `#2fc25f` as the lit highlight on dark (6.4:1 on cocoa). Reviews panel in a soft sage `#cfdcc4` in place of the dusty rose. Closest to Red Dot with your one change.
2. **Forest night:** paper, forest-black `#14281d`, green `#3fcf6e` on dark (7.7:1) and `#12803a` on paper. Greener, heavier.
(Orange as a spark is dropped: small orange on green markers were a hard pass in Kerala 2.) No gold, champagne or brass. Reviews panel colour is no longer needed (section cut).

## Three hero options (honest about assets: I have stills only today, no film)
1. **Three seasons (recommended, Red Dot's three-moment cycle done with stills).** Three full-bleed photographs cycle with a slow push-in and a crossfade, one per season: monsoon rain on tea hills (June), Onam on the backwater (August), December mist over Munnar. The headline "God's Own *Country*" sits bottom-left with one line under it. Each season has its own weather drawn over the photo (rain streaks, drifting mist), and large real foliage cut-outs (palm, banana leaf) frame the edges and drift with the cursor. This opens the year spine. If you have film clips of your own, drop them in and the cycle plays film instead.
2. **Touchable mist, reworked.** Kerala 2's hero (you called it good) with rain and the foliage frame added so it is not a repeat. Photograph only.
3. **Rain through the leaf (scroll-scrubbed, layered).** A banana-leaf and palm frame in three depth layers; scrolling pushes the camera through the leaves into a rain-lit backwater photograph, the headline resolving out of the green. Interactive with the cursor. Risk: the cut-outs must be large and clean, or it reads cheap; I will test cut quality first and fall back to option 1.

## Spine: one year in God's Own Country
The page moves through the seasons as you scroll, so the year is the structure and not a section. The hero cycles monsoon, Onam, December mist. The destination fan's backdrop shifts weather as it steps. The months scene is the year spelled out. The dark section carries the post-monsoon night and festival lamps; the footer ends in the cool of December on the sea. The year shows only as weather, light and festivals inside photographs, never as a widget or a counter. Red Dot's order is kept; the year is the atmosphere over it.

## The flow (Red Dot's order, 11 sections, a little shorter than its 14)
| # | Section | Kerala content | Relation | Focal element | Motion |
|---|---|---|---|---|---|
| 1 | Hero, three seasons | God's Own *Country*; "Where the mountains meet the sea." | copy | stills cycle, headline bottom-left, foliage frame | push-in, rain and mist per season, lines rise, header goes paper-solid after |
| 2 | Statement + two photos | "A green strip between the Western Ghats and the Arabian Sea: 44 rivers, spice forests, a festival every month." Button "Why Kerala" | copy | two overlapping photographs | line reveal, photo parallax |
| 3 | Pinned destination fan | Munnar, Thekkady, Wayanad, Athirappilly, Alappuzha, Kochi, Varkala | copy, new content | huge uppercase name over a tilted photo stack, numbered tab row | pinned, steps by scroll, stack tilts, backdrop crossfades with the season |
| 4 | **Kerala by month (centrepiece)** | twelve months set huge; each wipes in a full-bleed photograph with that month's weather and festival, and a few lines: what to expect | adapt of Red Dot's By Month list, **your key ask**, the "When to come" you loved | giant month names, one photograph filling the screen at a time | scrubbed: names step, photo wipes, weather per month (rain, petals, mist, sun). The By Experience switch is cut (a widget); experiences are in sections 7 and 8 |
| 5 | **Water (new, replaces the frame-grows moment)** | a framed waterfall photograph grows to full bleed; "Forty-four rivers run west." | adapt Red Dot's growing frame | the falls, mist drifting | scrub scale, line reveal, push-in |
| 6 | Dark: "The heart of Kerala is its *people*" | houseboat, homestay, tea estate; "Be our guest" paragraph and button | copy | headline wider than screen sliding sideways, photos drifting | horizontal scrub, parallax |
| 7 | Get inspired | "Swap the guidebook for a good story": Theyyam, Kathakali, the kasavu weaver | copy, culture | three tall photographs | blur-to-clear heading, photos rise at different speeds |
| 8 | Trips | six journeys, e.g. "Hills and Spice, 8 days" | copy, adapted as a mosaic of different sizes | photo tiles, titles 24 px and up | hover reveal |
| 9 | Featured stays | houseboat, heritage home, tea bungalow | copy | centred carousel | drag, centre scales |
| 10 | Get up close | "Kerala away from the well-trodden path" | copy | three-photo strip | strip parallax |
| 11 | CTA and footer | "Choose your adventure"; newsletter; links; huge KERALA word | copy + extend | KERALA in green | word fills; boat egg |

Cut from Red Dot's 14: the reviews panel (invented quote, near-empty), the journal (rows without strong photography; linked from the footer) and the weaver frame (folded into section 7). Body and caption text at least 16 px.

**New section: Water.** (a) Question: why is it so green? (b) Red Dot's own full-bleed photograph moment. (c) Kerala 2's falls and Doves' full-bleed night image. (d) Alternative: fold water into the Athirappilly card only; second because rivers and waterfalls are what you asked for. (e) Risk: a still waterfall can feel static; the mist layer and a push-in carry it. Inspiration: Frostbound (a film that carries a travel page), Wander Far (a fjord with one coloured accent), Solar Fog (light that responds).

## Motion inventory and motionsites lookup
Previews looked at (titles from the gallery, mechanisms from your own ratings, not re-captured this time): Frostbound (a film that carries a travel page), Mountain Retreat (a lodge in fog), Solar Fog (pointer changes the scene), Wander Far (a fjord, one accent), Halvøy Nordic Cabin (illustrated place), Flower Valley (big type over a valley), Tana Elephant (travel sections). Red Dot's own motion is above. The build must reach at least 70% of Red Dot's scroll motion on `motion-probe.mjs` and no section may have zero motion.

## Easter eggs (each loads only when found, desktop and touch)
1. **Pookalam:** type `onam` (touch: long-press the headline): a flower carpet blooms and fades.
2. **Snake boat:** click or tap the big KERALA footer word: a vallam rows across.
3. **Monsoon:** hold on the June photograph in the months scene for two seconds (touch: tap and hold): a shower fills the photograph, leaves glisten, then it clears.
4. Idle for 20 seconds: a kingfisher lands at the edge (kept from Kerala 2).

## Greenery, plants, rivers and waterfalls
Used as real photographs and cut-out foliage framing layers (hero, dark section edges, footer), not as drawn icons or line art: the Kerala 2 review called small vector devices over photography gimmicky. Water lives in section 6 and in the backwater and falls photographs.

## Plan checklist line
No gold; no hairline rows or small labels (Red Dot's hairline rows are replaced by spacing); no row of equal cards (the trips grid is a mosaic of different sizes); no filler; three hero options; three easter eggs plus one.

## Cut or linked out
About, history, the full destination guides, booking, the full festival calendar: linked to keralatourism.org, not placed here.

## What I need and what it costs
- **Photographs:** about 25 at 3000 px or wider. Kerala 2 held 10 from Unsplash (credits kept); I need the Unsplash access key again (it was not stored) or I use Wikimedia Commons, which worked in Kerala. Pixabay answers 400 even with the injected proxy key. No generation spend planned.
- **Video:** the hero film and waterfall need clips. I will look for openly licensed Kerala footage on Wikimedia Commons; if none passes by eye, hero option 2 (touchable mist) is the fallback and I will tell you.
- Anything invented (the visitor line, trip names and nights, figures) is labelled illustrative and listed in the README; figures to be confirmed by the client.

Reply go (and pick a hero and palette), or tell me what to change.
