# Doves UK (funeral and repatriation cover)

Folder: `doves-uk/`. Mode: **recreate from a client-supplied reference** (the README: "modelled on the reference the client supplied, a screen recording": calm, editorial, photography first). Copy is the client's final wording; only layout and order changed. Owner confirmation pending on the exact brief.

## Signature idea

Restraint. White space, full-bleed photography, one grotesque at weight 400 for every heading and paragraph (measured on the reference; only button and link labels are 500). The feeling is calm and trustworthy, appropriate to the subject.

## Palette and type

- Doves blue `#084b9a` sampled from the logo, white, rounded corners of 8 and 24 px, pill buttons.
- Schibsted Grotesk, sizes tied to the viewport (hero 5.6vw, statement 3.8vw), a 6.5vw gutter on logo, hero title and every section. Every heading and paragraph uses shared tokens in `global.css`.
- The logo is two stacked images clipped at section edges, so it changes colour exactly where a dark section ends.

## Rules this site set

- No italics, no em dashes, no labels above titles.
- Vertical scroll only. The one sideways element is the covers carousel.
- Motion limited to: hero crossfade with slow zoom, a looping plan video, a header that turns to white glass, quiet fade-ins, a steps loop, a marquee and the form steps. **No parallax and no cursor-driven movement.**
- Enquiry form asks one question at a time and opens a prefilled WhatsApp message.
- One `Photo.astro` image component; its `sizes` must describe the image as rendered after the object-fit crop, not the box, or images look blurry.

## Craft details worth reusing

- A dotted world map generated at build time from Natural Earth data and shipped as one SVG path.
- A seamless 9 second video loop made with ffmpeg (tail cross-fades into head), a small phone version and a poster, loaded only near the screen and paused off screen.
- A draft preloader that is only on in the demo build.

## Weaker / watch

- Stock photography rights and regulatory wording are open items in the README.
- Calm editorial work depends on photography quality more than any other site here.
