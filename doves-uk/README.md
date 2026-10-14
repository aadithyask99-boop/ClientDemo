# Doves UK

One-page site for Doves Holdings' UK presence (funeral and repatriation cover, Doves Global Plan, remittances). Built with Astro 7, static output, no UI framework.

Copy is the client's final wording from doveslife.co.uk (see `research/content-final.md`). Only layout and order changed. Cover and fleet photos follow the title and photo pairs on that site.

## Run

```bash
npm install
npm run dev        # http://localhost:4321
npm run build      # static site in dist/
npm run preview    # serve dist/
npx astro check    # type check (TypeScript 6 is pinned on purpose)
```

## Design language

Modelled on the reference the client supplied (radiatinghope.org, a screen recording): calm, editorial, photography first.

- One grotesque (Schibsted Grotesk) at **weight 400 for every heading and paragraph** (measured on the reference: only button and link labels are 500). Sizes follow the viewport like the reference but about 10% larger: hero 5.6vw, statement 3.8vw, title 2.6vw, lead 1.55vw, card titles `--fs-h3`, body 18px. Every heading and paragraph uses these tokens (`global.css`). Gutter is 6.5vw for logo, hero title and every section. The logo is two stacked images clipped at section edges so it changes colour exactly where a dark section ends., statement 3.4vw, title 2.4vw, lead 1.4vw, body 17px.
- White space, full-bleed photography, rounded corners of 8 and 24px, pill buttons in Doves blue (#084b9a, sampled from the logo).
- Vertical scroll only. The one sideways element is the covers carousel, moved by arrow buttons or swipe.
- Motion is limited to the hero crossfade and slow zoom, the looping plan video, a header that turns to white glass on scroll, quiet fade-ins, the steps loop, the remittance marquee and the form steps. No parallax, no cursor-driven movement. All of it respects `prefers-reduced-motion`.
- No italics, no em dashes, no labels above titles.

## Page order

| Section | File |
| --- | --- |
| Top strip, bare logo (white or blue by section), two frosted capsules without borders (nav, Login and Apply), sliding nav highlight | `Header.astro`, `src/scripts/nav.ts`, `src/scripts/ui.ts` |
| Hero: slideshow of four family photos with a slow zoom and crossfade (no bars, no cursor movement), with one transparent outline "Apply Now" pill under the title as on the reference | `Hero.astro`, `src/scripts/hero.ts` |
| Big centred statement | `Statement.astro` |
| Title left, text right | `Repatriation.astro` |
| Covers: 11 photo cards, draggable carousel with arrows and a "Drag" cursor | `Covers.astro`, `src/scripts/carousel.ts` |
| Doves Global Plan: centred like the reference (big title, narrow white card on a soft blurred halo, big closing line) over a looping family video | `Plan.astro`, `src/scripts/plan.ts` |
| Four steps: automatic 1 to 4 animation (lines fill, numbers light up), no icons | `Steps.astro`, `src/scripts/steps.ts` |
| Fleet, tentage and events: photo grid (4, 4, then 3 larger) | `Fleet.astro` |
| Pay in your currency: faint dotted world map centred behind the text (no line) | `Currency.astro`, `DotMap.astro` |
| Who the plan is for | `Faq.astro` |
| Remittances: infinite draggable marquee of 7 photos with blurred edges | `Remit.astro`, `src/scripts/marquee.ts` |
| Rounded photo banner, the one centred Apply Now in the page body | `Cta.astro` |
| Speak with us, one-question-at-a-time enquiry | `Contact.astro`, `src/scripts/form.ts` |
| Light footer | `Footer.astro` |
| Scroll-up button (appears after the first screen, progress ring) | `ToTop.astro`, `src/scripts/totop.ts` |

Copy, links, cover and fleet photo pairings: `src/data/site.ts`. Colours, type scale and the shared hover zoom: `src/styles/global.css`. Photos and logos: `src/assets` (originals in `research/originals` and `research/stock`).

The header Apply capsule is persistent navigation, not a page call to action. There is no sticky bottom bar on phones; Call and WhatsApp are rows in the phone menu.

The dotted map is generated at build time from Natural Earth land data (`world-atlas`, `topojson-client`, `d3-geo`) and ships as a single SVG path.

## Video

The Plan video is Pexels clip 5136247 (free to use, no attribution required). It was prepared with ffmpeg into a seamless 9 second loop (the tail cross-fades into the head), H.264, no audio: `public/video/plan-1080.mp4` (about 6 MB), `plan-720.mp4` (about 1.8 MB for phones) and `plan-poster.webp`. It only loads when the section is near the screen, pauses off screen, and falls back to the poster for reduced motion or Save-Data. Sources for all stock media are in `research/stock/SOURCES.md`.

## Images

`Photo.astro` is the only image component. Its `sizes` and `widths` must describe the image as it is **rendered after the object-fit crop**, not the box it sits in. A landscape photo cropped into a portrait card is drawn much wider than the card, so describing the card width produces blurry files. Widths larger than the source are dropped automatically. Webp quality is 82. Full-bleed photos are limited by their originals (1800 to 2000 px), so ask Doves for higher resolution files if retina sharpness matters.

## Preloader (draft only)

A white screen with a quiet 0 to 100% counter, then the page sharpens from a slight blur as it fades (`Preloader.astro`, `src/scripts/preloader.ts`). It shows in dev and on the demo deploy (`PUBLIC_PRELOADER=1` is set by `scripts/stage.mjs`) and is left out of normal production builds. Skipped for reduced motion.

## Enquiry form

One question at a time. On submit it validates, then opens a pre-filled WhatsApp message (the same flow as the current site). To also email `contactcenter@doves.co.zw`, set a form endpoint (for example Formspree) before building:

```bash
PUBLIC_FORM_ENDPOINT=https://formspree.io/f/xxxx npm run build
```

## Open items before launch

- Regulatory and insurer wording for the footer (FCA details), supplied by Doves. Add to `regulatory` in `src/data/site.ts`; nothing renders while it is empty.
- Source for "Trusted since 1902" (kept from the executive's copy).
- Confirm rights to the stock photos (hero family, kitchen, memorial, airport, remittances, funeral stills).
- Form endpoint if email delivery is wanted.
- Privacy and cookie pages, and analytics choice (Plausible avoids a cookie banner).
- Deployment target for doveslife.co.uk (Cloudflare Pages or Netlify suggested).
