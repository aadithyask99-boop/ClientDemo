# Smashley's (fictional London burger restaurant), replica of CRAV

Mode: REPLICATE with new sections (owner: same idea as the Maledetta job, different colours, English/London, plus a Fruit Ninja footer and a build-your-own-burger section). Plan shown and approved before the build; palette A (cobalt + burnt orange), name Smashley's (the owner's voice note said "Smash leads"; a later message corrected it), bombs in the game, builder on the home page. Folder `smashlads/`.

## Reference facts (cravburgers.shop, Next.js, no libraries exposed)
Mouse Memoirs plus Modak; red, sunshine yellow, cream; wavy section edges; sticker tags; mascots (gloved burger, line-art kid, fries); preloader (burger, CRAVING flash); nav card dropping over a blurred page; /menu with white cards, cut-out burgers on a red and white checker band and a hover panel (prep, bun, patty, spice, calories, protein); footer with a giant CRAV and floating ingredients.

## What worked
- Game: canvas, no library. Slice = segment against circle; a half is the same sprite clipped to a half-plane stored in the item's own rotation frame (store `cutAngle - itemRotation`, not the world angle, or the cut drifts as it spins). Gravity scaled to the footer height so throws always reach 28 to 68% of it. Bombs rise from 10 to 20% of tosses as the round ages.
- Builder: pointer events with a ghost clone for drag, a tap fallback, `touch-action: none` on chips only. Layers are SVG with a shared outline so they read as one family; a `column-reverse` flex stack means new layers are appended and stay on top; the top bun is a toggle that always renders last.
- Cut-outs: magenta-only key, applied everywhere (not only the border-connected region), so holes (onion ring) clear. The old dark-crimson rule from the Maledetta key ate dark buns and the black bomb, so it was dropped.

## Defects found and fixed
- The orange #FF5A1F failed contrast for white and cream text (3.1:1 and 2.7:1): darkened to #D63E0A (4.6:1 on white). Check an accent for text use before choosing it, not only for fills.
- `.band .tag` (position left/top) also hit a second tag that only needed right/bottom, stretching it into a huge block: the shared selector set both axes. Give positioned variants explicit `left:auto; top:auto`.
- Mobile hero title in a row overflowed (the condensed font is still about 0.5em per letter): stack the words on phones.
- A desktop-only scroll effect on a heading (x shift) leaked onto phones and cut the heading off: wrap such effects in `matchMedia('(min-width: 992px)')`.
- The minifier folds `fromCharCode` and escapes into raw non-ASCII characters; the bundle has no charset, so a pound sign broke. Use `innerHTML` with `&pound;`.
- The fixed top bar collided with content in every frame: it now hides on scroll down and returns on scroll up.

## Probes
motion-probe: moving-with-scroll elements 33 vs reference 32 after adding scrubbed tags, chips, stops and the route; first build was 11. media-quality: no upscaled. Impeccable: clean after the contrast fix. Critic: fix first; applied the nav fix, declined: replacing the flat builder layers with photos (they must stack cleanly), and raising type that was already 24px or more at real size (the review used downscaled sheets).

## Not verified
Real phone; the game on a real touchscreen (tested with synthetic touch only); the Unsplash photos are moodier than the reference's.

## Second pass (owner feedback, 2026-11-06)
- Menu burger pictures looked cropped: the card stage used a percentage image height inside a grid track that had no fixed height, so the image overflowed and covered the name and price at laptop sizes. Fix: flex stage with a fixed height, image height 100%, rows sized max-content. Test overlays at 1280x720 and 1366x768 as well as 1440x900.
- Preloader: the burger layers were drawn faint (dark outline on blue, fade in) and the CRAVING flash showed for under a second. Layers are now larger with a cream outline, drop in opaque, and the flash holds. Any click skips it.
- Mobile white space: shop and build gaps were sized for desktop; reduced the build section padding and drop zone, retuned the footer (wordmark stacked, game message above it).
- Owner feature requests queued for approval (plan in chat): realistic builder layers, cart, sides and swaps, cartoon cursor, locations and contact pages, melting cheese in the hero.

## Third pass (owner-approved plan, 2026-11-06)
Built: photo builder layers (11 generated side-view cut-outs, 3 sides), patty/bun swaps and a meal option, cart (button, flying copy, panel, quantities, menu Add buttons), cartoon burger cursor (mouse only, crumb trail), Locations and Contact overlays, melting cheese (CSS drips on the hero burger aligned to the photo's cheese at 22 to 64% of its width, continued by a cheese cap and drips on the statement section that grow with scroll and mix into the heading with multiply), and a slower preloader that holds the finished burger.
Lessons:
- Generated side-view layers are thick: flatten them with an aspect-ratio box (`1 / (natural * h)`) and position the image absolutely inside it; an `img` at `height:100%` inside an auto-height box silently ignores the flattening.
- Use percentage margins (relative to the parent width) for overlaps, not container units, and grep the mobile media block for old rules that override them (a leftover `margin-top: -1.6vw` made every overlap identical).
- A script that builds image URLs must not trust a base path passed through the bundler (it rewrites './'): derive the folder from an image that already loads.
- A full-footer canvas steals clicks from the links under it: lift the link row above it with a higher z-index.
- Keep a sample `data-` attribute names unique: `data-price` on the menu Add button and the builder total collided in a test selector.

## Fourth pass (owner feedback, 2026-11-06): look before you hand over
- Owner: the cheese drips "look horrible", the builder had awful white space and "unnatural" placement, and I should have asked about the cheese. Lesson: for any effect that must look physically convincing (melting, dripping, liquid), do not build from a guess; ask what the owner pictures, show a sketch or a reference clip first, and look at full-size frames before publishing.
- Builder fixes: section cut from 1446px to 1272px, drop zone fixed at 29vw with the stack auto-scaling to fit (CSS `scale` var, so GSAP's transform squash still works), the layer that sits on the bun tucks deeper (its top face is an ellipse inset from the image edge), chips no longer bob (a scrub offset had knocked the grid out of line).
- Cursor: a normal arrow (white, ink outline, blue hard shadow) and a pointing glove over clickable things; no trail.

## Fifth pass: the hero cheese is now a generated video (owner-approved plan, 2026-11-06)
- Owner rejected hand-drawn drips and asked for a video: first frame, then the cheese melting as you scroll. Built exactly that: `scripts/make-seq.py`.
- Method: composite the existing hero burger onto the page cream at 16:9 (and 9:16) with room below it, use it as the first frame of Seedance 1.5 Pro (720p, 6 s, no audio, about $0.157 per clip, one draft each for desktop and phone, no retries needed), extract 15 fps (91 frames), flat-field each frame against its own measured background (the model's background drifts from 237,230,215 to 224,219,205 over the clip), key the background that touches the frame edge to transparent (so bright highlights inside the burger stay solid), save as webp with alpha (3.7 MB desktop, 4.8 MB phone).
- Page: a 235svh wrapper with three sticky layers (title behind, canvas, tags in front); GSAP ScrollTrigger maps progress to the frame index (melt plays over the first 70% of the pin, then holds); frames load first, last, every fourth, then the rest; the next section's heading sits under the last 40vh of the wrapper so the strands hang over it.
- Do not use mix-blend-mode: multiply for this. It made the title show through the bun (black S). A real alpha cut-out hides what is behind it.
- Prompt that worked: locked-off camera, the slices of melted cheese soften and sag, then thick glossy strands ooze and drip, stretching until they reach the bottom of the frame; burger and background unchanged. Place the burger high in the first frame so strands have room.
- Cursor: native CSS `cursor: url(svg) x y` images (arrow and glove), always visible.

## Sixth pass: hero fixed after owner feedback (2026-11-06)
- Owner: the first screen was too big and pixelated, and the hero pinned so the next section slid up over the video instead of the page scrolling. Causes: a 720p clip stretched over the screen; a sticky pinned wrapper. Fix: 1080p render (about $0.35), a normal non-pinned scroll, the canvas placed so frame 1 sits exactly where the old hero image was (width min(52vw, 80vh), top 26%), desktop frames cropped to the middle 60% (smaller download), the melt tied to the first 0.8 screen of scrolling.
- The model grew cheese on top of the bun in the first seconds: frozen by reusing frame 1 for the top 29% of the frame with a short feather.
- Process failure to avoid: I ended a turn while the render was still running and reported a state the user could not see. Never stop mid-task; wait for the background job (Monitor) and verify in the headless browser before replying.

## Seventh pass: hero size, strand ends, builder test (2026-11-06)
- Hero burger scaled to 80% of before (min(42vw, 64vh)); strands now sit behind the statement text (the statement section is transparent and above the canvas) and the canvas fades out at its bottom 22% so strands taper instead of being cut flat.
- Builder test (Seedream edit with the hero burger as reference, $0.11 total): remove cheese: good; add bacon: good (sits under the top bun); single patty: good on the second try (first left the bun floating, needed "bun rests directly on the patty"); remove salad: still adds a third cheese slice, not usable yet. Lighting, bun and angle stayed consistent in all of them.

## Eighth pass: builder rebuilt on finished photographs (owner decision: "reverse engineer", start from a full burger)
- 16 photographs (patties 1 or 2 x cheese x bacon x lettuce-and-pickles), made by editing the hero burger with Seedream (refs in `gen-media.mjs`), about $0.37 in total including retries. `scripts/make-burgers.py` keys the background and aligns every burger on its bottom bun (same bun width, bottom edge and centre), so crossfades do not jump (checked by overlaying all 16).
- Audit by eye against each recipe: first pass only 9 of 16 matched (the model adds a third patty, or a cheese sheet where lettuce was removed). Fix that worked: edit from the nearest correct image with ONE change and say "exactly TWO patties, exactly TWO cheese slices, put nothing in its place". Never chain more than one change per edit.
- UI: toggles (patties, cheese, bacon, lettuce and pickles, sides) crossfade between photos; price, kcal, layer count update; Add to cart. Patty-type and bun swaps were dropped (no photos for them).
- Bug: two elements used `data-price` (menu Add buttons and the builder total), so the total read "Add to cart". Use unique data attributes.

## Ninth pass: alignment and white-space audit (2026-11-06)
- Method that found things: measure each section's content top and bottom against its box in the headless browser (space above and below the first and last visible child), then look at element screenshots of the builder, band and footer at 1440 and 390.
- Builder gap: the generated burger photos have about 22% empty margin above the burger; crop every photo to one shared box (scripts/make-burgers.py writes src/data/burger-dims.json, read by the page for aspect-ratio and the plate position). The plate looked in front of the burger because a later positioned element paints over an earlier one: give the burger a higher z-index and place the plate absolutely at the bun's bottom edge.
- Footer: duplicate Contact link (old mailto plus the new overlay button), the cart button covered Reset (give the HUD right padding), the wordmark crowded the HUD on phones (raise it), and the footer was far taller than its content.
- Fixed-position helpers (cart, top bar) must be in the audit: check that no control is covered at the page corners.
