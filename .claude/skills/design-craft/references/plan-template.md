# The section plan (the one checkpoint)

On a reference-led job, after studying the reference and the client's current site and before building or spending anything, show the owner this plan and wait for "go". It exists so they know what to expect before tokens are spent. After the go, run to the end without further questions. If they change the plan, update it and proceed; do not ask again.

## Replicate path: a short plan
If the owner wants the reference replicated with their own content and every content block has a counterpart in the reference, the plan is only: (1) the slot map: each reference section, the owner's content that goes in it, and what changes (colours, copy, images); (2) the palette line; (3) any content that fits no slot, with the options (a new section, fold it into a slot, leave it out or link it); (4) the sentence "no new sections, so the inspiration research is not needed". Do not run the funnel for sections that already exist in the reference. End with "Reply go, or tell me what to change."

## Read these first, and think before writing (extend path)
1. **The client's current site** (`captures/<client>/report.md`, the as-is audit): the brand cues worth keeping (logo, colour accents, tone, imagery) and what is weak.
2. **The reference**: its design system, its section patterns and its motion spec.
3. **Our own sites**: `patterns.md` (mechanisms by content type), `fingerprints.md` (so the result is not a sibling of an existing site) and the two or three closest case studies.
4. **`feedback.md`**: lessons that apply.

For every section that has no counterpart in the reference, answer five questions before choosing a design: (a) what question is the visitor asking here? (b) which pattern in the reference's own vocabulary answers it? (c) which of our sites solved a similar content problem, and by what mechanism? (d) what is the alternative, and why is it second? (e) what could go wrong?

## Format (about one page, plain words)
1. **The story in one sentence:** what the visitor should feel and learn, in order.
2. **The palette:** ground, ink and one accent (and a spark, if any), the reason from the client's core idea and the reference's colour rules, the contrast result from `scripts/palette.mjs`, and one alternative (see `colour.md`).
2b. **The flow, as a table:** `#`, section, purpose, content shown (the one to three highlights), source and relation to the reference (copy, adapt or new; in inspiration mode at most half of the sections may be copy, and say where the client's own identity shows at scale), layout and focal element, motion, assets (real, stock or generated).
3. **Each new section, a short block (required):** the recommended design and one alternative, the answers to the five questions in a line or two, and the precedent from our own sites (named, from `patterns.md`). A plan whose new sections lack a precedent and an alternative is incomplete. Add an **inspiration shortlist** of two or three real examples per new section (link, what it does, the mechanism borrowed, how it is re-skinned in the reference's language, the risk), found with the funnel in `inspiration-research.md`, one of them rooted in the client's subject. Copy the blocks into the section map file as well, so they survive the chat.
4. **What stays from the client's current design and what changes.**
5. **Cut or linked out:** what is not on this page and where it will live.
6. **What I need from you and what it will cost:** footage or photos needed; generation spend against the cap.
7. End with: "Reply go, or tell me what to change."

Keep it short. No code, no long lists of options, no other questions.

## Worked example (illustrative, EVM Group with the ESR reference)
**Story:** a seventy-year family of businesses, felt in under a minute, with a reason to click through to each part.

| # | Section | Content shown | Source | Layout and focal element | Motion |
|---|---|---|---|---|---|
| 1 | Hero film | "Future is our Business" | ESR hero | full-bleed film, headline | intro, text typed on |
| 2 | Statement | the 1952 toddy-shop story in 3 lines | ESR statement | huge type across the screen | words reveal on scroll |
| 3 | Marques | 9 brands | ESR marque roller | huge list, preview square | active item swaps |
| 4 | Our story (new) | 4 dates: 1952, 1985, 2001, 2013 | new | pinned: one date and one line at a time | text swaps with line reveal |
| 5 | Sectors (new) | 5 sectors | new | numbered hairline rows | hover preview image |
| 6 | Recognition (new) | 3 strongest awards | new | one large figure at a time | counter and fade |
| 7 | Footer | contact | ESR footer | giant EVM mark | mark reveals |

**Our story (new).** Recommended: a pinned section where the year is a small label and the line is set large, swapping as you scroll. (a) The visitor asks "how did this become so big?". (b) ESR's statement style with its small uppercase labels. (c) more-coffee pins its statement cards, and orra pins its chapters. (d) Alternative: all twenty dated entries as a list; second because that was the cluttered result. (e) Risk: a pin can feel stuck on phones, so it unpins there.
**Sectors (new).** Recommended: ESR's numbered hairline rows with a hover preview, so the five businesses read as a set. (c) orra's hover-bar table, halcyon's trailing photo. (d) Alternative: five full-bleed panels; second because it repeats the marque roller's weight. (e) Risk: it must not repeat the roller's layout back to back, so a statement sits between.
**Cut or linked:** mission, vision, letters, full history and directors go to their own pages and are linked from the footer.

## Always start with (added after the Kerala test)
1. **Reference readout** (from a capture, one paragraph): palette, type pair, hero type, section rhythm, photography, motion feel. Say if capture failed.
2. **Kept from the reference / Changed for this client** (two short lists).
3. **Plan checklist line:** no gold, no hairline rows or small labels, no row of equal cards, no filler, three hero options, two or three easter eggs.
