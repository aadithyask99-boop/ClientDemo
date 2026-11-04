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
**Changed:** the subject (a descent from cloud to sea); the hero (touchable mist, not a film); the ink (deep backwater green-black replaces cocoa, a change, not a keep); the accent (loud vermilion replaces dusty rose); the sections (the Descent and the weather list are new); the footer (the sea fills the word); no italics (owner's rule), so Red Dot's italic word becomes one vermilion word, used on only two headlines (hero "Own" and the statement), never on every heading.

## Tagline
**God's Own Country** is the message of the whole page: the hero headline, repeated once at the sea footer as the closing line. The descent is the proof of it: each station shows why.

## The spine: a composite fall from cloud to coral
Kerala is a strip 35 to 120 km wide between mountains and the Arabian Sea, with 44 rivers running west. The page is a **composite descent** (not one river; the plan and copy say "a fall across Kerala", the client fact-checks the figures): from **2,695 m on Anamudi** through tea hills, spice forest, a waterfall, the backwaters, **below sea level in Kuttanad (about -2 m, rice grown under the waterline)** to **0 m at the sea**.
It is shown as big things, not margin text: a **large altitude numeral** (48 px+, serif) pinned bottom-left that counts down as you scroll, and a **painted river body** (a bold SVG shape, 24 px at the top widening to a full band at the sea) running down the right edge. Both **fade out** in the weather section (off the axis on purpose) and return at the sea. Not Kathakali night (`kerala/`) and not a road (`evm2/`).

## Palette (two quiet colours plus one loud accent)
1. **Recommended, paper, backwater, vermilion:** paper `#f3f1ea`, backwater green-black `#14302a` (12.5:1 on paper), vermilion `#ee5a36` laid over things (the one word, the drop, the active list item, the button, petals); on the dark green 5.0:1; on paper only for large type, `#d03712` (4.6:1) for small.
2. **The reference lifted:** paper `#f4f3ef`, cocoa `#2c2623`, hibiscus `#d94f7a` (4.0:1 on cocoa, large type only). Softest, closest to Red Dot.
(The lime option is dropped; the critic also said two palettes is enough.) No gold, champagne or brass.
**Dark sections (like the reference's 40%):** the Descent (green-black), the weather list (green-black), the sea footer (deeper green). Hero and statement are light-toned (fog and paper); the people section is paper.

## Three hero options
1. **Touchable mist (recommended, interactive).** Full-bleed tea hills at dawn under fog; the cursor or a finger wipes it away, it drifts back; headline "God's Own Country" bottom-left; altitude numeral at 2,695 m. One canvas fog mask over a sharp large photograph, started after first paint; a thinned-fog still for no-JS and reduced motion. **Photo risk, stated plainly:** I have not yet found the exact photograph (Wikimedia Commons rate-limited me during the plan, and Pixabay's API answered 400). The hero needs a 3000 px or wider, soft-lit Munnar or Wayanad hills photo; if none passes by eye, the fallback is a painted hills scene I draw in layered SVG (you love illustrated heroes), same fog mechanic. You would see which one I used in the handover. Precedent: Solar Fog, Mountain Retreat (loved).
2. **Painted coast with a living light (interactive, needs no photographs).** An illustrated Kerala coast at dusk (palms, a chinese fishing net, a boat) drawn in layered SVG in the page palette; the cursor is a lantern that lights the boat and the water, and the boat drifts toward it. Loved precedents: Halvøy cabin, Pirate Ship, Solar Fog. Risk: the drawing has to be good; I would build and look at it before showing you.
3. **Monsoon backwater at dawn (painted, interactive).** A painted backwater with a houseboat and palms under falling rain; the cursor parts the rain and the water lights up around it, the boat rocks. Needs no photographs, and has a subject (the owner's ratings favour places over abstract shapes). Risk: same as option 2, the drawing has to be good.

## The flow (about 12 to 13 screens tall; Red Dot is about 21)
| # | Section | Content | Relation to Red Dot | Layout, focal element | Motion |
|---|---|---|---|---|---|
| 1 | Hero, 2,695 m (light, fog) | headline **"God's Own Country"** (Kerala's own tagline, with "Own" as the one vermilion word), a short line under it ("One long fall, from cloud to coral"), Plan your trip, scroll cue | adapt | fog-covered hills, headline bottom-left | cursor wipes fog; lines rise; **the fog clears into the statement** as you scroll, so it is one move |
| 2 | Statement (light) | "44 rivers. 590 km of coast. One long fall." | copy | very large centred serif; the hero fog parts here and the painted river body draws itself down the right edge while the numeral counts through it | words reveal, river draws, numeral counts |
| 3 | **The Descent (new, dark, the spine)** | five stations, each one line, one place and **its activity as a moment inside the station**: Munnar tea, 1,600 m (a tea-picker, a tea-estate stay); Periyar forest, 900 m (a spice-plantation stay, a guide); Athirappilly falls, 80 m; Kuttanad backwaters, -2 m (a houseboat night, a paddy farmer under the waterline); Varkala cliff and sea, 0 m (a fisher) | new | pinned. A framed photograph with Red Dot's margins swaps per station beside a huge place name; an SVG cross-section of Kerala carries a vermilion drop; the numeral counts | frame grows to full bleed on entry, image wipes, drop follows scroll; phones unpin into stacked stations |
| 4 | **When to come (new, dark, off the axis on purpose: time, not height)** | four seasons as one weather dial: Monsoon (Ayurveda season, the tea-estate rain), Onam (flower carpets, snake-boat races), Thrissur Pooram and Theyyam season (elephants and fire at dusk), Winter sun | new (replaces the centred list) | a large dial you turn by scroll or drag: each stop changes the full-bleed photograph and the weather, real rain on a canvas, petals, bright haze, firelight; the altitude numeral turns into the dial reading (month) | dial turns, rain canvas only while on screen |
| 5 | The sea (footer, deep green) | "God's Own Country" closing line, the Plan your fall control, a few links | adapt (giant footer mark) | the huge word fills with water as you reach 0 m, wave moving along its top | scroll-driven fill, then the wave idles |

**Mirror count (honest, now fixed):** 5 sections. Hero (adapt), statement (copy) and footer (adapt) have a Red Dot counterpart: 3 of 5. The Descent and the weather dial are new. The people moments the reference is known for live **inside the Descent stations** (a tea-picker, a spice guide, a paddy farmer, a houseboat boatman, a fisher), so the page keeps the reference's warmth without a second framed-photo section. That removes the repeated device the critic named.

**What the fall gives the visitor at 0 m:** **Plan your fall**, one control, not three boxes: the painted river itself, which you pull longer or shorter with a drag (2 to 14 days) like a rope. As you pull, a route draws itself down the cross-section and stations light up in order with a number of days each, then a link to keralatourism.org's planner. The day counts are suggested and illustrative, labelled as such on the page, and the client confirms them. It does what Red Dot's button does not: it shows the shape of the trip before asking for an email.

## New sections: design, alternative, precedent
- **The Descent.** Alternative: a horizontal pinned journey; second because a fall is vertical. Precedent: Orra's pinned chapters, the Garden's thread. Risk: a pin that feels stuck, so each station is a short fixed distance, and phones unpin.
- **When to come.** Alternative: a twelve-month wheel; second because it is a chart. Precedent: Halcyon's sky-to-night, the Garden's night mode. Risk: rain canvas cost, so it draws only while on screen.
- Inspiration shortlist for each is gathered after the go and written into the README.

## Easter eggs (load only when found; touch versions)
1. **Pookalam:** type "onam" (touch: long-press the altitude numeral). Concentric petal rings bloom from the cursor in vermilion and fade.
2. **Snake boat:** click the wave on the sea footer (touch: tap it). A vallam of tiny oarsmen rows across with a wake. Tied to the thick wave, not a thin line.
3. **Kingfisher:** after about 20 seconds idle a kingfisher lands on the painted river body; click it and it dives and the river ripples.
Triggers are listed in the README.

## Photo supply (the biggest risk, decided now)
About 9 photographs are needed (hero, 5 stations with people in them where possible, 4 weather stops, minus overlap). Wikimedia Commons rate-limited me and Pixabay's API answered 400 during the plan. **Rule: no mixed page, and you choose now (see the end).** After your go I source gently and judge a contact sheet by eye. If the set passes (wide enough, soft-lit, people in focus, one warm-muted grade applied in the build), the page is photographic. If it fails, the **whole page switches to the painted style of hero option 2**, never half and half. Your choice of hero tells me which way to lean: option 1 is photographic, option 2 is painted throughout.

## Type
Newsreader (light) and Albert Sans, both free and self-hosted, as stand-ins for Red Dot's licensed fonts. One light weight rule, no italics, no hairlines, no small labels.

## Plan checklist line
No gold, no hairline rows or small labels, no row of equal cards, no filler section, three hero options, three easter eggs. Impeccable, checklist, motion probe vs Red Dot, media check, detail audit, owner-critic and a side-by-side with Red Dot run before handover.

## What I need from you
Your go, with your picks: hero (1, 2 or 3; I recommend 1), palette (1 or 2; I recommend 1), and **photographs or painted** (I recommend photographs with the whole-page painted fallback). One thing to know: the page is about 12 screens tall, shorter than Red Dot (about 21), because it is a highlight reel.

## Drawing rules (from the critic)
The river body and the fog are flat shapes with real edges and soft grain, not gradients; the fog is a canvas mask, not a gradient overlay. The altitude numeral is big (48 px+), not a label.

## If the photographs fail and the page is painted
The tea-picker becomes a painted figure in the same flat-shape style as the scene (a person bent among rows, a basket, a sari), never a diagram. If you would rather not risk that, choose photographic now and I will tell you in the handover which stations lack a good person photograph.

## Critic status
Three rounds run. Round 3 verdict was "fix first"; the remaining open points are the photo supply (it cannot be resolved until I source images after your go) and the Descent carrying five stations (each gets its own pinned photograph and moment, I will check it by eye in the build). Everything else the critic named is fixed above.
