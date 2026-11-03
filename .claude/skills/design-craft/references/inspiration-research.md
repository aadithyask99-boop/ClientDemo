# Inspiration research (the funnel)

Used in the plan step, for every new section the reference has no counterpart for. The aim is real, current ideas beyond the generic defaults (eyebrow label plus headline, boxed card grids, decorative lines, gradient glows), found without the owner handpicking each time. "Full crawl" here means a funnel: wide and cheap first, then deep on the few that matter.

## When not to run it
Do not run it on the replicate path (the owner wants the reference matched with their own content and every block fits a section the reference already has). Run it only for a section that has no counterpart in the reference, and only after the owner has chosen to add that section. When nothing is new, say "no new sections, so the research is not needed" in the plan and move on.

## The funnel
1. **Wide (cheap).** For each new section choose up to 3 categories on details.so that match its content and mechanism family (for example `steps`, `pinned-scroll`, `stacked-scroll`, `scroll-animations`, `features`, `about`, `case-study`, `portfolio`) and run `node .claude/skills/design-craft/scripts/inspo-shortlist.mjs <category> ...`. It lists the free examples with their tags.
2. **Reason (judgement, in writing).** Score each candidate from its name, tags and industry, and a look at its first screen, on six questions: does it fit this content? does it fit the reference's language (colour, type, restraint)? is it different from our own sites (`fingerprints.md`)? can it be built in Astro and GSAP at a good speed? does it work on a phone and with reduced motion? is it not one of the generic defaults? Keep the best 6 and say why the rest went.
3. **Deep (the real crawl).** Resolve the real sites (`inspo-shortlist.mjs --resolve <item path> ...`) and study the top 3 on their own sites: `scripts/capture-site.mjs` for full-page strips and the design language, `scripts/motion-probe.mjs` for how they move, and the site's own script for real easings and durations. Look at every strip, not a contact sheet.
4. **Shortlist for the plan.** For each new section show two or three real examples: the link, what it does, the mechanism we would borrow, how it would be re-skinned in the reference's language, and the risk. One must be rooted in the client's subject. The owner reacts.
5. **Keep what is good.** The owner's picks become pattern cards in `references/inspiration/` and lines in `patterns.md`.

## Limits and manners
- Free public pages only, at a human pace: at most 3 category pages and 8 resolved items per run, and the funnel is run once per new section (so about 3 runs for 3 new sections), 2.5 s between page loads. No login, nothing under `/api/`, and never get around the paywall. The library beyond the free slice is reached through the official MCP (paid), not by crawling.
- The sites are public and commercial, not open source. Study them for ideas and mechanisms; never copy their code, images or words.
- The capture tool dismisses most cookie banners and many pop-ups; one that appears late can still cover a site (the Art of Documentary newsletter pop-up did). Skip such a site or pick another example.
- A still cannot show motion. Judge motion with the probe and, where possible, by watching the recording.

## Worked example (2026-11-03, EVM Group milestones: four dated moments)
Categories read: `steps` (8 free examples) and `pinned-scroll` (7). Real sites studied in full: Daylight (godaylight.com), Understory (understory.io); The Art of Documentary could not be seen because of a pop-up. See the cards `inspiration/daylight-stacked-steps.md` and `inspiration/understory-stacked-cards.md`.

## The details.so MCP (optional, paid)

What it is: a remote HTTP MCP server at `https://api.details.so/mcp`, marked BETA on their site, with a browser sign-in (OAuth). It is included on every paid plan: Pro lists 300 MCP credits a month and Max 1,000. It searches their whole library (3,400+ examples) in natural language, beyond the free slice the funnel can read.

Checked from a cloud session on 2026-11-03, without credentials:
- An unauthenticated request returns 401 with standard OAuth discovery metadata, and the response headers carry credit counters (`X-Details-Credits-Limit`, `X-Details-Credits-Remaining`).
- Its OAuth server supports dynamic client registration, authorisation code with PKCE and refresh tokens, which is what claude.ai custom connectors use. So it should be addable as a connector.

Not verified (needs an account): the sign-in itself, the list of tools, what a result contains (links, stills, video), how many credits one search costs, and whether claude.ai accepts this particular server.

How to connect it for cloud chats: subscribe, then add a custom connector at claude.ai/customize/connectors with the URL above and sign in, then start a new chat (connectors are read when a session starts). The `claude mcp add details ...` command on their site registers it only on the owner's own computer and does not carry over to cloud. A `.mcp.json` in the repository will not work either, because the sign-in needs a browser.

When its tools are available in a session: use them for funnel step 1 instead of the free pages, then do steps 2 to 5 as before (reason in writing, study the top three on their own sites, shortlist, cards). Budget at most 5 searches per job and report the credits used in the handover. Judge it by whether the shortlists contain ideas the free slice would not have, not by how many results it returns.

First test once connected: ask for "a pinned timeline of four dated moments, restrained and monochrome, automotive or hospitality" and see whether the results include links to the real sites that the capture tools can study.

## Other sources (a toolbox for effects, not for direction)
Checked 2026-11-03 from the public pages. These are component and effect libraries. They can supply a starting implementation for one specific effect (a text reveal, a cursor effect, a 3D tilt) once the design direction is already set; they are not where design direction should come from, and their look is the generic component-library look the owner wants to avoid. Check each one's licence and terms before taking code, take the mechanism, and re-skin it to the reference.
- **daisyUI (daisyui.com):** a free, open-source Tailwind CSS component library with built-in themes. It has a documented MCP server for its docs and a separate "Blueprint" code-generator MCP (terms not checked). Our sites use plain CSS, not Tailwind, so it is of little use. Its theme list can serve as a colour reference at most.
- **Kexsio (kexsio.com/animations):** a gallery of live-preview components (hero, footer, testimonials, 3D, text and cursor effects, backgrounds) with "copy the code or recreate it with the original AI prompt". Its MCP needs an account and MCP keys (kexsio.com/profile/keys); pricing and licence not seen.
- **Originkit (originkit.dev):** an animated component library, mostly shader and ASCII backgrounds, interactive elements and effects. Not fully free: the free plan allows about 3 component copies and 5 credits a day, Pro is $79 a year and Ultimate $99 a year, and copies through its MCP count against the allowance. Licence not checked.
- **When to use them:** at the build step, for one effect at a time, after the plan is approved; list what was taken in the handover. details.so stays the primary source of ideas, because it shows real sites and is tagged by hand.

