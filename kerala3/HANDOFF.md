# kerala3 handoff (for a fresh chat)

Read `README.md` and `PLAN.md` here, then `.claude/skills/design-craft/SKILL.md`, `references/owner-taste.md` and `references/orchestration.md`. Build the page (`npm ci`, `BASE_PATH=/ npx astro build`, then preview) and look at it at 1440 and 390 wide before you propose anything.

## State
kerala3 is the Kerala Tourism homepage concept in replicate-and-extend of reddottours.com (the owner's recording and a capture). Ten sections: hero (three seasons, four switchable heroes), statement, pinned destination fan, Kerala by month (centrepiece), dark "heart of Kerala is its people", water (frame grows to full bleed), get inspired, trips, stays and off the well-trodden path, CTA and footer. It is merged on `main` and published as an artifact.

## What the owner asked for now
"What is it from keralatourism.org that we could add here and which is missing?" The owner says everything is **literally on the keralatourism.org home page**, and named: **video gallery, hospitality services, e-brochures, popular destinations**, "and a lot more".

## What went wrong in the previous chat (do not repeat)
- It read the site with plain `curl`, which cannot see the content the page loads in the browser, then fell back to a 2020 sitemap. The owner told it twice to use a headless browser.
- It kept proposing things the page already has: something in the hero, and a horizontal scroll next to the existing "Heart of Kerala" one. The owner called both repetitive.
- It ended with an eight-item list and asked the owner to choose. The owner found that overwhelming.

## The job
1. Open the real keralatourism.org home page in a headless browser (`node .claude/skills/design-craft/scripts/capture-site.mjs https://www.keralatourism.org --out captures/keralatourism --video`, dismiss pop-ups, scroll fully so lazy sections load) and list the sections the home page actually shows, in order, with their headings.
2. Compare with kerala3's ten sections. Drop anything kerala3 already has or that would repeat an existing mechanism (the horizontal scroll, the hero, the pinned fan).
3. Return **at most five** additions, ranked, **with a recommendation**: for each, what it is, where it goes in the flow, a recommended design built from Red Dot's design system and motion (replicate-and-extend), one alternative, the precedent from our sites or from motionsites.ai (cite previews you looked at), and why it will not feel like a repeat of another section. Do not ask the owner to pick from a long list; recommend, and wait for approval before building.
4. Follow the hard rules: no gold, no hairlines or small labels, no gadgets (no widgets, charts, counters or small vector devices over photography), text at least 16px and readable, two quiet colours plus one loud accent used as a highlight, interaction inside the imagery. Use the helper agents for heavy steps, keep reports short, and run the `owner-critic` agent on the proposal before showing it.

## Owner's messages from the previous chat (verbatim)
- "Again, so this also seems a bit repetitive because we already have something that is similar, the Heart of Kerala, which is also like a horizontal scroll. So again, that wouldn't make sense."
- "Again, why are you repeating that? Because we already have that in the hero, right? ... what I was asking was what is it that from Kerala tourism that we could add here and which is missing?"
- "What about video gallery? What about hospitality services, e-brochures? Popular destinations ... like I can take a lot. Then what? Did you not see all these?"
- "I mean, what I've said are all literally in the home page. Just use the headless browser or something else for this. Everything is on the home page."
