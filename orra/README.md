# Orra

A concept hero for a fictional architectural-residence studio, built with Astro and GSAP. It is inspired by the look of a luxury real-estate landing page (a giant name sitting behind a glass house, glass stat cards, a pill nav), with its own name, copy, imagery and code.

Run it: `npm install`, then `npm run dev`. `npm run build` writes `dist/`. `node scripts/stage.mjs` builds for the shared demo deploy under `/orra` and copies the result to `../site/orra` (see the repo's `wrangler.jsonc`).

## How the scene is built

The hero fills the viewport. The scene is two photographs of the same place, generated with Gemini 3.1 Flash Image through OpenRouter, in `public/img/`:

- `plate.webp`: **dusk, lights off.** A modern villa standing on its stepped platform in still water, with dark volcanic rocks reaching in to touch both ends of the platform, a mirror-sharp reflection of the building directly under it, hazy mountains and sky. It was made by pasting a cut-out of the villa onto a generated landscape (which was itself generated from the reference design's environment) and asking the model to refine that into one photograph: contact, reflection and light were painted in, the building and its position were kept.
- `plate_night.webp`: **night, lights on.** An edit of the dusk picture with everything held in place, the sky dark with stars, the neon strips and windows lit, and their light mirrored in the water.
- `house.webp`: the villa's silhouette (true alpha). Not shown; it is used only as a mask, so the giant name can sit behind the building (see below).
- `t1-4.webp`: crops of a 2x2 sheet of residences, used as the round thumbnails.

Because both pictures show the same scene, **Dusk / Night** is one variable (`--night`, 0 to 1, eased over 1.8 s) that fades the night picture over the dusk one. The picture is placed on a 16:9 "stage" that covers the viewport like `background-size: cover`, so everything stays in register at any shape; the text and cards are positioned on the viewport itself. Both are sized in container units (`cqw`/`cqh`).

**The name behind the building**: the solid ORRA is cut out wherever the building is (a CSS mask built from `house.webp`, positioned from the same three variables that place the picture), so the letters really sit behind it. A thin outline copy of the name is drawn over it, so the letters show faintly through the glass.

**Phones and tall screens**: the stage is the whole viewport, and the picture is scaled so the building is wider than the screen (about 126% of its width) and placed from the vertical centre. The picture is then shorter than the screen, so its top and bottom edges melt into flat colours sampled from the picture (one set for dusk, one for night). The text blocks stack below.

## Interaction

- **Dusk / Night** switch, as above.
- **Nav**: a white pill glides to whichever link you hover and returns to the current page. On phones a Menu button opens a small panel.
- **Glass cards**: tilt in 3D under the pointer and count up on load. The Book a viewing button leans toward the pointer.
- **Intro** (only with scripting and without reduced motion): the scene settles out of a soft blur, the name rises letter by letter, then the interface follows. A 6 s safety timeout restores the page if the script never starts; reduced motion skips the intro.

There is no movement of the scene itself with the pointer: the picture stays still so the building reads as part of its place.

## Files

- `src/components/Hero.astro`: the markup.
- `src/styles/global.css`: layout, look and the phone rules.
- `src/scripts/main.ts`: the behaviour above.
