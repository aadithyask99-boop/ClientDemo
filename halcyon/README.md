# Halcyon

Concept landing page for a fictional cyber security firm. Astro, GSAP and Three.js. Served under `/halcyon` in the shared demo deploy.

## Run

```
npm install
npm run dev
```

`node scripts/stage.mjs` builds with `BASE_PATH=/halcyon` and copies the result to `../site/halcyon` (the repo's build command runs it).

## How the hero works

- **Intro** (`src/scripts/intro.ts`): a single pre-rendered 5 s video in `public/video/`. It starts on empty sky, a kingfisher flies in, hovers, swoops toward the camera with its wings wide and settles into the portrait. The video holds its last frame, which is the finished page. Nothing is shown while the bird flies. As it starts its approach to the camera (about 3.3 s), the nav (logo, links and Resources pill) and then the headline, text and buttons ease in out of a soft blur, the cards and the proof chip drift in from the bottom and right, and card text fades in a beat after its card. After the clip the scene follows the pointer a little.
- **Why a video**: the first version stitched separate bird photos with blur filters, which dropped frames. A video is decoded by the browser's own player, so playback is smooth and the page stays light (about 1.4 MB desktop, 0.7 MB phone).
- **How the clip was made**: the empty-sky frame and the landed-bird frame were screenshots of this page's own CSS (interface and vignette hidden), given to `bytedance/seedance-1-5-pro` on OpenRouter as the first and last frames, so the clip starts and ends on exactly what the page shows. Desktop is a 16:9 1080p render, phones get a 9:16 720p render (used at 1000 px and below). Each ships as MP4 and WebM.
- **Fallbacks**: the still `portrait.webp` is shown when JavaScript is off, `prefers-reduced-motion` is set, or the video cannot play (autoplay blocked, unsupported, or no data within 5 s), and the interface comes in quickly. A 6 s safety timeout restores the page if the script never starts.
- **Glass objects** (`src/scripts/glass.ts`): the padlock and the orb are Three.js scenes. They load only after the clip ends, because compiling their shaders blocks the page for a moment. Static fallbacks show until then, or if WebGL is unavailable.

To remake the clip: screenshot the page with `.nav, .hero__copy, .dock` and `.hero::after` hidden (once with the portrait hidden too), then submit the two images as first and last frames.

## Sections below the hero

Dark "night" sections that follow the sky, in the style of a studio-site reference, with Halcyon's own content, visuals and code. The text, figures, client names and email are placeholders.

- **Sky to night** (`.sky-fade`, `sections.ts`): as the hero scrolls away, a fixed layer turns the sky to dusk blue and then to night, one continuous colour change with no strip or edge. On desktop the bottom of the hero has a plain gradient of mist (no blur layer, which painted as a hard band over the cards on iOS Safari) that fades the bird's chest into the colour of the ground below; it is hidden on phones. The edge vignette is faded out along the bottom, so there is no visible line where the hero ends. The ground under the hero is painted by `main` itself (not left to the root or the viewer's background), so it matches the hero's bottom colour exactly. Without scripting there is a plain gradient strip instead.
- **Statement** (`Statement.astro`): condensed all-caps type that lights up word by word as it scrolls (GSAP ScrollTrigger, scrubbed).
- **Work** (`Work.astro`): case-study tiles glide up through the centre in perspective. The next tile shows only as a sliver below the current one (so it never covers the title), then rises as the current one tilts back and fades. Each move spans plenty of scroll, and the scrub follows Lenis directly instead of adding a second smoothing. Each tile is live, drawn on a canvas by `tiles.ts` only while on screen, and reacts to hover and click: **Meridian Bank** is a working radar (a sweep that lights contacts as it passes, a bearing and range readout under the pointer, click to ping a new flagged contact); **Northwind Health** is a network where hovering lights nodes and clicking starts an infection that spreads hop by hop and then recovers; **Atlas Freight** is three cloud layers that fan apart and tilt with the pointer, with a click running a posture scan down through them; **Corvid Labs** is a threat feed that speeds up and lights where you look, with click flagging an indicator. The first Northwind infection runs once on its own as a hint. The SVG art in `data/content.ts` stays underneath as the fallback.
- **Manifesto** (`Manifesto.astro`, `dots.ts`): a dot-matrix headline that lights up with scroll. The pointer pushes dots aside and leaves a violet-to-cyan wake, and a click sends a ripple through the letters. Four glass props (padlock, shield, key, orb) float in the corners; they drift against the pointer for depth, tilt toward it and back away when it gets close.
- **Engagements** (`Engagements.astro`): a table whose hovered row turns into a white bar, and a marquee of fictional wordmarks in slanted cells.
- **Services** (`Services.astro`): not scroll-driven. All four words rest dim. The word under the pointer lights up, leans toward it, and shows a caption beside it, while a photo trails behind the pointer with a lag and tilts with its speed. On touch, the word at the middle of the screen is the active one.
- **Contact** (`Contact.astro`): the footer continues from the night above it, darkening from the same navy and then brightening into a slowly colour-changing sky. It has the address in giant type and a crosshair with live X/Y readout. Seven 3D keycaps spelling the name (Three.js, `scenes.ts`) fall quickly (about three quarters of a second) from the top of the footer once you are nearly at the bottom, with simple physics: gravity, tumbling, bounces on a floor, then they settle in a row. Keys are solid: when one hits another it passes its momentum on, so a knock ripples along the row with each key wobbling as it arrives. They hop and spin away from the pointer when it nears them. On narrow screens the keys are bigger and fall into two rows (H L Y N in front, A C O behind), so they stay legible.
- **Navigation** (`Header.astro`): one nav for the whole page, fixed from the first screen. It turns light over the dark sections, its links follow the section you are in, and on small screens its Menu button opens a full-screen menu (`Dock.astro`).

Scrolling is smoothed with Lenis on desktop pointers only. Everything is skipped under `prefers-reduced-motion`, and the content stays readable without JavaScript.

**Images**: the four glass props were generated with `google/gemini-3.1-flash-image` on pure black and converted to real transparency (brightness becomes alpha, which matches a screen blend on black). The four service photos were generated with `bytedance-seed/seedream-5-0-flash`. Both are in `public/img/`.

**Phones**: below 760 px the sections are re-spaced so no screen is empty. The tiles become tall (4:5) and their live art re-lays itself out for the tall shape, the first tile starts already on screen, and the paddings around the statement, manifesto, table and services are cut down. The page is about 2,700 px shorter than it would be with the desktop spacing.

**Performance notes**: the keycaps are the only 3D scene below the hero; it shares one three.js load with the hero's glass cards (`objects.ts`), is built during idle time right after the intro, and renders only while on screen. Heavy WebGL is the main cost on weak devices.

## Copy

All figures (42%, +323) and the firm itself are placeholders.

## Bird art

The portrait still was generated with `bytedance-seed/seedream-5-0-flash` on a flat green background and keyed to transparency. It is pre-mirrored so the bird faces right.
