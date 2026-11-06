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
