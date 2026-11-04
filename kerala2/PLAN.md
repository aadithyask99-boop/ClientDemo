# Kerala Tourism homepage concept (kerala2): plan for the owner's go (round 2, after critic)

Concept for keralatourism.org, not the official site. Mode: **inspiration** of reddottours.com. Fresh Astro folder `kerala2/`, committed to `main`. Spend: none (no generated images).

## Reference readout (capture of reddottours.com at 1440 and 390, plus a scroll video)
- **Palette:** warm paper `#f4f3ef` (about 58% of the area), cocoa `#5c5448` text, two dark sections `#2c2623` and `#090807` (about 40% of the area, alternating with the paper), one dusty rose `#b78984` on tiny tags.
- **Type:** light high-contrast serif (F37 Wicklow Light, 31 to 76 px) mixing upright and italic words, plus a neutral grotesk (PP Neue Montreal 17 px). Regular and light only.
- **Hero:** a full-bleed film cycling human moments (a monk on stone steps, a woman in a blue palace, block-printers), headline bottom-left, nothing else competing.
- **Rhythm:** film, fan of tilted destination cards over a blurred photo, centred statement, huge centred list, one framed photograph with generous margins, a grid of dark photo cards, centred headline and paragraph, reviews, footer. Light and dark alternate.
- **Photography:** real, documentary, warm, muted; mostly **people at work and in place**, not empty landscape.
- **Motion:** slow and calm: smooth scroll, headline lines rising, the frame growing, cards fanning on drag.

**Kept:** light serif plus neutral grotesk at one light weight; warm paper ground; light/dark alternation; airy spacing; one dominant element per screen; documentary photography with people in it; centred statement and huge centred list; calm slow motion; a framed photo that grows to full bleed.
**Changed:** the subject (a descent from cloud to sea); the hero (touchable mist, not a film); the ink (deep backwater green-black replaces cocoa, a change, not a keep); the accent (loud vermilion replaces dusty rose); the sections (the Descent and the weather list are new); the footer (the sea fills the word); no italics (owner's rule), so Red Dot's italic word becomes one vermilion word, used on only two headlines (hero and statement), never on every heading.

## The spine: a composite fall from cloud to coral
Kerala is a strip 35 to 120 km wide between mountains and the Arabian Sea, with 44 rivers running west. The page is a **composite descent** (not one river; the plan and copy say "a fall across Kerala", the client fact-checks the figures): from **2,695 m on Anamudi** through tea hills, spice forest, a waterfall, the backwaters, **below sea level in Kuttanad (about -2 m, rice grown under the waterline)** to **0 m at the sea**.
It is shown as big things, not margin text: a **large altitude numeral** (48 px+, serif) pinned bottom-left that counts down as you scroll, and a **painted river body** (a bold SVG shape, 24 px at the top widening to a full band at the sea) running down the right edge. Both **fade out** in the weather section (off the axis on purpose) and return at the sea. Not Kathakali night (`kerala/`) and not a road (`evm2/`).

## Palette (two quiet colours plus one loud accent)
1. **Recommended, paper, backwater, vermilion:** paper `#f3f1ea`, backwater green-black `#14302a` (12.5:1 on paper), vermilion `#ee5a36` laid over things (the one word, the drop, the active list item, the button, petals); on the dark green 5.0:1; on paper only for large type, `#d03712` (4.6:1) for small.
2. **The reference lifted:** paper `#f4f3ef`, cocoa `#2c2623`, hibiscus `#d94f7a` (4.0:1 on cocoa, large type only). Softest, closest to Red Dot.
(The lime option is dropped: it was unrelated to Kerala.) No gold, champagne or brass.
**Dark sections (like the reference's 40%):** the Descent (green-black), the weather list (green-black), the sea footer (deeper green). Hero and statement are light-toned (fog and paper); the people section is paper.

## Three hero options
1. **Touchable mist (recommended, interactive).** Full-bleed tea hills at dawn under fog; the cursor or a finger wipes it away, it drifts back; headline bottom-left; altitude numeral at 2,695 m. One canvas fog mask over a sharp large photograph, started after first paint; a thinned-fog still for no-JS and reduced motion. **Photo risk, stated plainly:** I have not yet found the exact photograph (Wikimedia Commons rate-limited me during the plan, and Pixabay's API answered 400). The hero needs a 3000 px or wider, soft-lit Munnar or Wayanad hills photo; if none passes by eye, the fallback is a painted hills scene I draw in layered SVG (you love illustrated heroes), same fog mechanic. You would see which one I used in the handover. Precedent: Solar Fog, Mountain Retreat (loved).
2. **Scroll-scrubbed descent.** The hero itself is pinned and five photographs fly past with the numeral counting down. Needs five matched photographs; it would replace the pinned Descent below rather than sit beside it.
3. **Film with one moment (plain film).** A houseboat gliding through morning backwater, headline bottom-left like Red Dot, the river body drawing in. Needs real 1080p footage I do not have a source for yet.

## The flow (about 14 screens tall; Red Dot is about 21)
| # | Section | Content | Relation to Red Dot | Layout, focal element | Motion |
|---|---|---|---|---|---|
| 1 | Hero, 2,695 m (light, fog) | headline, Plan your trip, scroll cue | adapt | fog-covered hills, headline bottom-left | cursor wipes fog; lines rise; **the fog clears into the statement** as you scroll, so it is one move |
| 2 | Statement (light) | "44 rivers. 590 km of coast. One long fall." | copy | very large centred serif, vermilion on "fall" | words reveal; river body begins at the right edge |
| 3 | **The Descent (new, dark, the spine)** | five stations, each one line, one place and **its activity as a moment inside the station**: Munnar tea, 1,600 m (a tea-picker, a tea-estate stay); Periyar forest, 900 m (a spice-plantation stay, a guide); Athirappilly falls, 80 m; Kuttanad backwaters, -2 m (a houseboat night, a paddy farmer under the waterline); Varkala cliff and sea, 0 m (a fisher) | new | pinned. A framed photograph with Red Dot's margins swaps per station beside a huge place name; an SVG cross-section of Kerala carries a vermilion drop; the numeral counts | frame grows to full bleed on entry, image wipes, drop follows scroll; phones unpin into stacked stations |
| 4 | **People and hands (light)** | three working moments from the stations: Ayurveda massage in the monsoon, a Theyyam performer at dusk, a boatman on the backwaters | adapt (Red Dot's people photography, framed and growing) | one framed photograph that grows to full bleed and swaps in three scroll steps, the person's name and craft in large serif | frame growth, slow image swaps (this restores the reference's warmth and its framed-photo moment, without a card row or a duplicate collage) |
| 5 | **When to come (new, dark, off the axis)** | Monsoon, Onam, Thrissur Pooram, Winter sun, one line each | adapt (huge centred list) | huge centred list; the active item changes the full-bleed photo and the weather: real rain on a canvas, petals for Onam, bright haze for winter; the readout becomes a rain or sun gauge | image crossfade, rain canvas only while on screen |
| 6 | The sea (footer, deep green) | "Keralam", Plan your trip, a few links | adapt | the huge word fills with water as you reach 0 m, wave moving along its top | scroll-driven fill, then the wave idles |

**Mirror count (honest):** by structure, hero, statement, list and footer have a Red Dot counterpart (4 of 6, mirrored in feel but each re-subjected). The Descent is new, and the people section adapts the framed photograph but is a three-step story, not a copy. The half limit is met in feel only at the edge, so the identity carries it: the descent numeral and river body, the fog hero, Kuttanad below the sea, and the sea-filled footer show at scale in four places. If you want it further from Red Dot, I would turn section 5 into a weather gauge (the readout becomes a dial) and drop the list shape.

**What the fall gives the visitor at 0 m (the action):** the sea section does a job: a small **"Plan your fall"** chooser, three big choices (3 days, a week, ten days) that each light up the stations that fit, as a route drawn on the cross-section, ending in a link to keralatourism.org's planner. Red Dot's button just says Plan Your Trip; ours gives you a route first.

## New sections: design, alternative, precedent
- **The Descent.** Alternative: a horizontal pinned journey; second because a fall is vertical. Precedent: Orra's pinned chapters, the Garden's thread. Risk: a pin that feels stuck, so each station is a short fixed distance, and phones unpin.
- **When to come.** Alternative: a twelve-month wheel; second because it is a chart. Precedent: Halcyon's sky-to-night, the Garden's night mode. Risk: rain canvas cost, so it draws only while on screen.
- Inspiration shortlist for each is gathered after the go and written into the README.

## Easter eggs (load only when found; touch versions)
1. **Pookalam:** type "onam" (touch: long-press the altitude numeral). Concentric petal rings bloom from the cursor in vermilion and fade.
2. **Snake boat:** click the wave on the sea footer (touch: tap it). A vallam of tiny oarsmen rows across with a wake. Tied to the thick wave, not a thin line.
3. **Kingfisher:** after about 20 seconds idle a kingfisher lands on the painted river body; click it and it dives and the river ripples.
Triggers are listed in the README.

## Photo supply and treatment (the biggest risk)
About 12 photographs are needed (hero, 5 stations, 3 people, 3 weather). Source: Wikimedia Commons (author and licence on `/credits/`), retried gently after the rate limit; sizes checked with the media script. To make mixed photographs read as one set: one consistent warm-muted grade applied in the build (the reference's own look, not a decorative gradient). Where a station has no good photograph, the fallback is a painted SVG scene in the same style as the hero fallback. I will tell you in the handover exactly which are photographs and which are painted.

## Type
Newsreader (light) and Albert Sans, both free and self-hosted, as stand-ins for Red Dot's licensed fonts. One light weight rule, no italics, no hairlines, no small labels.

## Plan checklist line
No gold, no hairline rows or small labels, no row of equal cards, no filler section, three hero options, three easter eggs. Impeccable, checklist, motion probe vs Red Dot, media check, detail audit, owner-critic and a side-by-side with Red Dot run before handover.

## What I need from you
Your go, with your picks: hero (1, 2 or 3; I recommend 1) and palette (1 or 2; I recommend 1).
