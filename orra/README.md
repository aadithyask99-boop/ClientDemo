# Orra

A concept hero for a fictional architectural-residence studio, built with Astro and GSAP. It is inspired by the look of a luxury real-estate landing page (a framed card, a giant name sitting behind a glass house, glass stat cards, a pill nav), with its own name, copy, imagery and code.

Run it: `npm install`, then `npm run dev`. `npm run build` writes `dist/`. `node scripts/stage.mjs` builds for the shared demo deploy under `/orra` and copies the result to `../site/orra` (see the repo's `wrangler.jsonc`).

## How the scene is built

Three generated images (Gemini 3.1 Flash Image through OpenRouter) and two derived ones, all in `public/img/`:

- `plate.webp`: the dusk lake and mountains, with an empty middle.
- `house.webp`: the villa, shot on flat green and keyed out to true alpha (green dominance becomes transparency, spill clamped), so it can sit between the layers.
- `neon.webp`: only the light strips and lit windows of the house, pulled out by brightness and colour. It is used as a mask to make them glow.
- `t1-4.webp`: crops of a 2x2 sheet of residences, used as the round thumbnails.

Everything inside the card is sized in container units (`cqw`/`cqh`), so the composition scales as one piece. On phones and tall screens the art is sized by width and placed from the card's vertical centre, and the text blocks stack around it.

Layers, back to front: plate, night tint, the name (solid), the house with its reflection, an outline copy of the name (so the letters show through the glass), a canvas for water rings, then the interface.

## Interaction

- **Depth**: the plate, name, house and glass cards slide a little with the pointer, the name the opposite way. With nobody at the controls the scene drifts slowly. A finger dragging does the same on touch.
- **Letters**: the letter under the pointer lifts and swells; its neighbours follow a little.
- **Light**: a warm pool of light and a stronger neon bloom follow the pointer across the house.
- **Water**: moving over the lake sends out flattened rings; clicking or tapping sends three. The reflection (the house, flipped and faded) is distorted by an SVG turbulence filter that churns harder the faster you move. A ring drops now and then on its own.
- **Dusk / Night**: a pill switch eases one variable (`--night`) from 0 to 1 over 1.8 s. The plate darkens, the room around the card darkens, the house loses a little brightness and its neon strengthens.
- **Nav**: a white pill glides to whichever link you hover and returns to the current page. On phones a Menu button opens a small panel.
- **Glass cards**: tilt in 3D under the pointer and count up on load. The Book a viewing button leans toward the pointer.
- **Intro** (only with scripting and without reduced motion): the scene settles out of a soft blur, the name rises letter by letter, the house comes up out of the water, then the interface follows. A 6 s safety timeout restores the page if the script never starts; reduced motion skips the intro and the drift.

## Files

- `src/components/Hero.astro`: the markup.
- `src/styles/global.css`: layout, look and the phone rules.
- `src/scripts/main.ts`: all of the behaviour above.
