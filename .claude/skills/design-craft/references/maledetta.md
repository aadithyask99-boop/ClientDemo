# Maledetta (fictional London pizzeria group), replica of Tripletta

Mode: REPLICATE (owner: "like to like", English, fictional, central London, footer instead of infinite scroll; colours may change). Replicate path of SKILL section 11: slot map plan, no inspiration research, hero copied. Folder: `maledetta/`.

## Inputs
Reference https://www.triplettapizza.com/ (Webflow, custom `main.js` readable at tripletta.netlify.app/main.js), the owner's 58 s screen recording, Unsplash key, OpenRouter Seedream 5.0 Flash. Palette B "London" chosen by the owner, name Maledetta, group of nine sites.

## Signature and reference facts worth reusing
- Hero: giant rough-edged wordmark in the pale tint behind a line-art mascot; one sticker that GSAP Flip moves between anchors (hero, sunburst, merch, wall, footer) with a spin as sections cross the middle.
- Palette: cream ground, one pale + one dark at a time; the page advances to the next pair when the footer is reached (their infinite-loop trick). We kept the colour change and dropped the loop.
- Motion read from main.js: Lenis duration 1 with easing 1 - 2^-10t; loader of nine colour curtains fading at 250 ms steps then lifting 1 s power3.inOut; menu overlay accordion 0.8 s power2.inOut, cursor arrow elastic.out(1, 0.9).
- Wheel-notch curve of the build matches the reference to within 1 px (149, 242, 301, 330, 356, 372 vs 148, 241, 300, 329, 355, 372) using that Lenis setting.

## Techniques that worked
- Mascot: Seedream woodcut line art (4 tries, $0.07), ink turned into an alpha mask; 4 wobbled frames (smooth noise displacement, stronger on the flames) as one sprite strip played with CSS mask-position steps(1) at about 6 fps: a hand-redrawn "boiling line" with no JS and no filters, recolourable.
- Food cut-outs: generate on flat magenta, key by hue (282 to 358 degrees, saturation above 0.55) plus a dark-crimson shadow rule, keep only the background connected to the border, closing and fill holes. Red drinks (negroni) and metal bowls fail the key (they reflect or share the hue); use white or brown dishes and avoid red liquids.
- Wordmark: render once in Chromium (Oswald 700 through feTurbulence + feDisplacementMap), keep as a PNG mask so it takes the palette colour with no runtime filter.
- Node's fetch ignores the cloud proxy, so the proxy-injected OpenRouter key was not applied (401). Run with `NODE_USE_ENV_PROXY=1 NODE_EXTRA_CA_CERTS=/root/.ccr/ca-bundle.crt`.

## Defects found and fixed
- `.sunburst svg {position:absolute...}` also hit the sticker's own door icon (a descendant svg) and squashed it: scope with `>`.
- `loading="lazy"` on the wall prints left blank frames after a fast jump; width/height attributes then overrode `aspect-ratio` (stretched prints) until `height:auto` was set.
- A GSAP `yPercent` tween on an element centred with CSS `translate(-50%,-50%)` starts from -50 and jumps; use `y` in px. `gsap.from` and a scrub tween on the same property conflict: intro uses scaleY and opacity only.

## Probes
motion-probe vs reference: wheel curve identical; moving-with-scroll elements 69 vs 42 after adding scrubbed rotation on marquee food, tagline and footer settle (first build was 22, 52%). Probe reports the hero as 0 although its mascot, wordmark and links scrub (checked by hand); the reference hero also reads 0. media-quality: 0 upscaled. detail-audit: only the intended repeated food in marquees. Impeccable: only `cream-palette`, ignored as the reference's own ground.

## Deliberate departures from the reference (owner rules)
No hairlines (menu wipes and the wall's faint vertical grid dropped, replaced by solid bars and space), body text 16px or more (reference 14px), merch heading in the dark tone instead of the faint tint, no yellow or gold pairs.

## Weaker than the reference / unverified
Unsplash photography is moodier and less uniformly flash-lit than the reference (a light common grade was applied); no real phone test; the Webflow marquee and wall parallax were matched from the recording, not from code; the "Book a table", socials and shop links are placeholders.

## Second pass (owner: "is something missing?", 2026-11-06)
The owner suspected gaps and was right. I had built the menu from the reference's code and never opened it in a browser. Opening it showed a different menu: cream ground, 7vw dark city names, thin light lines, small rows with a corner arrow, a photo band growing to 60vh with a round "GO!" cursor, then full screen; no close button on desktop; the list repeated six times. Also missed: the sticker is 258 x 158 px with a hand-drawn door that opens on hover (Lottie, frames 1 to 99 in 0.5 s) plus rotate(6deg) scale(1.02) and a drop shadow; the wall has six cards in a five-column grid with scripted parallax (percent of own height: -80 to 30, 40 to -30, 30 to -100, 0 to -50, 0 to 30, -150 to 0); links fade to 50% and the small arrow slides out and back in. All of this was found in the reference's own files: the Webflow interaction data is in `webflow.schunk.*.js` (search for an element's `data-w-id`), and styles are in the shared CSS.
Lesson: for a replicate job, open every interactive state of the reference in a browser (menu, hover, click, cursor) and read its interaction data before writing the plan; reading main.js alone missed what Webflow does.

## Bugs that only showed on the published artifact
- The mascot was invisible: its colour variable lived on `<body style>` and the preview bundler keeps only the body's children. Put variables in `:root`.
- CSS `url(/art/x.png)` for a public file stays root-absolute under a relative base, so masks 404 on the artifact. Keep CSS-referenced images in `src/assets` so Vite rewrites them.
- A CSS `transition: opacity` on links made the intro's `gsap.from` leave them at 0: animate a wrapper instead.
- Test the bundle from a nested path (`/a/b/page.html`), not from its root, and look at the hero, not only a mid-page section.

## Probe note
After removing the extras the owner approved cutting (hero drift, services zoom on scroll, food tumble, tagline and footer settle), scroll-moving elements read 10 against the reference's 42. The reference counts the individual items of its marquee; ours moves as one track. The tumble can be added back (about 50 elements) if wanted.

## Third pass (owner feedback, 2026-11-06)
- The bite did fire but was a 6% squash and ink-coloured dots on an ink picture, so it read as nothing, and the slice never shortened. Fix: three bite shapes (disc unions clipped to the slice triangle, saved as small alpha PNGs) subtracted from the sprite with mask-composite: subtract (source-out for WebKit); three clicks eat the slice, then a fresh slice pops back. Not an image-generation problem: the artwork is the same, only masked.
- Preloader was too quick to read: 0.6 s per curtain, long names sized to fit one line, a 0.9 s rest on the last, then a 1.6 s fade while the hero resolves from blur. The hero intro moved from GSAP to CSS (animation on opacity, filter and the individual scale property) with a CSS failsafe, so a script problem cannot leave the hero hidden.
- Mobile: testing needs a viewport meta tag (the bundler strips it, so Chromium laid the first test out at 980px and made the page look twice as long). Compared with the reference at 390px: sticker is a fixed top-centre menu button, mascot smaller, services images 140vw tall, marquee type 31vw, statement 7.4vw, wall as framed cards with a centre line, single-column footer links, menu with a Close bar and smaller rows.
- Reference note: on mobile the reference keeps its sticker fixed at the top but hides it behind its own z-4 sections; ours stays above everything so the menu is always reachable.
- Photo counts: the reference wall has six prints and the shop section one photo; ours matches.
- A sandboxed iframe without allow-same-origin blocks a plain static server's scripts, fonts and images (CORS from origin null); my failsafes keep the page usable but this was a test-server artefact, not the artifact host.

## Fourth pass (owner feedback, 2026-11-06)
- I read 'Menu' on the hero as the navigation menu; the owner meant the FOOD menu (and had asked me to check the reference's). I should have asked. Lesson: when a word has two readings (menu, nav, carte), ask one short question before building.
- The reference's food menu lives on its restaurant pages (for example /pizzeria/gand): a MIAM! band, then a Swiper row of dish cards with a thin-line grid, a leaf mark for vegetarian dishes, a HOT starburst on one, a cut-out plate, a short description, arrows, and a Telecharger la carte button (PDF). Rebuilt as a MANGIA band plus eight dishes, drag and swipe, plate that tilts on hover.
- The mascot bite was removed (cutting the slice looked unnatural). The 'ciao' rain remains.
- Wall of love: ten prints instead of six to cover the white space (the reference has six); positions chosen so the foosball print, which arrives from far above, does not cross another print.
- Preloader: plays on every load now (the once-per-session rule hid it from the owner); a click, tap or key skips it.

## Fifth pass (owner feedback, 2026-11-06)
- Mascot: the owner liked the press-and-jump (the original squash, jump, land, flicker and embers) and only disliked the munching art change. Restored the jump, kept the art untouched.
- Preloader: cross-fading full-screen curtains felt jerky and unprofessional. Replaced with one reel of names that rolls up in a mask while the background and text colours morph (GSAP colour tween), then a blurred fade into the hero.
- Food menu: not a download. A full-screen overlay opened by the hero Menu link: categories on the left, items of the active category on the right (names, descriptions, prices, vegetarian mark) with a tilted plate image; accordion on phones. Same visual language as the reference's find-a-restaurant overlay (cream ground, thin lines, big dark names, rising text).
- Bug found while testing the jump: an overlay whose child sets visibility visible stays clickable while the overlay is hidden (a child can override the parent's visibility hidden). The closed overlay then blocked clicks on the hero. Fix: pointer-events none on the closed overlay. Applies to every full-screen overlay with absolutely positioned children.
- Encoding: the preview bundle declares no character set and minifiers turn CSS escapes into raw characters, so a pound sign showed as garbage. Keep served files ASCII: write currency as an HTML entity, avoid accented letters in copy.
