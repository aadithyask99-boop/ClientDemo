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

---

# Plan v2 for the new sections (2026-11-03, awaiting the owner's go)

Funnel run on details.so (free slice, human pace). Categories read: `timeline`, `text-showcase`, `pinned-scroll` (Milestones); `stats`, `social-proof`, `testimonial` (Proof); `cta`, `cursor-interaction`, `hover-animations` (Where next). Eight sites resolved to real URLs and seven captured and read in full-size strips: Eladio Dieste, Tengile MalaMala, Virugroup, Decimals, Red Dot, Gravelle du Parc (Spyker Cars rendered blank in the capture tool and could not be studied). Motion probed: Dieste 105 elements moving with scroll, Virugroup 77, MalaMala 94 (ESR 271). Kept six, dropped the rest: the others are SaaS or product sites (Rogo, Lovable, Littlebird), or colour-heavy and playful (Gravelle's stat tiles, Decimals' peach portraits), which break ESR's black and white.

ESR itself is listed on details.so under "Social proof: List, Pinned scroll", i.e. its marques roller. So the roller is the reference's own answer to proof; the new sections sit beside it, not instead of it.

## Milestones (1952, 1985, 2013, 2019)
**Question the visitor asks:** how did this become so big?
**Recommended: a line through time.** Pinned scene, as built (year at roller size rolling digit by digit, one line, one tile), plus a 1px vertical line down column two with a small diamond node that travels with the scroll and four tick marks, and the tile entering from alternating sides at slightly different sizes. Precedent in our sites: orra pinned chapters, more-coffee pinned statement cards (the swap), portfolio scrubbed scenes.
**Alternative: giant years behind a photo collage** (MalaMala's long scroll, years set over staggered photographs). Second because it needs real archive photographs the client has not supplied, a long scroll for four dates, and a colour wash.
**Risk:** the pin must unpin on phones (it does); the node must not become a decoration (it only marks progress).
**Inspiration shortlist**
1. **Eladio Dieste, https://www.eladiodieste.com/** (architecture, black). A vertical hairline down the middle with a diamond node; years sit on the line and brighten as the node passes; photographs of different sizes sit left and right of it in a loose collage; 1917 to 2000 in text. Mechanism borrowed: the line and node as progress, years on the line, photos entering alternately. Re-skin: ESR's grid (line at column two), 92px years, one 216px tile at a time, black and white. Probed: 105 elements move with scroll (about 39% of ESR's), 1 canvas, 1 video. Risk: its collage is dense; ours shows one image per date.
2. **Tengile MalaMala, https://tengilemalamala.com/about** (safari hospitality, heritage). Our subject-adjacent example: a family and land history in a warm cream palette, with giant years (1900, 1927, 1970) that sit half behind archive photographs on a long staggered scroll. Mechanism borrowed: oversized years overlapped by photographs, which makes the years the picture. Re-skin: ESR black or white, no colour. Probed: 94 elements moving. Risk: the long scroll and the dependence on archive photos.
3. **Spyker Cars Heritage, https://spykercars.com/heritage** (automotive, rooted in the client's subject). Listed under Timeline; the capture tool returned a blank page, so it is not studied. Needs a look in a real browser before it can be counted.
**Borrow from:** Dieste (1). **Reject:** Daylight and Understory (already carded: coloured steps and cards).

## Proof (one customer, three numbers)
**Question the visitor asks:** can I trust them?
**Recommended: figures on a photograph.** The customer's line stays as a 40px statement whose words light up. The three figures (No. 1 dealer 2012 to 13, 20,000 Nissans, 350+ Porsches) become three solid white squares set over a full-bleed photograph (the Munnar hills or the highway), each at a different scroll speed so they drift past each other, with the number counting up inside, set at 92px in black. The square is ESR's own tile shape (216px). Precedent in our sites: orra's counters (glass cards that count up), more-coffee's badges.
**Alternative: three hairline rows with counters** (as built). Second because it is a flat list; it was the weakest section against ESR in motion.
**Risk:** white squares over a photo can read as boxy cards; keep them square, flush, no shadow, one number each, three at most.
**Inspiration shortlist**
1. **Virugroup, https://www.virugroup.com/en/nosotros/** (a family food group with plantations, Peru and Spain; rooted in the client's subject: a family group that farms and trades). "50+ countries supplied", "10+ processing plants", "128+ ..." as white squares over an aerial photograph of pickers, large dark-green figures; plus a dated "through the years" list. Mechanism borrowed: figures as solid squares over full-bleed photography. Re-skin: ESR black on white, our photo. Probed: 77 elements moving; some sections static. Risk: its tiles are many and sit in uneven positions; we keep three.
2. **Decimals, https://www.decimals.co/** (design recruiting; one customer at a time). Testimonials in a stacked scroll: each customer is a card that slides over the last with a cut-out portrait and one line. Mechanism borrowed: one voice at a time, stacking. Re-skin: no portraits (we have none), type only, black. Risk: peach colour and portrait cut-outs do not fit ESR; only the stacking is useful. Not recommended for this page; kept as the second idea for `/reviews`.
3. **Red Dot, https://www.reddottours.com/** (luxury travel, Sri Lanka, Nepal, the Maldives; subject-adjacent): a review strip with "In your words" under a rating bar. Mechanism borrowed: the customer's words set as large type with the source rating beneath. Risk: its review block is small; use only as a typographic cue.
**Borrow from:** Virugroup (1).

## Where next (people, careers, contact)
**Question the visitor asks:** where do I go from here?
**Recommended: giant links with a photo that follows the pointer** (as built): three 92px links, the word under the pointer black and the others fading (ESR's roller logic), a tile that follows the pointer, a tap-to-show tile on touch. Precedent in our sites: halcyon's services list (the word lights up and a photo trails the pointer), djeska's rooms list.
**Alternative: the footer photo grows.** A square photo sits beside the links and, as you scroll into the footer, grows to full-bleed behind the wordmark, so the page ends on an image. Second because it adds weight and a second full-bleed image after two already.
**Risk:** hover has no equivalent on touch (handled); three links is thin, so each gets one line of what it leads to.
**Inspiration shortlist**
1. **Red Dot (above)**, "This way for ideas": a centred list of ways to travel (Culture and History, Wildlife and Wilderness, Honeymoons) switched by a tab, each a line of large serif type that opens a set of trips. Mechanism borrowed: a short list of large words as the whole call to action. Re-skin: ESR's grotesk, black and white. Cursor interaction is listed on its tag but not confirmed in the capture. Risk: our three links need a real destination each.
2. **Gravelle du Parc, https://www.gravelleduparc.com/en/** (a gravel cycling event; media showcase with cursor interaction): a video in a frame that opens full width as you scroll, framed by oversized type. Mechanism borrowed: a media frame that expands with the scroll (the alternative above). Re-skin: our photograph, no frame decoration. Risk: its purple and green palette and sticker graphics are not ours; mechanism only. Libraries on it: GSAP, ScrollTrigger, Swiper, Framer.
**Borrow from:** halcyon's pointer-trailing photo (our own), with Red Dot's "list of large words" framing.

## What is not new
Hero, statement, both photographs, marques roller, sectors rows and footer all have an ESR counterpart and stay as built.

## Cards to write after the owner's picks
`inspiration/dieste-line-timeline.md`, `inspiration/virugroup-stat-squares.md`, and a line each in `patterns.md`.

## Palette (2026-11-03; checked with `scripts/palette.mjs` and measured)
**Ground** #ffffff and #000000 (alternating sections, as ESR). **Ink** #000000 on white, #ffffff on black. **Muted** #6e6d6c on white, #9b9b9a on black. **Line** #191919 on black, rgba(0,0,0,.16) on white. **Accent** EVM red, one, small: #d6111c on white grounds and #ef313b on black grounds. **Spark:** none.
**Reason.** EVM's core idea is cars with a red mark (the client's logo red is #fc0000). ESR's colour rule is black and white with no accent, and the owner loves ESR's language, so the build keeps ESR's black and white and adds EVM's red only as a small accent, as `colour.md` section 1 says: never in large areas, never in text. Red appears only as: the progress line and node in Milestones, the focus ring, the hover arrow on text links, and the Contact button hover. The EVM wordmark stays one colour (white or black), as in ESR.
**Contrast (measured).** Pure logo red #fc0000 is 4.09:1 on white, which fails body text, so it is not used as text and is not used at all on white; the nudged #d6111c is 5.31:1 on pure white (passes) and 3.96:1 on pure black (graphics only, 3:1 needed), and #ef313b is 5.17:1 on black (passes). White on #d6111c, as in the Contact hover, is 5.31:1. Black on white 21:1. Muted #6e6d6c on white 5.16:1, #9b9b9a on black 7.55:1. (`palette.mjs` reports 4.9:1 for #d6111c because it measures against its tinted ground #f9f6f6.) The pale inactive marques (#d2d2d2 on white, 1.5:1) are ESR's own device and stay: they are a state, every item is a link and carries its name for assistive tech.
**Alternative.** `palette.mjs` option A, a tinted ivory ground #f9f6f6 with near-black ink #1e1011 and the red as accent (17.2:1 ink, 4.9:1 accent), with the black sections on #200e0f. Second because it drifts from ESR's pure black and white, which is what the owner asked to match; it would suit the client's own site better than a copy of the reference.

## Result of the plan v2 build (2026-11-03)
- **Milestones:** pinned, as before, plus a 1px line down the right of the year (at column three minus 36 px) with four ticks, a red fill that grows with progress and a red diamond node that travels down it; the tile frame enters from alternating sides and alternates between full and 0.74 scale. The pin is 24svh per date.
- **Proof:** the quote keeps its word-by-word light-up; the three figures are now three white squares (300px, no shadow, no radius) over a full-bleed photograph of Munnar under a flat 30% scrim, drifting at three different speeds, with counters. Squares stack without drift on phones.
- **Where next:** as recommended, plus one line under each link saying what it leads to, and a 64px thumbnail on touch instead of the pointer tile.
- **Measured:** `compare-sheets.py` 9,975 px (1.45x), 365 words (1.1x), 9 sections, no warnings. `motion-probe.mjs`: 217 elements move with scroll against 272 (80%), no section without motion, no doubled borders (the first probe found one in Sectors, 17 px apart, from a row border and the first item's border; one removed), wheel-notch curve 232, 304, 358, 389 against the reference 214, 314, 360, 382.
- **Checklist 19 (settled state):** every animated word, row, square and footer item reaches opacity 1.00 after scrolling through; counters end on 1, 20,000 and 350; no overlapping squares on a phone after the drift was limited to desktop widths.
- **Checklist 20 (colour):** red appears only on the milestone fill and node (measured), as the focus ring, on the hover arrow of text links and on the Contact hover; no gradients on the page (0 found); contrast per the palette line above. Impeccable still lists 9 low-contrast findings: all are the start state of text that is revealed by scroll (they read 1.2 to 1.7:1 only before the animation runs, and reach full opacity: measured); one text-over-photo flag was removed by adding the flat scrim.
- **Alternatives not built:** giant years over a photo collage (Milestones), hairline rows with counters (Proof), a footer photo that grows to full bleed (Where next), the tinted palette option A.
- **Cards to write after the owner's picks:** `inspiration/dieste-line-timeline.md`, `inspiration/virugroup-stat-squares.md`.

## Media quality and scale polish (2026-11-03)
**Replaced:** `hero.mp4` (was 1440x810 at about 750 kbps, drawn at 1440x900, scale 1.11: pixelated) with a 1920x1080 film at 3.65 Mbps from Coverr's 1080p tier; added `hero-phone.mp4` (720x1080 crop, 2.2 Mbps) for screens under 860 px; `hero-poster.webp` regenerated at 1920 wide; `photo-kochi`, `photo-tea` and `tea-wide` re-exported at their native 2048 px (they had been downscaled to 1800 to 2000). Sources and licences are in `evm/README.md`.
**`media-quality.mjs`:** before, 1 upscaled (the hero) and 3 soft on retina; after, 0 upscaled, 4 soft on retina (the hero at scale 0.83 and the three photographs at 0.70 to 0.76), 11 sharp. Retina sharpness needs about 2880 px photographs; the CC0 sources that large are on Wikimedia, which returned 429 from this container. Ask the owner to add `upload.wikimedia.org` and `commons.wikimedia.org` under Allowed domains, or supply the files.
**Scale polish:** statement and sectors statement 40px to 63px (4.4vw); Milestones tile 216px to 418px and caption 20px to 36px; Proof squares 300px to 317px with the figure at 76px and the caption at 28px (so the text fills the square); Where next descriptions 14px to 25px; logos drawn as real `<img>` (white on black) instead of CSS masks.
**Probe, "possibly under-scaled":** 7 before, 4 after, against the reference's 3. The four left are sections 4, 7, 9 and 10: Marques, Milestones and Where next set their large type letter by letter and digit by digit, and the probe ignores single-character text nodes, so it reads their 92 px, 187 px and 92 px type (measured on the page) as 14 to 36 px; the footer is mostly empty by design and the reference's footer is flagged for the same reason.

## Detail pass (checklist 23, 2026-11-03)
`detail-audit.mjs` found: 8 files across 10 sections with tea or Munnar in five of them; the hero line, the statement and the sectors statement each listing the same businesses; 1952 told in the statement and again in Milestones; a plain text list in the header over the hero and a menu button, plus a footer list; destinations linked four times (/about, /marques, /sectors, /history, /contact); section labels that repeated nav words ("Marques", "Our sectors", "All marques", "Full history", "All recognition").
**Changed:**
- **Images (8 files in 10 sections, tea five times, to 3 files in 9 sections, each once):** dropped the second full-bleed photograph (tea), the five hover tiles in Sectors, the four Milestones tiles and the three Where next tiles (pointer tile and phone thumbnails); deleted `photo-tea`, `tile-cinema`, `tile-porsche`, `tile-resort`, `tile-truck`. What is left: the hero film, the Kochi fishing nets (one full-bleed photograph), the Munnar hills (behind the proof squares) and the brand logos. Moments that lost an image are text-only, set larger.
- **Text:** hero line "Seven decades of one family business across Kerala."; the statement tells the 1952 story and names the leaders, with no list of businesses; the sectors statement lists the businesses once ("Dealerships, hotels, plantations, buses and cinemas") and the five rows name them; Milestones no longer tells 1952 (now 1985, 1988, 2001, 2019) and the marque notes carry no dates that Milestones states.
- **Navigation:** one system, a pair of labels at the top left and Contact plus the menu button at the top right, from the first screen; the plain text list is gone from the hero and the footer; the menu overlay lists all six destinations. Section labels no longer repeat nav words ("Brands we represent", "The group", "Five businesses", "Awards", "Where next"); links read "Every brand", "Every business", "The full timeline", "More awards", "More customers". No destination is linked more than three times (/contact: header button, menu, Where next). Section labels sit at least 84 px below the top edge (they were 28).
**After:** detail-audit: 3 distinct files, no repeated text, no year or figure in three sections, one header layer, `/contact x3` the highest. Probe: 244 elements move with scroll against 272 (90%; the first run after the removals was 66%, so the sector names got the same letter-by-letter build as the brand names), no section static, no doubled borders, under-scaled 3 against 3. compare-sheets: 9,346 px (1.36x), 337 words, 8 sections.

---

# Plan v3: the people (2026-11-03, awaiting the owner's go)

**Owner's request:** the founder and directors, with their pictures from the client's current site, somewhere on the homepage, designed, not generic. New section, so the plan comes first (rule 0).

## The portraits we have (client's own, from `evmgroup.co.in/uploads//our-team/`)
| Person | File | Size | Background |
| --- | --- | --- | --- |
| E.V. Mathai, Founder | WP24_hVOj... .png | 212 x 269 | deep navy, old portrait |
| E.M. Johny, Chairman | 4tAxjq... .png | 131 x 166 | dark green |
| Sabu Johny, Managing Director | HIvyWe... .png | 212 x 269 | dark grey |
| Divya Paul, Director | oTuvXR... .png | 212 x 269 | white |
Small web-size portraits on four different backgrounds. They are 1:1 at about 212 px wide and soft above that; E.M. Johny's is 131 px wide and would be enlarged 1.6x at 212. The design shows them small by design (the reference's own tile is 216 px), in greyscale at one shared crop so the four backgrounds read as one set. Replacing a file later is a one-file swap. Top management (five more people, larger 413 px photos) stays on `/people`.

## Funnel (details.so free slice, category `team`, `about`, `list`)
Resolved seven real sites and studied five in full-size strips (Telha Clarke blank in the capture tool, dropped): Revelatio, K95, Griflan, United Carriers; motion probed for Revelatio (416 elements move with scroll, a canvas) and K95 (415).
- **Revelatio, https://revelatio.studio/about** (design studio, black and white): a hairline table, Name, Position, Location, with one large portrait at the left that follows the row. Mechanism borrowed: a list as the whole section, a single portrait for the active row. Re-skin: ESR's row type (20px/24px), 216 px tile, no table headers. Risk: its photos are large and studio quality; ours are small, so the tile stays small.
- **K95, https://k95.it/en/studio** (Italian design studio, saturated blue): a sticky list of first names where the active name lights as you scroll and the large portrait changes. Mechanism borrowed: scroll picks the active person. Re-skin: ESR black and white, names in ESR's row style. Risk: needs big portraits and its giant "TEAM" headline and blue are not ours; mechanism only.
- **United Carriers, https://unitedcarriers.com/about** (freight forwarding, subject-adjacent: transport, the client's own sector): "The people behind the promise": one featured leader's portrait and biography, the other leaders as faded ghost portraits beside him. Mechanism borrowed: one person in focus, the rest quiet. Risk: heavy blue and it reads as a corporate template if copied.
- **Griflan, https://griflan.com/agency/** (creative studio): a name list where the hovered name lights up and shows the person's cut-out portrait. Mechanism borrowed: hover shows the face. Risk: red and cut-out illustration style, not ours.
**Borrow from:** Revelatio (1) and K95 (2).

## Recommended: "Who leads it", four rows and one portrait
- **Placement:** straight after the statement, on the same white ground, as the second half of the About moment (the story, then who leads it). The statement stops naming the two leaders (a fact stated once), the "Our people" link moves here, and Where next drops its "Our people" link (it keeps Careers and Contact).
- **Layout:** label "Who leads it" at the left; four numbered hairline rows in the right column (founder first), each name at 40px (the reference's statement size) with the role in 16px under it; a 216 x 270 portrait tile in the middle column, greyscale, that changes with the row nearest the centre of the screen or the row under the pointer. Same logic as the Marques roller but in the numbered-row style of Sectors, so it does not repeat the roller's layout.
- **Motion:** names build letter by letter as they rise (as the brand names do); the tile wipes between portraits from the bottom (as the logos do); on touch the active row follows the scroll. Reduced motion: all four rows visible, first portrait shown.
- **Precedent in our sites:** halcyon's services list (the word under the pointer lights, a photo follows), orra's hover-bar table, djeska's rooms list, and our own Marques roller. **Pattern:** `patterns.md`, "Lists, and choosing among many items".
- **Why it fits:** the visitor's question is "who is behind this?". Four people is exactly one short list; one small portrait that changes is the right size for small photographs; the founder (E.V. Mathai, with a deep-navy portrait) sits first, which gives the family story a face.
- **Risk:** the portraits are small; the greyscale and shared crop keep them calm, but E.M. Johny's will look soft; ask the client for better ones.

## Alternative: a frieze
Four portraits in one row at their native 212 px across the three columns, names beneath, each rising at a slightly different speed as you scroll, the founder first. Second because it is the standard team row and shows every softness of the photographs at once.

## What changes elsewhere
Statement: "...led today by E.M. Johny and Sabu Johny" goes (said here instead). Where next: three links become two. Length: about +800 px (to about 10,150 px, 1.48x the reference, inside the 1.5x limit; a pin will be shortened to stay inside). Words: +25.

## Needs from the owner
A go, and ideally better portraits for the four people (Johny's 131 px photo is the weakest). Cost: none.
