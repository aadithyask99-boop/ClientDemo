# Alder & Vale (concept homepage)

A hypothetical heritage knitwear label, built as a like-for-like replica of a studied web design reel (a concept streetwear store shown on Instagram by @aimen.webs, which the owner supplied as the reference). Mode: **replicate**, owner confirmed. The page structure, the order of sections, the interactions and the motion follow the reel. The subject, brand, imagery, copy and code are all original: Ralph Lauren-style knitwear (quarter-zip, crew neck, cable knit, polo), with a stag where Ralph Lauren puts a bear. Live at `/alder-vale/` when the shared demo deploys.

No real brand is used. "Alder & Vale" is fictional. Nothing on the page is a real product, price, review or statistic.

## The spine

An ascent to a lodge. The intro counts 0 to 2,480 m, the weather section is snowfall and a ridge, the Lodge Log is a line climbing a night peak with a review planted at each altitude, the drop is the lodge porch at dusk, and the footer is the valley below. Every section is a place on that climb.

## What replicates the reel, section by section

| Reel | This page |
| --- | --- |
| Altitude counter intro, diagonal wipe | Counter 0 to 2,480 m, pale fade, a slanted band wipes up to reveal the hero |
| Hero, giant graffiti wordmark behind the model, colourway picker with a mist swap | Giant stencil "ALDER & VALE" behind a cut-out model, four colourways (Midnight, Snowfield, Pine, Hearth) swapped inside a fractal-noise mist (about 0.3 s, the sweaters cross-fade inside it), title re-rolls. The hero stays pinned and the collection slides up over it like a curtain. |
| Jacket flies to the bag, cart drawer with "pairs with" | Thumbnail flies to the bag, drawer slides in with an upsell and a free-shipping bar |
| New Collection grid, hover quick-add | Feature card plus eight knits, hover lifts and opens size quick-add |
| "Engineered, not styled" four stat cards | "Knitted, not styled", four macro photographs with counting figures |
| Type that moves like weather | Slate ground, a peak rising with white ice shards, headline letters scramble in; then a framed photo grows to full-bleed while a second headline scrambles in. The cursor blows letters aside and sways the shards. |
| Pinned 3D jacket with callouts | Pinned scene: words brighten, the knit tumbles in 3D with cursor tilt, three tags anchored to the knit, the stag mark and closing line |
| Cold Ops inventory shelf | Lodge Edit: dark shelf of accessories, drag to scroll, hover quick-buy |
| (new, not in the reel) Try the look | A turning 3D ring of six full-body people on a beige stage, autoplay every 5 s, drag or swipe, 01 to 06 progress ticks named after altitudes, a popup with numbered pins that grows from the ring, an "In this look" panel with size pickers and a bundle price (10% off, computed), phones get a diagonal line of people, a docked swipe row and a size sheet. Mechanics follow a Shopify runway section the owner supplied; every name, product, image and line of copy is ours. Pieces go into the same cart drawer, with a bundle saving line that disappears if a piece is removed. |
| Lookbook mosaic | Lookbook: three columns drifting at different speeds |
| Summit Log, flags up a peak, rating counts up | Lodge Log plays itself when it enters: the rating counts 1.8 to 4.9, a glowing line climbs a night peak, six flags pop up and the review card changes with each |
| Drop countdown | Drop 02 over a blue-hour lodge porch (a lighter scene than the log before it), live countdown to 20 Dec 2026 |
| Giant footer word, figures, "footer climbs" | Footer sheet rises over the drop, giant word with three people placed on the letter tops by measuring the type (one stands, one sits, one lies), valley |
| Cart to checkout in two clicks | Drawer, loading screen, checkout page (express pay, contact, delivery, summary) |

## Easter eggs

- **Last look glow:** on look 06 a faint rose light washes over the stage.
- **Snow in the popup:** snow falls while a look is open.

- **Cocoa:** type `cocoa` anywhere. Steam rises from the bag and a toast appears. (Desktop keyboard only.)
- **Melt:** press and hold (or touch and hold) on the hero. A warm glow opens and the snow near it melts away.
- **The lodge window:** in the drop section, click or tap the lit window. The room glows and the line changes to "The fire is lit."

## Look

- Palette: navy `#0f1c33` and ivory `#eeebe4` with oxblood `#8c2433` as the one loud accent (buttons, flags, count badge). Hero grounds change per colourway. No gold.
- Type: Anton for headlines (condensed, uppercase), Big Shoulders Stencil for the wordmark, Manrope for UI.
- The stag logo is a vector traced from the generated embroidered motif (`public/stag.svg`), so the mark is the same shape everywhere.

## Placeholders and generated media

- The six runway people are one generated set (`scripts/jobs8.json`), cut out and normalised by `scripts/process-rw.py`. The Heritage crew thumbnail shows a smaller stag than the person on look 02 wears; the regeneration was blocked when the image account's credit fell below the service minimum.
- All photographs are generated (`scripts/jobs*.json` hold the prompts) and cut out with rembg (`scripts/process.py`). The model is one generated man and some generated people; none is a real person. Generated images usually cannot be copyrighted.
- The stag on a sweater is a generated image, so it differs very slightly between colourways. The brand mark itself is the vector.
- Invented: all prices, ratings, review text, the 1,141 reports, the statistics on the proof cards (-30 C, 18.5 micron, 2 years, 48 hours) and the drop date. The page carries no disclaimer, at the owner's request (it is a concept); this README is where that is recorded.
- Checkout, pay buttons, search, saved and lodge-finder buttons, and all footer links do nothing. Nothing is charged or sent.

## Not verified

Not tested on a real phone or in Safari or Firefox. Smooth scroll is off on touch devices and with reduced motion. The generated images were checked at full size by eye, not by a person on a phone.

## Run

```
npm ci
npm run dev
```

Content lives in `src/data/site.ts`. Images are rebuilt from `raw/` (git-ignored, regenerated with `gen-media.mjs`) by `python3 scripts/process.py` (needs `rembg`).
