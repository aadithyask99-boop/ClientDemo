# Inspiration research (the funnel)

Used in the plan step, for every new section the reference has no counterpart for. The aim is real, current ideas beyond the generic defaults (eyebrow label plus headline, boxed card grids, decorative lines, gradient glows), found without the owner handpicking each time. "Full crawl" here means a funnel: wide and cheap first, then deep on the few that matter.

## The funnel
1. **Wide (cheap).** For each new section choose up to 3 categories on details.so that match its content and mechanism family (for example `steps`, `pinned-scroll`, `stacked-scroll`, `scroll-animations`, `features`, `about`, `case-study`, `portfolio`) and run `node .claude/skills/design-craft/scripts/inspo-shortlist.mjs <category> ...`. It lists the free examples with their tags.
2. **Reason (judgement, in writing).** Score each candidate from its name, tags and industry, and a look at its first screen, on six questions: does it fit this content? does it fit the reference's language (colour, type, restraint)? is it different from our own sites (`fingerprints.md`)? can it be built in Astro and GSAP at a good speed? does it work on a phone and with reduced motion? is it not one of the generic defaults? Keep the best 6 and say why the rest went.
3. **Deep (the real crawl).** Resolve the real sites (`inspo-shortlist.mjs --resolve <item path> ...`) and study the top 3 on their own sites: `scripts/capture-site.mjs` for full-page strips and the design language, `scripts/motion-probe.mjs` for how they move, and the site's own script for real easings and durations. Look at every strip, not a contact sheet.
4. **Shortlist for the plan.** For each new section show two or three real examples: the link, what it does, the mechanism we would borrow, how it would be re-skinned in the reference's language, and the risk. One must be rooted in the client's subject. The owner reacts.
5. **Keep what is good.** The owner's picks become pattern cards in `references/inspiration/` and lines in `patterns.md`.

## Limits and manners
- Free public pages only, at a human pace: at most 3 category pages and 8 resolved items per run, 2.5 s between page loads. No login, nothing under `/api/`, and never get around the paywall. The library beyond the free slice is reached through the official MCP (paid), not by crawling.
- The sites are public and commercial, not open source. Study them for ideas and mechanisms; never copy their code, images or words.
- The capture tool dismisses most cookie banners and many pop-ups; one that appears late can still cover a site (the Art of Documentary newsletter pop-up did). Skip such a site or pick another example.
- A still cannot show motion. Judge motion with the probe and, where possible, by watching the recording.

## Worked example (2026-11-03, EVM Group milestones: four dated moments)
Categories read: `steps` (8 free examples) and `pinned-scroll` (7). Real sites studied in full: Daylight (godaylight.com), Understory (understory.io); The Art of Documentary could not be seen because of a pop-up. See the cards `inspiration/daylight-stacked-steps.md` and `inspiration/understory-stacked-cards.md`.
