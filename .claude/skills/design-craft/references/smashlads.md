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
