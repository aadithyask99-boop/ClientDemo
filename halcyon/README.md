# Halcyon

Concept landing page for a fictional cyber security firm. Astro, GSAP and Three.js. Served under `/halcyon` in the shared demo deploy.

## Run

```
npm install
npm run dev
```

`node scripts/stage.mjs` builds with `BASE_PATH=/halcyon` and copies the result to `../site/halcyon` (the repo's build command runs it).

## How the hero works

- **Intro** (`src/scripts/intro.ts`): one GSAP timeline on load, about 3.5 s. A blurred kingfisher flies in from the left (`fly` pose), banks across the page (`bank`), dives (`dive`), then lands as the portrait in the centre, where it stays. The copy and cards stagger in around it. After landing it breathes slowly and follows the pointer.
- **Poses** live in `public/bird/` as transparent WebP. The flying poses are positioned by the timeline; the portrait is positioned by CSS, and the timeline reads that position to know where to land, so the same code works on phones and desktops.
- **Glass objects** (`src/scripts/glass.ts`): the padlock and the orb are Three.js scenes, loaded after the page is up. Static fallbacks show until they are ready, or if WebGL is unavailable.
- **Fallbacks**: with JavaScript off, or `prefers-reduced-motion`, the page shows its final state with no intro. A 6 s safety timeout restores the page if the script never starts.
- `public/bird/flap.webm` is a transparent wing-flap loop (VP9 alpha) that is not used by the page yet. Safari does not play VP9 alpha.

## Copy

All figures (42%, +323) and the firm itself are placeholders.

## Bird art

Generated with `bytedance-seed/seedream-5-0-flash` on a flat green background, keyed to transparency. The portrait file is pre-mirrored so the bird faces right.
