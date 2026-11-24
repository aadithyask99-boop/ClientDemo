# UK Thech homepage (concept)

A concept homepage for a UK B2B technology supplier (laptops and hardware for schools, health, councils, hospitality, property) that sells by quote. Built as a replicate-and-extend of the homepage of https://108.supply/ (owner's choice), with two moments borrowed from primeasialeather.com (the card hover that swaps to a close-up, and the cursor-lit footer). This is a concept for the owner and client to review, not the client's live site.

## Run
```
npm install
npm run dev        # http://localhost:4321
npm run build
node scripts/stage.mjs   # builds to ../site/ukthech for the shared demo deploy
```
Astro, GSAP (ScrollTrigger), Lenis (desktop pointers only), plain CSS. All copy and media names live in `src/data/site.ts`. Decisions and reasoning: `DECISIONS.md` and `.claude/skills/design-craft/references/clients/uk-thech.md`.

## Design
- Palette (owner's pick): graphite `#16181b`, paper `#f2f0eb`, blue `#4663ff` (white label on blue; `#9db0ff` tint for small links on dark). No gold, no hairlines, no small labels.
- Type (owner's pick): Host Grotesk, one family, weight 400 for headlines with -0.035em tracking, 500 for buttons. Self-hosted through `@fontsource-variable/host-grotesk`.
- Page: loader, inset hero film of four places, statement (words brighten with scroll), schools panel (Chromebooks dominant, hover swaps to a close-up), the quote sentence ("I need [Chromebooks] [30] by [before September]") with cutout objects drifting round it, the pinned order scene (a parcel opens and the pack lifts out), the promise desk (send us the quote you hold, the in-tray is a real file input, the lamp warms), and a cursor-lit footer. Get a quote opens the same sentence in a sheet from any screen.

## Placeholders (not the client's facts; shown on the page as placeholders)
All in `src/data/site.ts`, marked TO_CONFIRM: the named contact and photo, the direct phone number, the quote email, the address, the reply time, credit terms, which brands are supplied and on what terms, the recycling partner, any framework or accreditation, the new brand name and logo ("UK Thech" is the old name, used only as a working wordmark). The order scene's paperwork is illustrative (no legible text) and its contents are to be confirmed with the client. Nothing is sent when the quote form is submitted (concept only; a mailto fallback is offered).

## Easter eggs (triggers, for showing the client)
1. Type `chromebook` anywhere (touch: long-press the Chromebooks panel): a charging trolley rolls across the bottom and its laptop lights come on one by one.
2. Send a quote (or rest the pointer on the send button for two seconds): a "RECEIVED" purchase-order stamp slams down. Sound plays only after a deliberate click or tap.
3. Keep scrolling or pushing at the very bottom (touch: overscroll): a delivery van crosses the footer and leaves a parcel by the wordmark. One subtle hint pulse appears by the phone number after 8 seconds idle, once per session.

## Media
All photographs are generated stills (Google Flow, Nano Banana 2.1) of places and objects only: no people, no logos, no legible text. They are the 1376 px previews, because the 2K downloads could not be retrieved, so at full width they are upscaled about 1.1x and slightly soft. Replace them with the 2K downloads from the same Flow project (`public/media/*.webp`, same names) before showing the client. The four object cutouts (`cut-*.webp`) were made with a background-removal model from the studio shots. Generated imagery is for concept review; real client photography replaces it when supplied.

## Checks run
Build clean, no console errors, no horizontal overflow at 1440 or 390; the motion probe against 108.supply (about 146 scroll-moving elements against 165, no section without motion); media-quality (upscaled images listed above); detail-audit (each photograph once); Impeccable detect; owner-critic on the plan (three rounds) and the build.
