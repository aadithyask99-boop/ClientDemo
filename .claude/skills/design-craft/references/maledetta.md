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
