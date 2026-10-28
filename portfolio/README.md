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
```

## Settings live in `.env`

Everything that is not copy is a value in `.env` (see `.env.example` for each one, with comments): names, role, timezone, email, social links,
site URL, the contact-form and image-API keys. `src/data/site.ts` reads them. `PUBLIC_*` values reach the browser, the rest never do.
`.env` is gitignored. **While `PUBLIC_NOINDEX=true` the site tells search engines to stay away. Set it to `false` at launch.**

## Design language

- **Two worlds.** Cream (`hsl(39 50% 95%)`) and black. The header changes colour with whichever is under it.
- **One accent, orange.** `--accent #ff5a1f` for fills and anything on black. `--accent-ink #f5501a` for big text on cream (3.2:1; plain orange is 2.85:1 and fails).
- **Type.** Geist at weight 600, very tight tracking (`-0.065em`), line-height 1. Geist Mono for small labels.
- **Pixels** are the signature: a 7x7 icon that scatters and reforms as design, build, SEO and marketing in turn.
- **Motion rules.** Transform and opacity only. The headline never reflows (that is what keeps layout shift at 0): words that are not shown yet are offset, not removed.

## Where things are

| File | What it does |
|---|---|
| `src/pages/index.astro` | Sections in order: Hero, Chemistry, Work, Connect |
| `src/layouts/Base.astro` | `<head>` (meta, social cards, structured data), loader, scripts |
| `src/data/site.ts` | Reads `.env`; also the Work list |
| `src/styles/global.css` | Tokens, every component, phone layout |
| `src/scripts/hero.ts` | Headline sequence and the name hover |
| `src/scripts/pixel.ts` + `patterns.ts` | The pixel icon and its four shapes |
| `src/scripts/ring.ts` | Tick ring that swells toward the pointer |
| `src/scripts/scroll.ts` | Lenis smooth scroll, section-aware header |
| `src/scripts/eggs.ts`, `serp.ts` | Easter eggs |

## Easter eggs

- **Type `seo`** anywhere (or click the hero pixel icon five times on a phone): a made-up search page opens and the site climbs from 8th to 1st.
- **Hover the name** in the hero: a face follows the pointer, the pixel icon bursts, letters under the cursor lift.
- **Click the headline** to watch it build again.
- **Open the console**, **switch tabs**, read `/robots.txt` and `/humans.txt`.

## Performance

Measured on a production build (Chromium, three runs each): largest contentful paint 2.3 s on desktop and 2.1 s on a throttled phone
(4x CPU, slow 4G), cumulative layout shift 0. JavaScript is about 53 KB gzipped, CSS 4 KB. The intro is deliberately quick so the
longest word of the headline paints before the 2.5 s line. If you lengthen the intro, re-measure.

Without JavaScript, or with reduced motion on, the page shows the finished sentence at once and skips the loader.

## To do next

Site Chemistry scroll scene (ring zooms into the four-circle Venn), the three draggable service cards with their flick eggs, the portrait that
assembles out of pixels, a real contact form (Resend key is already in `.env`), and project previews in the Work list.
