# Orra

A concept hero for a fictional architectural-residence studio, built with Astro and GSAP. It is inspired by the look of a luxury real-estate landing page (a framed card, a giant name sitting behind a glass house, glass stat cards, a pill nav), with its own name, copy, imagery and code.

Run it: `npm install`, then `npm run dev`. `npm run build` writes `dist/`. `node scripts/stage.mjs` builds for the shared demo deploy under `/orra` and copies the result to `../site/orra` (see the repo's `wrangler.jsonc`).

## How the scene is built

Generated images (Gemini 3.1 Flash Image through OpenRouter) and derived ones, all in `public/img/`:

- `plate.webp` and `plate_night.webp`: the backdrop at dusk and at night: hazy sky, layered mountains, dark volcanic rocks framing both sides, and a glossy floor of still water. It was generated from the reference design's environment (house, letters and interface removed), and the night one is an edit of the dusk one, so the two line up exactly.
- `house.webp` and `house_off.webp`: the villa with its lights on and with every light off (an edit of the first; the two silhouettes match to 99.8%). Both were shot on flat green and keyed out to true alpha (green dominance becomes transparency, spill clamped), so they can sit between the layers.
- `neon.webp`: only the light strips and lit windows of the house, pulled out by brightness and colour. It is used as a mask to make them glow.
- `t1-4.webp`: crops of a 2x2 sheet of residences, used as the round thumbnails.

The hero fills the viewport. The artwork sits on a 16:9 "stage" that covers the viewport like `background-size: cover` (cropped at the edges, centred), so the plate, name, house and water stay in register at any shape; the text and cards are positioned on the viewport itself. Both are sized in container units (`cqw`/`cqh`). On phones and tall screens the stage is the whole viewport, the art is sized by width and placed from the vertical centre, and the text blocks stack around it.

Layers, back to front: dusk plate and night plate, the name (solid), the house with its shadow, its reflection in the glossy floor and a light that spills onto the floor at night, slow drifting mist, an outline copy of the name (so the letters show through the glass), then the interface.

## Interaction

- **Depth**: the plate, name, house and glass cards slide a little with the pointer, the name the opposite way. With nobody at the controls the scene drifts slowly. A finger dragging does the same on touch.
- **Letters**: the letter under the pointer lifts and swells; its neighbours follow a little.
- **Dusk and night are two states of the building and the backdrop.** Dusk: lights off (`house_off`), dusk sky. Night: the lit house fades in over the unlit one, a halo blooms around the strips and windows (`neon.webp` as a mask), the night sky fades in over the dusk one, and the reflection and a spill of orange light on the floor follow. One variable, `--night`, from 0 to 1, drives all of it.
- **Dusk / Night**: a pill switch eases `--night` from 0 to 1 over 1.8 s (see above).
- **Nav**: a white pill glides to whichever link you hover and returns to the current page. On phones a Menu button opens a small panel.
- **Glass cards**: tilt in 3D under the pointer and count up on load. The Book a viewing button leans toward the pointer.
- **Intro** (only with scripting and without reduced motion): the scene settles out of a soft blur, the name rises letter by letter, the house comes up out of the water, then the interface follows. A 6 s safety timeout restores the page if the script never starts; reduced motion skips the intro and the drift.

## Files

- `src/components/Hero.astro`: the markup.
- `src/styles/global.css`: layout, look and the phone rules.
- `src/scripts/main.ts`: all of the behaviour above.
