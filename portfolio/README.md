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
- **Your photo:** put it at `public/portrait.jpg` (or `.jpeg`, `.webp`, `.png`, `.avif`, portrait orientation, about 800x1000). It replaces the stand-in
  monogram and assembles out of pixels when it scrolls into view. The little face that follows the cursor in the hero is a stand-in too:
  put an `<img>` inside `[data-mm-av]` in `src/components/Hero.astro`.
- **Copy:** the headline words are in `Hero.astro`, the service cards in `Deck.astro`, the circle words in `Chemistry.astro`, the project list in `src/data/site.ts`.
- **Work previews:** `public/work/<slug>.webp`, one per project, 960 px wide.
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

1. **Hero:** the sentence builds, "cool" gives way to "SEO-friendly", then both sit together.
2. **Site Chemistry** (pinned, scrubbed by scroll): tick ring that swells toward the pointer, the orange core grows until it floods the screen, the view pulls back to four circles
   (design, build, SEO, marketing) with words along each, and the one place they meet: COOL + FOUND.
3. **Services:** three cards you can drag and flick. The heading's words follow the card you are on.
4. **Every detail, one designer:** the portrait assembles out of pixels.
5. **Work:** six demos, tagged client demo or concept, with a picture of each following the pointer.
6. **Connect:** click-to-copy email, links, a live clock in the header.

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
| `src/scripts/portrait.ts` | Pixel-assembling portrait |
| `src/scripts/work.ts` | Work list hover preview |
| `src/scripts/pixel.ts`, `patterns.ts` | The pixel icon and its four shapes |
| `src/scripts/scroll.ts` | Lenis smooth scroll, section-aware header |
| `src/scripts/eggs.ts`, `serp.ts` | The other easter eggs |
| `scripts/single-file.mjs` | Bundles the built site into one HTML file |

## Easter eggs

- **Flick a card hard** (or tap it, or press Enter on it): Development types a build log, Search Engine Optimisation opens a search page, Marketing pops incoming enquiries.
- **Type `seo`** anywhere (or click the hero pixel icon five times on a phone): a made-up search page opens and the site climbs from 8th to 1st.
- **Hover the name** in the hero: a face follows the pointer, the pixel icon bursts, letters under the cursor lift.
- **Click the headline** to watch it build again.
- **Open the console**, **switch tabs**, read `/robots.txt` and `/humans.txt`.

## Performance

Measured on a production build (Chromium, three runs each): largest contentful paint 2.3 s on desktop and 2.2 s on a throttled phone
(4x CPU, slow 4G), cumulative layout shift about 0. JavaScript is 57 KB gzipped (the search-page egg and its animation helper load only when
triggered), CSS 5 KB. The intro is deliberately quick so the longest word of the headline paints before the 2.5 s line. If you lengthen the
intro, re-measure.

## Not built yet

- **A contact form.** The site is static, so a form needs a small server function (the Resend key and addresses are already in `.env`).
  Until then the Connect section copies your email address.
- **Sound.** Optional; would need an off-by-default toggle.
- **The brand name.** The brand falls back to your own name until `PUBLIC_BRAND_NAME` is set.
