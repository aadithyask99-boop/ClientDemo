# ILÉ IFÉ demo site

One-page concept for ILÉ IFÉ (facials, Elephant & Castle, South London). Astro 7 + GSAP (SplitText). Staged next to
Doves UK in the shared demo deploy at `/ileife`.

## Run

```bash
npm install
npm run dev        # http://localhost:4331 via .claude/launch.json at the workspace root, or plain astro dev
npm run build      # root build
node scripts/stage.mjs   # builds with BASE_PATH=/ileife into ../site/ileife (what Cloudflare runs)
```

The repo root `wrangler.jsonc` builds Doves, then this site, then copies `demo-index/index.html` to `site/index.html`.

## Design

- Palette: plum #2d2230, cream #f4ede3, sand #e2d5c5, rose #e9d6d5, accent rose. The page colour (and nav, text, lines) eases
  between four tones as the section at mid-viewport changes (`data-tone-section`, registered `@property` colours).
- Type: Cormorant Garamond (display, weight 300 to 400, upright only) and Manrope (body). This client deliberately uses a
  serif, taken from the mock. No italic font files are shipped.
- Through-line: blur to clarity. The preloader dissolves from a blur into the hero, and images and text sharpen as they enter.
- Copy is in `src/data/site.ts`, from her website and Instagram. Reviews are verbatim.
- No labels above section titles (kept from the Doves rules).

## Effects, all desktop only and switchable

`?panel` shows a small panel to toggle them live. `?fx=off` or `?fx=glow,peek,magnet` sets them from the URL.
- glow: warm light trailing the cursor on dark sections
- peek: facial photo drifting after the cursor over the treatment rows
- magnet: a small pull on Book buttons

Reduced motion switches the preloader and all entrance motion off.

## To do before it is shown as final

- Her own portrait: save as `src/assets/photos/princess.jpg` (picked up automatically, replaces the treatment room photo).
- Booking link: all Book buttons go to https://ileife.facesconsent.com/ (`brand.book`). Confirm the real booking URL.
- Address and opening hours: only "Elephant & Castle, South London" is shown (unconfirmed). One review mentions Cherrill Street.
- Photography is Pexels stock (research/stock/SOURCES.md). Swap in her own client and studio photos.
- Quiz wording and the persona names are ours, built from her skin persona post; she should approve them.
