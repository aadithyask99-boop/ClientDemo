# Kerala Tourism homepage concept (kerala2): plan for the owner's go

Concept for keralatourism.org, not the official site. Mode: **inspiration** (you love Red Dot's design language, you want a site of its own). Path: extend (the client has a real site; I read it only to understand it). Fresh Astro folder `kerala2/`, committed to `main` as you asked. Spend: none (no generated images).

## Reference readout (from a capture of reddottours.com at 1440 and 390, plus a scroll video)
- **Palette:** warm paper `#f4f3ef` for about 60% of the page, cocoa ink `#5c5448` for all text, two dark sections (`#2c2623`, `#090807`), and one dusty rose `#b78984` used only on a few tiny tags. Three quiet colours, one soft accent.
- **Type:** a light, high-contrast serif (F37 Wicklow Light, 31 to 76 px) that mixes upright and italic words in one headline, plus a neutral grotesk (PP Neue Montreal, 17 px body). One weight rule: everything is regular or light.
- **Hero:** a full-bleed film of a monk climbing stone steps in a forest, headline bottom-left ("Trips of a thousand lifetimes"), nothing else competing, a quiet "scroll to discover".
- **Rhythm:** film hero, a fan of tilted destination cards over a blurred full-bleed photo, a centred statement, a big centred list of trip types, one photograph framed with generous margins, a three-column grid of dark photo cards, centred headline plus paragraph, a reviews strip, footer. Light and dark sections alternate and photography does the talking.
- **Photography:** real, documentary, people at work and in place, warm and slightly muted, never glossy stock.
- **Motion:** slow, calm. Lenis-style smooth scroll, headline lines rising, the photo frame growing, cards fanning on arrow or drag. Nothing loud.

**Kept from the reference:** the light serif plus neutral grotesk pairing at one light weight; warm paper ground and cocoa ink; airy spacing; one dominant element per screen; documentary photography; centred statements and a huge centred list; calm slow motion; a framed photo that grows to full bleed.
**Changed for Kerala:** the subject (water, altitude, one river's fall from cloud to coral); the hero (touchable mist instead of a film); the accent (a loud vermilion instead of dusty rose); the spine (a descent, not a tour list); two new sections the reference lacks (the pinned Descent and the seasons list with live weather); the footer (the sea fills the word); no italics (the owner's rule), so the one highlighted word per headline takes the accent colour instead of Red Dot's italic.

## The spine: one drop from the clouds to the sea
Kerala is a thin strip, 35 to 120 km wide, between mountains and the Arabian Sea, with 44 rivers running west. The page is a descent along that fall. A slim live readout on the left edge shows your altitude in metres, counting from **2,695 m (Anamudi, the highest peak in South India)** down through tea hills, spice forest, a waterfall, the backwaters, **below sea level (Kuttanad, about -2 m, where farmers grow rice under the waterline)**, to **0 m at the sea**. A thin river line beside it widens as you descend. Every section is a place on that fall, and the fall never leaves the page. This is Kerala's own geography, not a template. It is deliberately not Kathakali night (the earlier `kerala/`) and not a road (`evm2/`).

## Palette (two quiet colours plus one loud accent; checked for contrast)
1. **Recommended, "Paper, backwater, vermilion":** paper `#f3f1ea`, deep backwater green-black `#14302a` (12.5:1 with paper), accent vermilion `#ee5a36` laid over things (the headline's one word, the altitude drop marker, the active list item, the main button, a few petals). Vermilion on the dark green is 5.0:1; on paper it is only used for large type and marks, with a deeper `#d03712` (4.6:1) for small text. The paper-and-brown discipline of Red Dot, with Kerala's own temple-lamp and vermilion pop.
2. **The reference's own, lifted:** paper `#f4f3ef`, cocoa `#2c2623`, hibiscus `#d94f7a` instead of dusty rose (4.0:1 on cocoa for large type only). Calmest, closest to Red Dot, softer accent.
3. **Monsoon dusk:** paper, indigo `#1d2b4a` (12.4:1), tender-coconut lime `#d9f26a` on indigo (11.3:1). Coolest, most unexpected; the lime would be a spark rather than a ground.
No gold, champagne or brass anywhere.

## Three hero options
1. **Touchable mist (recommended, interactive).** A full-bleed photograph of Munnar tea hills at dawn is buried in fog. The cursor (or a finger) wipes the fog away and it slowly drifts back; the headline sits bottom-left, Red Dot style: "Where the mountains come down to the sea." The readout starts at 2,695 m. Technique: one canvas fog mask over a sharp, large photograph, lazy-started after first paint, a still with the fog already thinned for no-JS and reduced motion. Needs one excellent 3000 px+ Munnar photograph. Risk: a weak photograph kills it, and fog must not look like a filter. Precedent: Solar Fog and Mountain Retreat (loved), our own ink reveal in `kerala/` (its canvas bugs are recorded in feedback.md and avoided).
2. **Scroll-scrubbed descent (interactive).** The hero is pinned and five photographs (cloud, tea, forest, backwater, sea) are flown through by scroll, with the altitude counting down from the first screen. Technique: GSAP ScrollTrigger with canvas-drawn crossfades and a slow zoom. Needs five matched photographs. Risk: it competes with the pinned Descent section further down, so one of them would have to go. Precedent: More Coffee's scrubbed frames, Atlas Nav.
3. **Film hero with one moment (plain film, only if good footage exists).** A houseboat gliding through morning backwater, the headline bottom-left like Red Dot's monk film, and the water line on the left edge drawing in. Technique: 1080p stock or Commons video with a poster still. Needs real footage at a good bitrate (not yet found; the environment blocked stock sites before). Risk: most common type, least ours. Precedent: EVM's film hero.

## The flow (about 17 screens tall, Red Dot is about 21; about 130 words)
| # | Section | Content (curated) | Relation to Red Dot | Layout, focal element | Motion |
|---|---|---|---|---|---|
| 1 | Hero, 2,695 m | headline, "Plan your trip" pill, scroll cue | adapt (headline bottom-left, nothing else) | fog-covered Munnar photograph, full bleed | cursor wipes fog; headline lines rise |
| 2 | Statement | "44 rivers. 590 km of coast. One long fall." and one line on how little land is between cloud and coral | copy (centred statement) | very large centred serif, vermilion on "fall" | words reveal on scroll; river line starts to draw |
| 3 | **The Descent (new, the spine)** | five stations: Munnar tea (1,600 m), Periyar forest (900 m), Athirappilly falls (80 m), Kuttanad backwaters (-2 m), Varkala cliff and sea (0 m); each one line plus a link | new | pinned. A framed photograph (Red Dot's margins) swaps per station, huge serif place name beside it, an SVG cross-section of Kerala with a vermilion drop sliding down it, the left readout counting | the frame grows to full bleed at the first station, drop follows scroll, per-station image wipes; unpins on phones into stacked stations |
| 4 | The slow ways | four things to do: houseboat night, Ayurveda in the monsoon, a Theyyam night, a spice-plantation stay | adapt (Red Dot's photo cards, but an asymmetric overlapping collage of different sizes, not a row of equals) | four photographs at four sizes, large serif titles over them | parallax at different speeds, hover lifts and dims the others |
| 5 | **When to come (new)** | Monsoon, Onam, Thrissur Pooram, Winter sun, one line each | adapt (Red Dot's huge centred list of trip types) | a huge centred list; hovering or scrolling to an item changes the full-bleed photograph and the weather: monsoon draws real rain on a canvas, winter brightens it, Onam scatters petals | image crossfade, rain canvas, active word in vermilion |
| 6 | The sea (footer) | "Keralam", Plan your trip, a few links, contact | adapt (a giant footer mark) | the huge word fills with water as you reach 0 m, a wave line moving along its top | scroll-driven fill, then the wave idles |

**Why this is not a copy:** two of six sections mirror Red Dot closely (statement and the centred list's structure); the others are adapted or new; the identity (the descent readout, the river, fog hero, below-sea-level Kuttanad, the sea-filled footer) shows at scale in four places.

## New sections: design, alternative, precedent
- **The Descent.** Recommended: the pinned station story above. Visitor asks "where should I go and how are these places connected?"; Red Dot answers with a card fan, we answer with one physical fall. Alternative: a horizontal pinned journey; second because vertical scroll is the natural direction for a fall. Precedent: Orra's pinned chapters, the Garden's thread. Risk: the pin feeling stuck, so each station is a short, fixed distance and phones unpin. Inspiration shortlist (to be found with the funnel after the go, one rooted in Kerala): a scroll-linked altitude or depth page, a mountain-to-sea cross-section, a photo that grows from a frame.
- **When to come.** Recommended: weather list with live rain. Visitor asks "when should I come?". Alternative: a twelve-month wheel; second because it is a chart, not a feeling. Precedent: the Garden's night mode, Halcyon's sky-to-night. Risk: rain canvas cost, so it draws only while the list is on screen.

## Easter eggs (each loads only when found; every one has a touch version)
1. **Pookalam:** type "onam" (touch: long-press the altitude readout). A flower carpet of concentric petal rings blooms outward from the cursor in the accent colour and fades. Ties to Onam.
2. **Snake boat:** at the sea, click the waterline (touch: tap it). A vallam of tiny oarsmen rows across the wave, wake behind it. Ties to the Nehru Trophy boat race.
3. **Kingfisher:** after about 20 seconds idle a small kingfisher perches on the river line, and if you click it, it dives and the river ripples. Ties to the backwaters; the idle trigger is the portfolio's sleeping-cursor precedent.
The README will list the triggers.

## Content, imagery and honesty
Own words throughout. Facts used: Anamudi 2,695 m, 44 rivers, Kuttanad below sea level, Onam and Pooram dates (month ranges only), Nehru Trophy boat race; the client confirms before launch (README). Real photographs from Wikimedia Commons with author and licence on a `/credits/` page (this worked for `kerala/`), at least as wide as drawn, checked with the media script. If a stock source opens up it is used the same way. No invented stats, prices or reviews. Cut and linked out: arts and festivals calendar, destinations list, stays, packages, news, the full trip planner (all link to keralatourism.org).

## Type
Light serif Newsreader (free, close to Red Dot's light high-contrast serif) plus Albert Sans (close to its neutral grotesk), both free and self-hosted. One light weight rule, no italics, no hairlines or small labels.

## Plan checklist line
No gold, no hairline rows or small labels, no row of equal cards, no filler section, three hero options, three easter eggs. Impeccable, the checklist, the motion probe against Red Dot, the media check, the detail audit, the owner-critic and a side-by-side with Red Dot all run before handover.

## What I need from you
Your go, plus your picks: hero (1, 2 or 3; I recommend 1) and palette (1, 2 or 3; I recommend 1). Nothing else.
