# Sidecut (fictional concept)

A fictional barbershop group with three shops in central London (Soho, Shoreditch, King's Cross). Concept site for client demos, a like-for-like replica of the design language of a barbershop booking reel (monochrome, extended wide grotesk, a lit barber chair, a four-step booking drawer). Everything is invented: brand, addresses, phone numbers (020 7946 0xxx is reserved for fiction), prices, reviews (the 4.9 and 612 are illustrative) and the booking flow, which sends and charges nothing.

## Run
`npm ci && npm run dev`. Staging for the shared deploy: `node scripts/stage.mjs` (served under `/sidecut`).

## Where things are
- `src/data/site.ts`: all content (services, shops, barbers, plans, reviews, FAQ).
- `src/pages/index.astro`, `src/styles/global.css`, `src/scripts/main.ts` (hero, reveals, props, filters, gift card, reviews, easter eggs), `src/scripts/booking.ts` (the drawer).
- `public/art/`: `seq/c-001..073.webp` chair orbit frames, `barber-*-f/b.webp` portraits (front and back), `prop-*.webp` cut-outs, `giftcard.webp`, `hair.webp`.
- `scripts/process-art.py` turns the generated sources in `art-src/gen` (not committed) into those assets: frames, keying magenta to alpha, grey portraits.

## How the hero works
No WebGL. A six second 1080p clip of the chair turning (image-to-video from one generated chair photograph) is cut to 73 frames and drawn on a canvas. Drag, the scroll position and a slow sway choose the frame. The lamp is a CSS radial gradient overlay whose centre follows the cursor (eased, written as two CSS variables). Phones get the same frames with touch drag.

## Easter eggs
Type `fade` anywhere: the screen goes through a skin fade. Hover or tap the footer wordmark: a clipper passes over it.

## Honest notes
Generated imagery cannot be copyrighted. Not tested on a real phone. Reduced motion: no smooth scroll, no sway, instant reveals.
