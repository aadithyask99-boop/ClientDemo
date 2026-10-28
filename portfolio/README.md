# Portfolio

Aadi's freelance site: "Hi, I'm Aadi and I make cool, SEO-friendly websites." Astro 7, GSAP, Lenis, plain CSS. No UI framework.
Staged next to the other demos at `/portfolio` (the shared deploy runs `scripts/stage.mjs`). Meant to move to its own domain later.

## Run

```bash
cp .env.example .env     # then edit .env: your email, links, timezone, API keys
npm install
npm run dev              # http://localhost:4321
npm run build            # static site in dist/
npm run check            # type-check the scripts
node scripts/stage.mjs   # builds with BASE_PATH=/portfolio into ../site/portfolio (what Cloudflare runs)
npm run build:single     # the whole site as ONE self-contained HTML file in dist-single/index.html
```

## Things you will want to change

- **Your email, links, timezone, names:** `.env` (see `.env.example`; every value is commented). `PUBLIC_*` values reach the browser, the rest never do.
  `PUBLIC_LOCATION_LABEL` ("Based in the UK") is shown in the header just before the clock.
- **Your photo:** put it at `public/portrait.jpg` (or `.jpeg`, `.webp`, `.png`, `.avif`, portrait orientation, about 800x1000). It replaces the pixel-art
  stand-in in two places: the little face that follows the cursor over your name (your photo reduced to a 22 x 22 grid of pixels) and the portrait section,
  which breaks into pixels as it leaves the middle of the screen and sharpens as it returns (scripts/portrait.ts).
- **Copy:** the headline words and the "nothing generic" line are in `Hero.astro`, the four points and the verdict in `Chemistry.astro`, the service cards in
  `Deck.astro`, the about text in `About.astro`, the project list (every project is a "Concept build") in `src/data/site.ts`.
- **Work clips:** each project needs `public/work/<slug>.mp4` (a 9 second loop, 720 px wide, no audio) and `<slug>.webp` (its poster).
  `node scripts/record-demo.mjs <slug> <url>` records both for a live site (needs Playwright and ffmpeg).
- **Launch:** set `PUBLIC_SITE_URL` and `PUBLIC_NOINDEX=false`. While `PUBLIC_NOINDEX=true` the site tells search engines to stay away.

## Design language

- **Two worlds.** Cream (`hsl(39 50% 95%)`) and black. The header changes colour with whichever is under it (`data-world` on `<html>`; not `data-theme`, which some hosts use).
- **One accent, orange.** `--accent #ff5a1f` for fills and anything on black. `--accent-ink #f5501a` for big text on cream (3.2:1; plain orange is 2.85:1 and fails).
- **Type.** Geist at weight 600, very tight tracking (`-0.065em`), line-height 1. Geist Mono for small labels.
- **Pixels** are the signature: a 7x7 icon that scatters and reforms as design, build, SEO and marketing in turn; the card backs; the portrait.
- **Motion rules.** Transform and opacity only. The headline never reflows (that is what keeps layout shift at 0): words that are not shown yet are offset, not removed.
- **Progressive.** A mouse gets the full page (`.fx`): pinned scene, drag physics, cursor labels, previews. Touch gets the same content with native scrolling and taps.
  No JavaScript, or reduced motion: everything is simply there, finished.

## The page, top to bottom

The order follows what a client asks: who is this, show me, why would it work for my business, what do I get, who am I hiring, how do I reach them.

1. **Hero:** the sentence builds, "cool" gives way to "SEO-friendly", then both sit together. Hover the name for a pixel face.
2. **Selected work:** one row per project in the manner of the reference: the name, a black frame, an arrow and "View". The picture is pixels at rest (the
   real clip, as big blocks, still moving); hover and it resolves to the site playing. On touch it resolves as the row reaches the middle of the screen.
3. **Site Chemistry** (pinned, scrubbed by scroll): the four things a site needs (design, build, SEO, marketing) light up in a list on the left as their
   circles arrive. Where all four meet is the orange core, ENQUIRIES. The view zooms into it and the screen ends on the verdict.
4. **Services:** three cards you can drag and flick. The heading's words follow the card you are on.
5. **Every detail, one designer:** who you would be working with.
6. **Connect:** click-to-copy email and links.

## Where things are

| File | What it does |
|---|---|
| `src/pages/index.astro` | Sections in order |
| `src/layouts/Base.astro` | `<head>` (meta, social cards, structured data), loader, scripts |
| `src/data/site.ts` | Reads `.env`; also the Work list |
| `src/styles/global.css` | Tokens, every component, phone layout |
| `src/scripts/hero.ts` | Headline sequence and the name hover |
| `src/scripts/chem.ts`, `ring.ts` | The Site Chemistry scene |
| `src/scripts/deck.ts`, `deck-eggs.ts` | Card dragging, flick physics, the three card scenes |
| `src/scripts/portrait.ts` | Scroll-driven pixelation of the portrait |
| `src/scripts/work.ts` | Work rows: clip loading, the pixel-to-sharp resolve |
| `src/scripts/pixel.ts`, `patterns.ts` | The pixel icon and its four shapes |
| `src/scripts/scroll.ts` | Lenis smooth scroll, section-aware header |
| `src/scripts/eggs.ts`, `serp.ts` | The other easter eggs |
| `scripts/single-file.mjs` | Bundles the built site into one HTML file (videos included) |
| `scripts/record-demo.mjs` | Records a Work clip and poster from a live site |

## Easter eggs

- **Flick a card hard** (or tap it, or press Enter on it): Development types a build log, Search Engine Optimisation opens a search page, Marketing pops incoming enquiries.
- **Type `seo`** anywhere (or click the hero pixel icon five times on a phone): a made-up search page opens and the site climbs from 8th to 1st.
- **Hover the name** in the hero: a face follows the pointer, the pixel icon bursts, letters under the cursor lift.
- **Click the headline** to watch it build again.
- **Open the console**, **switch tabs**, read `/robots.txt` and `/humans.txt`.

## Performance

Measured on a production build (Chromium, three runs each): largest contentful paint 2.3 s on desktop and 2.3 s on a throttled phone
(4x CPU, slow 4G), cumulative layout shift about 0. JavaScript is 58 KB gzipped (the search-page egg and its animation helper load only when
triggered), CSS 6 KB. Two things keep it there, and both are easy to undo by accident:

- The intro is deliberately quick so the longest word of the headline paints before the 2.5 s line.
- Everything below the first screen (the pinned scene, the cards, the Work pictures and clips) is set up and fetched only after the headline has painted
  (`setUpBelowFold` in `src/scripts/main.ts`). Fetching five posters and a clip at the start cost about 0.4 s on the throttled phone.

If you change the intro or add images near the top, re-measure.

## Not built yet

- **A contact form.** The site is static, so a form needs a small server function (the Resend key and addresses are already in `.env`).
  Until then the Connect section copies your email address.
- **Sound.** Optional; would need an off-by-default toggle.
- **The brand name.** The brand falls back to your own name until `PUBLIC_BRAND_NAME` is set.
