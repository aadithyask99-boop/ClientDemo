# Client: UK Thech (new name pending), B2B IT supplier

Status: BUILT and published as a private artifact (2026-11-24); the build is in `ukthech/`. The plan below is what was approved ("go", fine with all recommendations); where the build departed from it: hero scenes are stills with a cursor-lit scene, not film (full-width video must be 1080p and generation access was blocked); the quote cloud uses four background-removed cutouts (no van); the hero's bottom-right Get a quote button became a frosted card that links to the promise scene; the footer gained a night reception-desk photograph; images are 1376 px previews pending the 2K downloads. Mode: **replicate-and-extend** of the homepage of https://108.supply/ (owner: "108 supply homepage is generally nice for us"). Also studied: primeasialeather.com listing and product page, used for two moments only (card hover swap, cursor-lit footer).

## What the client is (from the call, 2026-11)
UK B2B supplier of laptops and other hardware to schools, NHS and councils, hospitality, landlords. Quote-led, no catalogue, no product photos, no portal. Stock sourced from any major supplier, so price and availability are the edge. Education is Chromebook-heavy and buys on price from a trustworthy-looking dealer. The client needs three things from a buyer: **what product, how many, by when.** Must not look like an eBay or Amazon reseller. Brand is being renamed; "UK Thech" is obsolete. Competitors read: Softcat, CDW UK, Currys Business, Scan Business, Laptops Direct, Eurobusiness, Probrand, Switchshop.

## As-is homepage (ukthech.com, captured)
Poppins-style sans, green and red logo on white, a green overlay hero over a stock classroom photo (students in a non-UK school uniform), a wavy section edge, four icon badges (UK Based, 30 Day Credit, Next Day Delivery, Sustainable Thinking), generic copy, "Edit Template" text in the nav, unnamed testimonials, an unrelated "Service Partners" list. Keep: the four trust points (once confirmed), the four sectors. Change: everything visual, all copy, the hero photo, the testimonials and partners (no real ones).

## Reference readout: 108.supply homepage (captured and driven by hand)
- **Palette:** black stage (#000), off-white paper (#eff1f0), one lime accent (#dcff02) used only on the call-to-action; white rounded panels float on the black page.
- **Type:** Diatype at weight 400 throughout (86, 56, 48, 35, 20, 16 px), tight tracking, two-line headlines with the second line dimmed. Mono labels (dropped here: no small labels).
- **Hero:** black loader with the wordmark (about 1 s), then a full-bleed film inset 8 px with rounded corners (3324x2494 sources). Headline "Make it yours / <template>", line 1 fixed, line 2 swaps with a crossfade every 5.3 s. Four thumbnails bottom-left, the active one carries a progress bar, pressing one jumps scene. Floating pill nav; hover turns the pill white and opens a frosted mega-menu (list left, live preview right); pills turn light over white sections; hovers 0.3 s cubic-bezier(0.32, 0.72, 0, 1). Bottom-right toast expands to a stack on hover.
- **Rhythm:** hero, intro statement and logo row, "Most picked" carousel in a white rounded panel, "Mockup Gem" photo cloud around a headline, "It's all about the details" scroll scene, testimonials, pricing with ticks, about-the-maker line, big halftone logo footer.
- **Stack:** Astro, GSAP ScrollTrigger, Lenis, WebGL (5 canvases).

## Motion inventory of the reference
165 elements move with scroll; the first five strips (marquee and statement) have none. Hero: auto-advance 5.3 s, press a thumbnail to jump, mega-menu hover. Photo cloud: 22 scroll-moving and 20 pointer-moving elements, plus a self-running drift. Details scene: 110 elements (the richest). One wheel notch moves 157 px at 60 ms and about 370 px by 360 ms. Build target: at least 70 percent of 165 (about 115 elements) and no section without motion.

## Kept from 108 / Changed for this client
**Kept:** inset rounded film, floating pill nav with frosted mega-menu, thumbnail strip with progress bars, two-line headline with the dimmed second line, rounded panels, the single accent, photo cloud, scroll scene, footer wordmark, 0.3 s easing, Lenis.
**Changed:** subject (templates become sectors and the things a buyer needs), films (places, not people), copy, accent colour, no mono labels, no hairlines, Chromebooks dominant instead of equal tiles, price tags replaced by the brief, the ground alternates dark and light so the page is not dark for most of the scroll.

## The story in one sentence
A buyer sees their own sector at its desk, says what they need in one sentence (what, how many, by when), and watches the order arrive with its paperwork, from a supplier with a named, reachable person.

## The spine: "from request to desk"
Every order ends at a desk and every section is a place on the way. Hero: four desks (classroom, ward reception, council counter, hotel front desk), each a specific vivid place with a lit device and no people. The sentence "I need [Chromebooks] [30] by [September]" is the refrain and becomes the quote form. Then the parcel arrives and opens. It lives in the scenes, pacing and type; no drawn icon, no progress toy. **One object language across the page:** warm-light photographed or generated stills of real objects in real places (a stack of boxed Chromebooks, a charging trolley, an opened parcel). No neutral rendered laptops (they read as stock).

## Where the page builds trust (answer to the critic's question)
In the first two screens: (1) places that look like UK sectors, shot not stocked; (2) the named person, direct number, company number and UK address as type in the nav strip and footer (supplied by the client); (3) the sentence-form brief that promises a reply time the client will keep; (4) "send us the quote you hold" as a visible offer; (5) the order pack shown next, so accountability is visible. **What we have today:** the company number, a registered UK business, the sectors, claimed next-day delivery and 30-day credit (unconfirmed). **What we still need:** the new name and logo, a named person and real photo, direct phone, address, reply time, credit terms, recycling partner, brand authorisation. Until confirmed, those claims are labelled placeholders and not shown as fact.

## Safeguarding and generation rules
Generated stills and film for places and objects only. No faces, no children, no NHS logos, lanyards or uniforms, no real brand marks on generated devices, no fake accreditations; documents and certificates shown are labelled illustrative. People appear only as real client photography when supplied. Fallback that needs no generation: a slow camera move over a still, or real client footage; poster stills for phones.

Paperwork shown in slot 5 has no legible text: documents are out of focus, blank or turned away (generated text comes out garbled and would read as fake compliance). Fallback if a generated pack does not hold up: a photographed real pack from the client.

## Generation budget and consistency
One master style and light for every generated frame: warm late-afternoon low sun entering from camera left, a soft beam across a desk or floor, muted laminate and pale wood, navy and off-white objects, shallow depth, no people, no logos, no legible text. Frame budget: 4 hero first frames and 4 hero clips (6 s each), 8 object stills (Chromebook stack, trolley, tablet box, parcel, in-tray, floating objects for the cloud), 1 scene for the promise slot, 1 clip for the pinned parcel scene (scrubbed as a video encoded with a keyframe on every frame, not 100 stills), 1 van still for the egg. About 5 clips and 15 stills, capped at 20 stills; any frame that breaks the master look is regenerated or dropped.

## Palette chosen by the owner: C, graphite and blue (owner's words: "graphite one is better", with a white label inside the button)
Ground #16181b, paper #f2f0eb, accent blue **#4663ff** (nudged from #3d5afe so the white label stays above 4.5:1: white on blue 4.68, blue on graphite 3.8, blue on paper 4.11). Rule: the blue is a fill and big-type colour; small text on dark uses paper, and a lighter tint of the same blue (#9db0ff, 8.5:1 on graphite) only for links. Button: blue fill, white label. If the owner meant a white button instead: white fill with a graphite label (17.8:1) and an outline on the light side.

## Type chosen by the owner: Host Grotesk (owner picked option 1 of five)
One family only, as on 108: Host Grotesk, headlines weight 400 with tight tracking (about -0.035em) and the second line dimmed, buttons weight 500, body weight 400. No mono labels, no italics. Self-hosted (fontsource, OFL), not loaded from Google: faster, and no visitor addresses sent to a third party (the client advertises UK GDPR compliance). To check before locking: numerals for the phone number, the pound sign, and the phone rendering. Considered and not chosen: Funnel Display (more character, less quiet), Inter Tight (safest but generic), Red Hat Display and Onest (more consumer).

## Palettes considered (two quiet colours plus one loud accent; no gold)
| | Ground | Paper | Accent | Contrast |
|---|---|---|---|---|
| **A. Stage and lime** (108's own) | #000000 | #eff1f0 | #dcff02 | paper on ground 18.5, black on accent 18.4; lime is a fill only (1.01 on paper); closer to 108, more "tech startup" |
| **B. Navy and coral** (recommended: warm, trusted, reads school and public sector) | #0d1b3d | #eef0f5 | #ff6a3d | paper on ground 14.8, accent on ground 5.95, black on accent 7.4 |
| **C. Graphite and blue** | #16181b | #f2f0eb | #3d5afe | paper on ground 15.6, accent on paper 4.5, white on accent 5.1; blue on ground only 3.5 (fills and large text) |

## Three hero options
1. **Sector scenes with a living cursor (recommended, the replica):** 108's hero. Four specific places (a school corridor at dusk with a lit charging trolley, a ward reception desk at night, a council counter, a hotel front desk), thumbnails with progress bars press to switch, line 2 swaps "Schools / Hospitals / Councils / Hotels", and the scene responds to the cursor (the light beam and foreground shift and a soft light follows it), so the first screen changes with the visitor. Technique: generated first frames then Seedance clips (about $0.16 each), poster and slow-push fallback. Risk: device-screen and hand artifacts, so devices stay unlit-screen or blank and no hands. Precedent: halcyon's generated film; motionsites Smoothie Slider (object and background change per item), Flower Valley 3D (cursor-lit field).
2. **Build the order from the scene (interactive):** one still desk scene where you press three large real objects (a Chromebook stack, a charging trolley, a tablet box) and they drop into a tray that is the real quote form, filled in as a sentence. If this wins, section 4 stops being a form and becomes a different moment: the sentence the visitor completed in the hero writes itself out and the parcel for it appears (so the two never repeat). I recommend option 1 as the hero so section 4 stays the one place the quote is built. Precedent: motionsites Chef Stack and Outfit Carousel. Risk: hotspots over photography read as a gadget unless the objects are large and the tray is built to the same craft; fallback is the plain sentence form.
3. **The trolley opens (character object):** a charging trolley (the one object every school knows) as the hero object, its doors opening onto the sector scene as you scroll, built from generated stills in a scrubbed sequence. It has character, unlike a neutral laptop. Precedent: more-coffee's tub and 200-frame sequence, halcyon's keycaps. Risk: frame consistency across the sequence (render or tightly prompt), and a scrub needs a keyframe on every frame.

## Section plan (slot map from 108, v2)
| # | 108 section | Client content | Layout and focal element | Motion | Assets |
|---|---|---|---|---|---|
| 0 | Loader | new wordmark on dark | wordmark | draw in, 1 s | wordmark (name pending) |
| 1 | Hero film | "Tech for [sector]" + "Get a quote" | inset film, pill nav, thumbnails | auto-advance 5.3 s, press, mega-menu, cursor-lit scene | 4 generated places |
| 2 | Intro statement (paper ground) | one statement of the offer, large across the screen, with the four sectors set inline as words inside the sentence (different lengths, not a row of pills) | 86 px type over three lines | words reveal and brighten with scroll scrub, the sector words underline in the accent | none; no brand logos (type only, and only after the client confirms) |
| 3 | Most picked (rebuilt) | "What schools buy first": Chromebooks as a dominant panel (about 60 percent of the width), a charging trolley and a stack of tablets much smaller beside it | one white rounded panel, drag; properly asymmetric: the Chromebook image runs the full height of the panel and the trolley and tablets sit as two unequal pieces beside it | drag, hover swaps the still for a close-up (PrimeAsia's card hover), arrows | generated stills of objects in warm light |
| 4 | Mockup Gem photo cloud (the centrepiece) | "I need [Chromebooks] [30] by [September]" as one large sentence with big tappable choices and a lime-style send button; objects float around it | paper (light) stage, huge navy sentence, object stills drift round it | pointer and scroll drift, choices animate, the form is real | generated object stills in the hero's light |
| 5 | It's all about the details (pinned scroll scene) | "Every order arrives with its paperwork": a parcel opens on a desk, the pack lifts out, a certificate is set down | white panel, pinned scrub of a frame sequence | scrub, the one pinned scene | generated stills as a sequence; documents labelled illustrative |
| 6 | Pricing, merged with testimonials | "Send us the quote you hold. We will try to beat it." The drop zone is drawn as a physical in-tray on the desk in the scene (not a dashed box); the reply time is a placeholder until the client confirms it | full-bleed dark moment over a hero-quality scene, one large promise and the in-tray | scene drifts; as a file nears the in-tray a desk lamp warms and its light spills across the desk (the payoff), then the promise settles | one generated place; only claims the client confirms |
| 7 | Hi, I'm Ariel + footer (one moment) | the footer is one moment: the named person and direct number set very large beside the lit wordmark, then sectors and contact | big wordmark and big contact type on navy, lit by the cursor (PrimeAsia's footer) | wordmark reveal, light follows cursor, the number types on | wordmark; placeholder name and number until the client supplies them; no generated faces |

Eight sections plus the loader, none empty: each has a focal element at 108's scale and a real motion. No new sections beyond 108's slots; the one extension is that slot 4 is a working quote builder.

## Mechanism per section (variety audit)
1 Hero: auto-advance, thumbnails, cursor light; 2: scroll scrub of words; 3: drag with hover swap; 4: tap choices with pointer drift; 5: pinned scroll scrub (the only pin); 6: in-tray and scene drift; 7: footer, cursor-lit wordmark with the number typing on (slot 0 is the loader). Grounds, stated honestly (about 40 percent paper by height): hero dark, 2 paper, 3 navy with a white panel, 4 paper (the photo cloud on a light stage, so slots 4 and 6 differ), 5 navy with a white pinned panel, 6 dark full-bleed scene, 7 navy footer. The reference is dark for most of the scroll; the paper slots keep a school or NHS buyer from a page that is all black.

## Easter eggs (rooted in the supplier's world)
1. **The charging trolley:** type "chromebook" (touch: long-press the Chromebook panel). A trolley rolls across the bottom, laptops light one by one, then it rolls out. Lazy-loaded.
2. **The purchase-order stamp:** hover the send button for two seconds, or on sending a quote a rubber stamp slams "RECEIVED" (touch: on send). Sound only on a deliberate tap, low volume. (Replaced the five-click trigger, which was undiscoverable and accident-prone.)
3. **The delivery:** keep scrolling at the very bottom; a van (a generated still in the master look, cut out and slid across the footer, not a vector drawing) crosses and leaves a parcel by the wordmark (touch: overscroll). At most one subtle hint cue per visit.

## Cut or linked out
About the company, GDPR and privacy, sustainability and recycling detail, per-sector pages (Education, Public sector, Hospitality, Property), the full service list: separate pages, linked from the mega-menu and footer.

## What I need and what it costs
From the client: new name and logo, named person and a real photo, direct phone and address, reply time, credit terms, recycling partner, brand authorisation, one real customer quote (optional). Generation: about $0.80 for five clips (four hero scenes and the pinned parcel scene), about $0.30 for the stills, about $1.10 in total, under the $2 cap. Placeholders are labelled illustrative and listed in the README.

## Plan checklist line
No gold, no hairline rows or small labels, no row of equal cards (Chromebooks dominant), no filler section, three hero options, three easter eggs.

## Motion sites lookup (previews opened, frames captured)
Smoothie Slider (swap the object's word and background per item), Outfit Carousel (pick items from a scene into a list), Chef Stack (objects scattered round a figure, picked into a stack), Card Story (items orbit then gather into a ring), Flower Valley 3D (a cursor-lit field), Noodle Twirl (objects assemble round the headline), Peculiar Atelier (grab and drag a cloth). Frames are in the session scratchpad (`ms/hero-sheet.png`, `ms/inter-sheet.png`).
