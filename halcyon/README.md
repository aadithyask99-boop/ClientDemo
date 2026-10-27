# Halcyon

Concept landing page for a fictional cyber security firm. Astro, GSAP and Three.js. Served under `/halcyon` in the shared demo deploy.

## Run

```
npm install
npm run dev
```

`node scripts/stage.mjs` builds with `BASE_PATH=/halcyon` and copies the result to `../site/halcyon` (the repo's build command runs it).

## How the hero works

- **Intro** (`src/scripts/intro.ts`): one GSAP timeline on load, about 4.2 s, that follows a reference animation frame by frame. The kingfisher drops in at the top left and hovers, crosses to the right and hovers, passes back close to the camera heading left, shrinks to a small hover, drifts right and banks, then swings left and flies at the camera with its wings wide. That approach dissolves into the portrait, head on head, and the bird stays there. The copy slides in from the left, the cards rise and the chip comes from the right. After landing it breathes slowly and follows the pointer. The flight is the `PATH` array at the top of the file: one keyframe per sixth of a second, so retiming a move means editing a row.
- **Poses** live in `public/bird/` as transparent WebP: `hover_up` and `hover_out` (alternated quickly to read as wingbeats), `fly` and `fly_l` (side view, facing right and left), `bank`, `swoop` and `portrait`. The flying poses are positioned by the timeline. The portrait is positioned by CSS, and the timeline reads that position to know where to land, so the same code works on phones and desktops. Motion blur is an SVG blur stretched along the direction of travel.
- **Glass objects** (`src/scripts/glass.ts`): the padlock and the orb are Three.js scenes, loaded after the page is up. Static fallbacks show until they are ready, or if WebGL is unavailable.
- **Fallbacks**: with JavaScript off, or `prefers-reduced-motion`, the page shows its final state with no intro. A 6 s safety timeout restores the page if the script never starts.
- `public/bird/flap.webm` is a transparent wing-flap loop (VP9 alpha) that the page does not use. Safari does not play VP9 alpha.

## Copy

All figures (42%, +323) and the firm itself are placeholders.

## Bird art

Generated with `bytedance-seed/seedream-5-0-flash` on a flat green background, keyed to transparency. The portrait file is pre-mirrored so the bird faces right.
