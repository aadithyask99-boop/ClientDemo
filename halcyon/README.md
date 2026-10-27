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

- **Statement** (`Statement.astro`): condensed all-caps type that lights up word by word as it scrolls (GSAP ScrollTrigger, scrubbed).
- **Work** (`Work.astro`): case-study tiles glide up through the centre in perspective, with the next tile peeking in from below first. The tile art is drawn in code (`data/content.ts`), no images.
- **Manifesto** (`Manifesto.astro`, `dots.ts`, `scenes.ts`): a dot-matrix headline that lights up from left to right with scroll and glows under the pointer (2D canvas), with four glass objects (padlock, shield, key, orb) drifting in the corners (Three.js).
- **Engagements** (`Engagements.astro`): a table whose hovered row turns into a white bar, and a marquee of fictional wordmarks in slanted cells.
- **Services** (`Services.astro`): giant stacked words, one bright at a time as you scroll, with a thumbnail that follows the pointer.
- **Contact** (`Contact.astro`): the address in giant type, a crosshair with live X/Y readout, a sky that slowly changes colour, and loose 3D keycaps spelling the name that hop when the pointer nears them.
- **Fixed bar and menu** (`Dock.astro`): pill buttons and a full-screen menu that appear once the hero has scrolled away.

Scrolling is smoothed with Lenis on desktop pointers only. Everything is skipped under `prefers-reduced-motion`, and the content stays readable without JavaScript.

**Performance notes**: the 3D scenes share one three.js load (`objects.ts`), are built during idle time right after the intro (not while scrolling), render only while on screen, and the corner objects render at 30 fps. Heavy WebGL is the main cost on weak devices.

## Copy

All figures (42%, +323) and the firm itself are placeholders.

## Bird art

The portrait still was generated with `bytedance-seed/seedream-5-0-flash` on a flat green background and keyed to transparency. It is pre-mirrored so the bird faces right.
