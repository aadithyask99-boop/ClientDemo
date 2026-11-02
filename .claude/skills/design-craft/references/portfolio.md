# Owner's freelance portfolio ("Aadi")

Source: `portfolio/` in this repo (merged from branch `claude/admiring-pasteur-b27yph`). Also published as an artifact: https://claude.ai/artifact/XtfJSKPuMxD2NUuVCKuQXd, a single-file build of the same site. Mode: **original**, with the Work section "built on the mechanism of the reference" (the owner's reference for showing project clips).

Read `portfolio/README.md` and `portfolio/CLAUDE.md` before changing anything there; they are detailed and accurate.

## Positioning (the owner's own words on the page)

- "Hi, I'm Aadi and I make cool, SEO-friendly websites." Digital marketer and web designer, UK, remote worldwide.
- "Built bespoke for your business. Nothing generic." Copy repeats "none of that generic AI-made look".
- "Site Chemistry": Design, SEO, Marketing, Build meet at ENQUIRIES. "Pretty is easy. Pretty that gets you enquiries is the job."
- Offer: five-page bespoke animated website, £1,299. "I design your homepage first. You only pay once you love it."
- Six listed concept builds: Halcyon, Brew More, Orra, ILE IFE, DJ ESKA, Doves UK. The Garden is not listed.

## Design language (this one is the owner's own brand, different from the client sites)

- **Two worlds:** cream `hsl(39 50% 95%)` and black. The header changes colour with whichever is under it.
- **One accent:** orange `#ff5a1f` for fills and anything on black; `#f5501a` for large text on cream (plain orange fails contrast).
- **Type:** Geist at weight 600 with very tight tracking (-0.065em), line-height 1. Geist Mono for small labels.
- **Signature:** pixels. A 7x7 icon that scatters and reforms as design, build, SEO and marketing; pixel card backs; a portrait that resolves from huge blocks to a photo as you scroll; headings built from pixels with real text kept in the page.
- **Motion rules:** transform and opacity only. The headline never reflows (words not yet shown are offset, not removed), which keeps layout shift at about 0.
- **Progressive:** a mouse gets the full pinned and physics page; touch gets the same content with native scrolling; no JavaScript or reduced motion shows everything finished.
- **Playful but earned:** many easter eggs (type `seo`, hold Shift, flick a card, a sleeping cursor, a rocket at the bottom). Small triggers, scenes loaded only when found, hints limited to six per visit.

## Page order (what a client asks, in order)

Who is this (loader is the headline) then show me (Work clips) then why it works (Site Chemistry) then what do I get (three draggable service cards) then who am I hiring (portrait) then the call to action, pricing sheet and contact.

## Performance bar (measured, keep it)

Largest contentful paint about 1.0 s desktop and 1.7 s throttled phone, layout shift about 0, JavaScript about 63 KB gzipped. Rules that protect it: the longest headline word must remain the largest paint; no picture in the first screen; below-the-fold setup runs after the headline lands; no `will-change` on hundreds of small things; one Work clip plays at a time. Re-measure after touching the intro.

## Recording the Work clips

Use `portfolio/scripts/record-demo.mjs` on that branch. It does not screen-record. It pauses the browser clock and steps it 1/60 s per frame, so a clip is exactly 60 fps and takes 5 to 15 minutes. Needs Playwright and ffmpeg. See the "Previewing a site" section of `SKILL.md` for the command and per-site settings.

## What this means for design decisions

- The portfolio's promise is the quality bar: every site must pass "does this look like every other AI site?" If it might, push further.
- SEO is part of the pitch, so structure, speed and accessibility are design requirements.
- If a listed site changes materially, tell the owner so its clip and poster can be re-recorded.
