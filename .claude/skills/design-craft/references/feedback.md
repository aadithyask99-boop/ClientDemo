# Feedback and learning log

This is the memory of the loop. Read it before any job; add an entry after every job. A new chat knows only what is committed here.

## The loop

1. **Before:** read this file, `fingerprints.md`, `checklist.md` and the matching case study.
2. **During:** for each important choice, note it in one line: what I chose, why, and the risk.
3. **After:** run `checklist.md` and Impeccable, show the owner, record their reaction in their words.
4. **Log:** write an entry below. Say what went wrong and why, not only what was done.
5. **Promote:** when the same lesson appears twice, move it out of the log: a rule into `SKILL.md` section 4, a defect into `checklist.md`, a new device into `fingerprints.md`.

## Entry template

```
### YYYY-MM-DD  Site or section  (mode: recreate / inspiration / original)
- Brief: reference given, feeling in three words, what to copy exactly, what to avoid.
- Choices and reasons: 1) ... because ... (risk: ...)
- Impeccable said: findings that were right / findings I overrode and why.
- Checklist said: items that failed.
- Owner reaction (their words): approved / rejected / changed ...
- Mistake and cause: what went wrong and the real reason.
- Lesson: one sentence.
- Promote to: rule / checklist / fingerprint / nothing yet.
```

## Entries

### 2026-11-02  Setup of this skill  (mode: n/a)
- Owner's stated pattern from earlier attempts: designs came out boxy and generic, with too many headline titles and unnecessary gradients. They could not remember why specific versions were rejected, so this log exists to capture the reason at the time.
- What worked for them: giving a video, a few screenshots, the reference homepage, and explaining the feeling in their own words.
- Brew More was confirmed as "recreate this reference, nothing more": exact 3D tub idea and typography, Google-style design feel.
- Lesson: the owner's reaction in their own words is the most valuable data. Ask for it, record it verbatim.
- Promote to: SKILL.md section 1 (the brief questions) and section 8.

### 2026-11-02  Review of all approved sites from clips and screenshots  (mode: review)
- Found 5 defects on Garden by looking at the live page (clipped hints, butterflies on text, empty stretches, low-contrast date). None were visible from reading code.
- Found a possible font mismatch on ILE IFE (README says upright only, clip shows slanted accent words).
- Impeccable's detector flagged Garden's Fraunces font as overused; recorded as an approved ignore with a reason.
- Lesson: looking at real screenshots catches defects that code review misses; Impeccable's generic rules can disagree with an approved identity.
- Promote to: `checklist.md` (done) and `SKILL.md` section 6 (done).

### 2026-11-02  Video model choice  (mode: n/a)
- Choices and reasons: default video model is `bytedance/seedance-1-5-pro` at 720p, 6 s, audio off, because it is the cheapest model with first-frame plus last-frame control (about $0.16 per 6 s clip) and it made the approved Halcyon intro. Image default is `bytedance-seed/seedream-5-0-flash`.
- Owner reaction (their words): the four-model A/B test is not needed; "Seedance 1.5 Pro is fine for now".
- Mistake and cause: I first recommended Veo 3.1 Lite as the cheapest and left Seedance 1.5 Pro out of my table. The owner's own look at OpenRouter's displayed prices exposed it. The cause was comparing at different resolutions and not checking the catalog fully. Independent rankings later showed Veo 3.1 Lite is cheap because it ranks near the bottom.
- Lesson: compare prices at the same resolution, read the whole catalog, and do not treat price as quality.
- Promote to: nothing yet. If model choices come up again, the comparison and ranking are in `assets.md`.

### 2026-11-02  Skill was not doing the job end to end  (mode: process)
- What the owner saw (their words): Impeccable does not run automatically and the chat asks whether to run it; the work should be "compiled, done, made, then given to me, and then I'll ask for changes"; it should publish an artifact automatically so they can see it.
- Evidence from the EVM Group chat: it published an artifact, but built the bundle by hand each time, and its handover said "I haven't run Impeccable or the full checklist". It only studied the reference closely after the owner pushed back.
- Cause: the skill phrased Impeccable as "if installed" and "ask", added two owner checkpoints and a "wait for approval", and had no single gate saying a job is not finished until the checks run and the artifact exists. Nothing forced the last steps.
- Fix: removed the checkpoints and approval waits; Impeccable and the checklist are mandatory and automatic; added `scripts/bundle-preview.mjs` and a definition of done (SKILL.md section 10) with a fixed handover format; put the same rule in the root `CLAUDE.md` so it applies even if the skill is not opened.
- Check on the bundler: the first build had Orra's name mask pointing at a missing file because an inline `style="--house: url(img/house.webp)"` resolves against the stylesheet, not the page; the bundler now copies such files under `assets/` too. Lesson: verify a bundle on a local server for 404s before publishing.
- Lesson: a quality step that is optional or phrased as a question will be skipped; make it a gate in the definition of done.
- Promote to: SKILL.md section 10 (done) and CLAUDE.md (done).

### 2026-11-02  Why reference-led work drifted from the reference (EVM Group vs ESR Bespoke)
- Owner's words: the chat "seems like it's just repeating the same designs and not following the reference"; results used to be really good with just a screenshot and a screen grab, without Impeccable or a skill.
- What I found by comparing the live reference with the build: the build copied parts (roller, statements, plain nav) but not the character. Reference: black and white only, one idea per section, real cinematic footage. Build: a dark two-column list-and-image layout repeated, giant red years and red accents the reference does not have, generated stills in one dusk grade.
- Causes: (1) my one-pass change removed the tight loop that made the old results good, and nothing replaced the owner as the comparer; (2) the reference was studied from small contact sheets, not frame by frame or from its code; (3) Impeccable's taste critique ("text on flat fields, red used only in tiny accents") pulled the build further from the reference; (4) the sameness check and house rules pushed toward "do not copy" even though the owner loved ESR's whole design language; (5) generated stills cannot match real cinematography.
- Fix: SKILL.md section 11 (reference fidelity protocol), a side-by-side comparison tool with at least two rounds, a precedence rule that the reference beats Impeccable's taste, a source-material rule, and checklist item 15.
- Lesson: the owner's fast visual comparison is what produced good results; if the owner is removed from the loop, the build must compare itself against the reference side by side, repeatedly, and not let a design tool's taste override the reference.
- Promote to: SKILL.md section 11 (done).

### 2026-11-02  Overcorrection: copied the reference and dropped the client's content (EVM Group again)
- Owner's words: it "just replicated everything" and "did not try to use logic to add content from the other client website"; it "removed some bits"; what it should do is understand the reference, replicate it, then come up with new solutions or designs for the leftover content in the same design language. It "did a decent job, but it wasn't perfect".
- Evidence: the latest build, rebuilt "to the ESR section map", has Intro, Hero, Statement, Marques, History, Footer. Sectors, Directors and Testimonials from the earlier version are gone, although the Sectors data is still in the data file.
- Cause: my section 11 told it to match the reference's section map, keep the same number of distinct compositions and add no devices the reference lacks. It had no content inventory and no step for content without a counterpart, so it dropped what did not fit.
- Fix: section 11 rewritten as two jobs (replicate the design system and signature moments; solve the client's content in that language), with a design-system step, a content inventory, a mapping step with new sections derived from the reference's vocabulary, and a comparison that checks both fidelity and content completeness. Checklist item 16 added.
- Lesson: fidelity rules need a counterweight that protects the client's content; "match the reference" must mean match its language, not its section list. I swung from too different to too literal; check both sides of a rule.
- Promote to: SKILL.md section 11 (done), checklist 16 (done).



### 2026-11-02  Third swing: pasted the whole About page onto the homepage (EVM Group)
- Owner's words: it "took literally all the content ... and just pasted it there without thinking and making it better, removing unnecessary stuff"; "looks cluttered and looks so bad"; instead of becoming easier it became complicated. Also: the home and About pages were crawled "for the AI to understand more of the website", not to add everything from About onto the homepage.
- Evidence: the latest build has 13 sections, 2,023 words (reference 319, 6.3x), 12 sections measured against 7, and a page 2.9x the reference's length, including the mission, vision, chairman's letters, a decade-by-decade timeline and a list of every director.
- Cause: the instruction I gave the chat ("put ALL of EVM's content back", plus "nothing that matters is dropped") and my skill's inventory step. I fixed the dropped-content failure and created a pasting failure; nothing said to curate, nothing said that other pages are only for understanding, and nothing measured size against the reference.
- Fix: section 11 rewritten shorter as four rules (copy the language; curate, do not paste, with size limits; design the leftover content in the same language; compare); the comparison tool now prints length, word and section ratios and warns; checklist item 16 now means curated, not pasted; other pages are for understanding only.
- Lesson: I swung between two extremes by adding rules each time. A rule that protects the client's content needs a rule that limits it, and a fidelity rule needs a measurement. Prefer a short principle with a number that can be checked.
- Promote to: SKILL.md section 11 (done), checklist 16 (done).

### 2026-11-03  Curated but plain: copied the look, not the motion (EVM Group vs ESR Bespoke)
- Owner's words: it looks a bit plain, it does not have the smoothness or the interactions expected, some sections look plain and unfinished.
- Evidence (measured): length 1.3x and 314 words against 319, so curation worked. But `motion-probe.mjs` shows 14 elements moving with scroll against the reference's 271 (5%), and 8 of 10 sections with no motion at all. Code: the reference uses about 54 `.to`, 22 `fromTo`, 20 timelines, 38 staggers, 3 scrub, 3 pin, SplitText and pointer handlers; the build has 4 `.to`, 1 `fromTo`, 1 timeline and no ScrollTrigger, scrub, pin, SplitText or pointer handler. The reference has 18 canvases and 3 videos; the build has none and 1. One wheel notch: reference 216 px after 60 ms and 396 after 360 ms; build 103 and 309 (a slower, floatier smooth scroll). Sections that read as unfinished: a small sentence in an empty white screen where the reference sets a large statement, a sectors list, a milestones list, one small quote, a careers one-liner.
- Cause: the rules measured how the page looks (stills, length, words) and never how it moves; "study the reference's motion" had no check, so the chat did Lenis plus one intro. The curation rule was read as "make everything smaller", which left sections sparse with no focal element.
- Fix: rule 5 in section 11 (motion spec; `motion-probe.mjs`: at least 70% of the reference's scroll motion, no section without motion, similar wheel response; no plain sections, every section gets a focal element at the reference's scale and one deliberate motion); checklist item 17; the probe is part of the definition of done for reference-led work.
- Lesson: if a quality cannot be measured, it gets skipped. Curation reduces how much is shown, not how well each part is made.
- Promote to: SKILL.md section 11 (done), checklist 17 (done).

### 2026-11-03  Owner wants a plan before the build, for sections the reference does not cover
- Owner's words: before the AI builds the sections that must be designed beyond the reference, it should say what it intends to build, so they know what to expect before tokens are wasted; describe the content and design flow for the parts not on the reference; base it on the client's current design, the reference design and the websites we already built (all unique), and use real thinking.
- Change: one deliberate checkpoint, kept separate from the earlier rule against asking permission. Section 11, rule 0: present a section plan (`references/plan-template.md`) and wait for "go"; after that run to the end. Added `references/patterns.md` (our own mechanisms by content type) so new sections can borrow proven mechanisms, and five questions the chat must answer for each new section.
- Lesson: the owner does not object to being asked about design direction, only to being asked for permission to do the process. Ask once, about the decision only the owner can judge, and ask it cheaply.
- Promote to: SKILL.md section 11 rule 0 (done), checklist 18 (done).

### 2026-11-03  Assessment of the EVM build after the plan, the motion rule and the stock material
- Owner's question: is this a fair build from the reference, did the chat reason and choose content well, are the new sections good and based on the reference and our own sites, and why are there extra borders here and there?
- What worked (measured): the plan was shown first and approved; 9 sections, 350 words, 10,071 px (1.5x the reference); 212 elements moving with scroll against the reference's 271 (79%, was 5%), no section without motion, a wheel response within about 20 px of the reference; real stock film and CC0 photographs replaced the generated stills; brand logos in the marques tile. The content choice is sound: one short moment per kind of content, the rest archived for linked pages.
- What was wrong: (1) doubled, misaligned borders in two sections (Sectors and Proof): the row's own top border and the list's first-item top border sit about 20 px apart and one line cuts through the first row. Settled measurement: row border at 40 px, first item border at 18 px. The chat's two comparison rounds, its own checks and Impeccable all missed it, because the captures were taken mid-animation and Impeccable reports contrast, not border logic. (2) The new sections (milestones, proof, where next) are built almost entirely from ESR's own patterns (a label, a 40 px paragraph, numbered hairline rows). The written plan names no precedent from our own sites and no alternative for any new section, so the "borrow from our sites" step was not visibly done. I could read the written plan but not the plan message in the chat itself.
- Fix: `motion-probe.mjs` now checks settled sections for doubled hairlines (tested: it flags exactly these two sections on this build and none on the reference); checklist item 19 (settled-state check); the plan must name a precedent and an alternative for each new section and copy them into the section map file.
- Lesson: a visual defect that appears only when an animation has finished needs a check that looks at the finished state; and a required part of a plan must be checked for by name, not left to a template's wording.
- Promote to: checklist 19 (done), SKILL.md rule 0 and plan-template (done).

### 2026-11-03  Owner wants ideas beyond the generic defaults, without handpicking every time
- Owner's words: the weak spot is generic designs (many lines, boxy layouts, gradients, eyebrow headlines); the chat should give ideas rather than the owner saying them; details.so is a curated middle layer over public sites; the chat should reason to pick the right examples and "do a full crawl".
- Finding: details.so has an official MCP (paid) for its full library; its free pages show a small slice per category (less than 1% of 3,400+ examples) with a "Visit website" link to the real site.
- Change: the inspiration funnel (`references/inspiration-research.md`): wide listing of free categories, reasoning with six written criteria, deep study of the top three on their own sites with our capture and motion tools, a shortlist in the plan, pattern cards for the owner's picks. `scripts/inspo-shortlist.mjs` (capped: 3 categories, 8 items, 2.5 s pace, free pages only). `capture-site.mjs` now dismisses most cookie banners and pop-ups. Pattern cards started for Daylight and Understory.
- Tried on the EVM milestones: Daylight captured fully and is a strong candidate (one object per stage on a continuous pinned scene); Understory's stacking mechanism is useful but its coloured boxes are the generic card look; The Art of Documentary stayed covered by a late newsletter pop-up.
- Lesson: "full crawl" should mean deep where it matters, not everything; reasoning needs written criteria; a still cannot judge motion.
- Promote to: `inspiration-research.md` (done).

### 2026-11-03  Colour pairing and three more inspiration sites
- Owner's words: nice designs should still be based on the core idea; colour combinations matter (white with blue, white with burgundy look professional, contrast helps); the skill should understand contrasting colours and suggest accordingly. Also shared originkit.dev, daisyui.com and kexsio.com/animations as possible free inspiration with MCPs.
- Finding on the sites: all three are component or effect libraries with MCPs, but not free in the way hoped (Originkit's free plan is about 3 copies a day and its paid plans are $79 and $99 a year; Kexsio's MCP needs an account and keys; daisyUI is free and open source but is a Tailwind library that our plain-CSS sites do not use). They are a toolbox for single effects at build time, not a source of design direction; details.so stays primary.
- Change: `references/colour.md` (colour from the client's core idea and the reference's colour rules; roles; contrast; professional pairings; what to avoid; the job steps), `scripts/palette.mjs` (four candidate palettes from a brand colour with contrast checks and an optional HTML preview; `--classics` lists tried pairings), a palette line in the plan, checklist item 20.
- Also: the EVM chat ran the inspiration funnel well on its own (nine categories read, eight real sites resolved, seven studied, a shortlist and alternative per new section, ideas rejected because they broke the reference's black and white). The "3 categories" limit is now per new section.
- Lesson: colour is part of the core idea and needs both guidance and a measurement; sources of components are not sources of direction.
- Promote to: colour.md and checklist 20 (done).

### 2026-11-03  Pixelated stock media and under-scaled content (EVM Group build)
- Owner's words: lots of white space here and there; the open-licence images and the hero video look pixelated; make sure good quality ones are used when the media is not the client's own.
- Evidence (measured): `media-quality.mjs` shows the hero film is 1440 x 810 enlarged to cover 1440 x 900 (scale 1.11, so upscaled) at about 750 kbps, 19 s in 1.7 MB (very low bitrate for a full-width clip); the full-bleed photographs are scale 0.7 to 0.8 (sharp on normal screens, soft on retina). White space overall matches the reference (56% empty against 58%), so the issue is content scale, not amount of space: the probe's advisory flags about 8 of the build's 10 sections as possibly under-scaled against 3 of the reference's 8 (it is noisy, so use it relatively). Examples: Milestones' right column (216 px tile, one 20 px caption), Proof's 300 px squares with a number and a 14 px caption, Where next's 14 px descriptions.
- Cause: the checklist had no media-quality item, the chat's note says the free stock was 720p and it was re-compressed to 1.8 MB, and nothing measured whether small content sat in large empty areas. The best stock sites were also blocked in this environment (Pexels and Pixabay 403), which pushed it to the low tiers.
- Fix: `references/media.md` (minimums, originals not previews, what to do if the best source is blocked, licences), `scripts/media-quality.mjs`, an advisory under-scale check in `motion-probe.mjs`, checklist items 21 and 22, and a rule in the reference protocol.
- Lesson: sharpness is measurable (scale and bitrate); do not accept a low tier of a free source without saying so, and ask for the file or the domain allowance.
- Promote to: media.md and checklist 21 and 22 (done).

### 2026-11-03  Attention to detail: repeated images, repeated wording and a second navbar (EVM Group build)
- Owner's words: check that text and images are used correctly, with no duplicated images, no repeated sections; they also saw a double navbar (Marques, Sectors, History plus something like a breadcrumb); is the attention to detail there yet?
- Evidence (measured with the new `detail-audit.mjs` on the latest build): 8 distinct image and video files across 10 sections, and 6 of them are reused. The tea terraces of Munnar appear in 5 of 9 sections (two files of the same scene: a tile in section 5, a full-bleed photograph in 6, a tile in 7, the Proof backdrop in 8, a tile in 9); the Kochi nets, a resort tile, a Porsche tile and a cinema tile each appear twice. The hero line and the statement share the same list of businesses ("hotels, plantations, transport and cinemas") and the sectors statement lists them a third time. Navigation: a fixed header with the name and strapline, a plain text list (About, Marques, Sectors, History) over the hero, a Contact button and menu button, a full-screen menu repeating the list, a footer list, and small section labels at the top-left ("Marques", "Our sectors", "Milestones", "Recognition", "Where next") that repeat the nav words and read like breadcrumbs; the destinations /about, /marques, /sectors, /history and /contact are each linked 4 times. A label also sits flush against the top edge of the screen.
- What had been fixed in the same round: the hero film is now 1920 x 1080 at about 3.65 Mbps (it was 1440 x 810 enlarged, at 750 kbps) and nothing is upscaled.
- Cause: the checks measured motion, borders, size and media sharpness but nothing measured variety or redundancy, and ESR's pattern (a plain list, a button and corner labels) was copied together with the client's own repeated "see all" links, which made it redundant on a page with more links. With only eight images for nine sections the chat reused them to fill space.
- Fix: `scripts/detail-audit.mjs` (reused files, same-subject alt text, shared wording, numbers in three or more sections, navigation layers and labels, destinations linked many times), checklist item 23, a line in the definition of done.
- Lesson: variety and redundancy need their own check; when source material is short, say so and use fewer sections or fewer image slots instead of repeating the same photographs.
- Promote to: checklist 23 (done).

### 2026-11-03  Replicate-with-my-content jobs (no old site) were not clearly covered
- Owner's question: if a reference is given and no old client site, and the owner mostly wants the reference replicated with their own content and a few colour changes, would the chat still go looking for other section designs?
- Finding: the research funnel was written for new sections only, so it should not run when every block fits, but the text never said it could be skipped; the "curate, never paste" rule was written for content pulled from an old site and could trim the owner's own content; and an explicit colour instruction was not placed above the reference's and the client's colours.
- Change: a path choice at the top of section 11 (replicate or extend), a short slot-map plan for replicate, "when not to run" in the research doc, the owner's explicit colour instructions first in colour.md, and a line in CLAUDE.md.
- Lesson: a rule needs an explicit off switch for the case it was not written for.
- Promote to: SKILL.md section 11 (done).

### 2026-11-03  EVM reads as a copy of ESR although the brief was inspiration, not copy
- Owner's words: the design looks replicated, the process is hectic, and a simple video plus reference plus ideas used to give a better result.
- Evidence: after the detail pass the audit is clean (7 distinct files across 10 sections, no repeated text, one navigation system, destinations linked at most 3 times), and a "Who leads it" people section was added. But the section order and look follow ESR closely: hero film, a 40 px statement, a full-bleed photograph, a brand roller, a black statement with numbered rows, new sections built from ESR's own patterns, and a giant wordmark footer. EVM's own identity appears as logos, a small red diamond and the footer mark. The owner's recorded brief was "inspiration, not copy".
- Cause: rule 1 told every reference job to copy the language closely; the checks I built (side-by-side, motion match, section map, fingerprints switched off for reference jobs) all reward closeness to the reference; "inspiration" and "recreate" were not separated, and nothing measured the client's identity or distinctness. Building the skill while a job was running also made the process heavy for the owner (merges, pasted prompts, rules changing between rounds).
- Fix: the mode now decides how close to copy; inspiration is the default for "love the design language"; at most half the sections may mirror a reference section; the client's identity at scale in at least two places; the plan marks copy, adapt or new; checklist item 24; similarity checks are a floor, not a goal.
- Lesson: a metric you optimise becomes the target. When every check measures closeness to the reference, the result converges on a copy. Measure what the owner asked for.
- Promote to: SKILL.md section 11, plan-template, CLAUDE.md, checklist 24 (done).

## EVM passed every check and was still plain (2026-11-03)
Owner: the proof section (three white boxes on red) had no character, layouts repeated, some sections were filler; details.so mechanisms (line and node, squares over a photo) were too small to give emotion. Cause: every check counts something (length, motion, text repeats, contrast); none judges plain versus alive, and the plan listed sections but never asked for one idea carrying the page. Fix: the plan must name the spine first (SKILL.md section 11), filler sections are cut or rebuilt, and the builder looks at each section and reports honestly. Lesson: borrowed mechanisms are parts, the spine is the design; counts never replace looking.

## The hero is what makes a site unique (2026-11-03)
Owner: the hero gives the first impression and is what makes a site unique; offer options (3D, interactive, WebGL, animated, video) instead of one default. Fix: `references/hero-options.md` and a plan step offering three hero options. Lesson: give the owner a choice at the highest-leverage point.

## EVM Group v2 in a fresh folder (evm2): plan first, then one pass (2026-11-03)
- Owner's brief: new Astro site `evm2/`, inspiration from esrbespoke.au, immersive and smooth, nothing boxy, plan first with three heroes and the one idea; then "go" with hero 1.
- What worked: naming the spine before any section (a road through Kerala) and making it a live instrument (rail, headlamp, kilometre readout) so every section had a reason; a procedural WebGL hero; measuring ESR's page (6,670 px, 320 words) before building.
- Mistakes: first pass was 22.7 viewports long (2.7x ESR): tracks were too generous, trimmed to 16. A CSS `transform` on an element gsap animates made the hero headline tween a silent no-op; found only by looking at a screenshot. A bash heredoc edit was blocked once by a safety check that misfired (no `rm` in it); redoing the edits with the Edit tool worked.
- Blocked inputs: live site (expired certificate, then 503), Wayback (host blocked), Pixabay (key returned 401). Content came from the earlier build and is labelled as needing confirmation. The owner's pasted Pixabay key was not written to any file (no age private key in the session to encrypt it into `secrets/env.age`).
- Impeccable: real findings fixed (leading, tracking, one contrast); hairline "cramped padding" and headlamp glows overridden because they are deliberate.
- Lesson: when sources are blocked, say so early and proceed from what the repo already holds; do not chase workarounds that bypass the environment's rules.

## evm2 invented its own look and used banned devices (2026-11-03)
Owner: the new chat's EVM build had weird colours that did not match, odd artifacts, hairlines, eyebrow labels and headlines (all banned), bad typography, and took little from the reference. Cause: my inspiration rule said what to change but not what to keep, so the chat invented a palette (green-black, tea green, red) and typeface; the skill contradicted itself (hard rules praised hairline lists, the reference uses labels); probes and audits passed because they cannot see ugly colour or wrong type. Decision (owner): hairline rows and small labels are banned outright in every mode. Fix: ban in section 4, keep and change lists for inspiration, a two grounds plus one accent limit, a side-by-side look before handover, checklist 27. Lesson: state what to keep as clearly as what to change.

## I banned glass panels without being told (2026-11-03)
I wrote "leave the glass panels" for the owner's motionsites picks. The owner never said that, and approved Halcyon has glass cards. Corrected. Lesson: do not turn my own dislike into a rule; only record what the owner said or approved, and mark inferences as inferences.

## Kerala, after dark (kerala/): inspiration from reddottours.com (2026-11-03)
- Owner's brief: homepage concept for keralatourism.org, fresh Astro folder, love Red Dot's design language, immersive and smooth, nothing boxy, culture and heritage, own words, no pixelated images, ink reveal with Kathakali; plan first with three heroes and the one idea, then merge to main. Owner answered the plan with "fused recommendation".
- Spine: one night of Kathakali, dusk to dawn, lit by a single lamp; the cursor is the flame. Hero: ink curtain lifts to reveal a Kathakali face, then the lamp lights it. Sections: statement, arts list with ink wipes, pinned face-painting in four ink-wiped stages, Pooram night, gable-shaped house windows, kasavu woven gold border, dawn, footer with a giant Malayalam mark.
- Choices: kept Red Dot's serif and grotesk feel, cream and dark grounds, huge centred list; changed subject, imagery, hero, accent (kasavu gold); no italics (gold accent word), no labels or hairlines. Cormorant + Instrument Sans because Red Dot's fonts are licensed.
- Sources: Pixabay returned 400/403 even with the proxy; Wikimedia Commons worked and has 3000 to 8000 px photographs with licences. Built contact sheets (`sheet.mjs` idea: search API, thumbnails, montage) to choose images by eye; 0 upscaled files.
- Mistakes: (1) a CSS background on the canvas made the ink erase do nothing (looked like a long black screen); (2) CSS `transition: opacity` on an element gsap tweens left it at opacity 0; (3) a header-tone rule built from ScrollTrigger toggles broke over pinned sections, replaced with a point probe under the header; (4) `[data-tone='dark'] .gold` also matched when body was dark and turned gold on cream low-contrast; (5) a specificity clash kept list text dark on photos; (6) two safety-check misfires on bash commands that held no removal, redone with the edit tool.
- Impeccable (built page): flagged ghost-state statement words (intended scrub state), organic clip-path (the ink blobs are the signature, kept), repeating-stripe gradient (kasavu thread, kept), a real low contrast on the dawn headline (fixed with a darker tint), and a straggler (fixed with text-wrap). Media check: 0 upscaled; detail audit: one wording flag caused by the pin spacer, arts links reduced from 7 to 0.
- Not run: motion-probe and compare-sheets against the reference (no time in this pass), real phone test.
- Lesson: when the stock source is blocked, a licensed archive with API metadata (Wikimedia Commons) gives larger, better originals than stock sites; always look at a contact sheet and record author and licence in the build.

## Owner dislikes gold (2026-11-03)
Owner: "not a fan of gold colour so hard pass." Earlier approved sites used gold (Garden thread, DJ ESKA wordmark); that is history. Rule added to SKILL.md section 4, colour.md, checklist 29; the black-and-gold candidate was removed from palette.mjs.

## Kerala Tourism: spine erased the reference (2026-11-03)
Owner: the Kerala build did not look at the Red Dot reference well. Findings: Red Dot is airy and photograph-led with a warm film hero, light serif mixing upright and italic words, big centred lists and photo mosaics; the build kept the serif/sans pair, the centred list and nav, then invented a dark lamp-black and gold theatrical mood, used gold on a word in every headline (the gold ban was merged after the chat began), and had a filler section (heading and paragraph between thin bars) and a three-equal-card row. Cause: the skill demanded a spine but not a capture-backed readout of the reference, so the spine replaced the reference. Fix: plan opens with a readout, kept and changed lists and a checklist line (SKILL.md section 11, plan-template.md, checklist 30). Liked in it (by inference): ink-reveal hero with a lamp cursor, the arts list with image wipes, the pinned painting-a-face story, the full-bleed festival night, the giant footer mark.

## A new chat cannot inherit judgement, so we split the critic out (2026-11-03)
Owner: the key is that a new chat must be able to think critically like this one. A document cannot transfer reasoning, and a builder reviews its own work too kindly. Fix: `references/owner-taste.md` (evidence-based likes, hard passes, unknowns) and an `owner-critic` agent that reviews the plan and the build as the owner would; the skill requires both reviews. Limit: the critic is only as good as the taste file; update it with every owner reaction.

## Calibration revised my glass assumption (2026-11-04)
I had assumed glass UI was in the owner's taste. In the calibration the owner said no to Facet Glass and Lumora (abstract glass and light shapes with no subject) and loved scenes and living objects (glacier, painterly island, tree, valley, ship, sun). Glass is fine only as a small piece inside a real scene.
Correction after sheet 3: the owner also loved Solar Fog, Grid Runner, Pink Rider and Flower Valley (heroes the cursor changes or reveals), so interaction that transforms the first screen is a strong like.

## Second calibration: ratings follow the frame, not the category (2026-11-04)
Of 15 new previews the owner loved 12. Lumora was a no at item 12 and a love at item 37 (the same preview, a different frame), and the Places app mock-up was fine, then no. Lesson: record reactions as evidence about specific executions; do not turn one reaction into a rule about a style. Ask for the reason on strong reactions.

## Kerala 2, God's Own Country (kerala2/): inspiration from reddottours.com (2026-11-04)
- Owner's brief: new Astro folder `kerala2/`, Red Dot as inspiration not a copy, immersive and smooth, plan first and wait, work on `main`; then added tagline "God's Own Country" and the audience (foreign visitors, heritage and culture); supplied Pixabay and Unsplash keys in chat.
- Process: capture-backed readout of Red Dot, owner-critic three rounds on the plan (it caught: off-spine sections, a thin river line and small readout, equal-box planner, mirror count, abstract hero option, mixed photo and paint), plan approved with "go". Spine: a composite fall from Anamudi (2,695 m) to the sea through Kuttanad (-2 m). Hero: touchable mist. Sections: statement, pinned Descent (5 stations with people at work), weather dial (Monsoon, Onam, Theyyam, Winter), sea footer with a one-control planner and a word that fills with water. Three eggs: pookalam, snake boat, kingfisher.
- Sources: Pixabay returned 400 with no key and 401 with the owner's key; the first Unsplash string was a secret, not the access key (401); the second worked. Photos chosen by eye from contact sheets of 30 results per query. Wikimedia was rate limited and not needed.
- Mistakes and real causes: (1) fog recovery drew the fog texture again each frame; source-over accumulates, so the fog went opaque and left contour banding. Fix: a mask of fading stamps, composite fog minus mask each frame. (2) Competing tweens on one altitude value left "-2 m" at the top after scrolling back. Fix: one ticker owns the value outside the pinned range. (3) Pin triggers created out of page order mis-placed later triggers (the numeral hid and showed at the wrong places). Create ScrollTriggers top to bottom. (4) HTML width and height attributes on images beat aspect-ratio, so phone crops were 4:5 and cropped to sky; set height: auto. (5) A trigger-less ScrollTrigger.onUpdate stopped firing after pins were added; use the ticker for fixed spine pieces. (6) A trigger with only a start and end 'max' deactivates at the very bottom; use onEnter and onLeaveBack for latched states.
- Impeccable (built page): real findings fixed (hero text contrast over fog: darker fog, scrims, a text shadow); overridden: cream background (the reference's own ground), ghost-state words and stacked pin text (scrub starting states, content is visible without JS and on phones), dimmed unused route stops (disabled state).
- Not run: a real phone, the Red Dot motion comparison (the probe could not read the reference, 0 elements), a screen reader pass.
- Lesson: draw anything that must fade back from a list of stamps with ages, not by repeated drawing; and every scroll-linked readout needs one owner of its value.

## Kerala 2: the loop rewarded gadgets (2026-11-04)
Owner: the seasons section is brilliant; the hero, statement and footer are good; the Descent's chart and orange dot and the Plan your fall pull-strip are gimmicky and low quality, text is hard to read. Cause: the skill asks for a spine, interactivity and easter eggs, and the critic checked for banned layouts, so the chat expressed the spine as literal widgets (a drop, a river you pull, an altitude chart). The critic even steered the planner from boxes to a one-control slider, which became the gimmick. Nothing asked "would a studio ship this". Fix: a no-gadgets hard rule, a gimmick test in the critic, readable-text rule, checklist 33. Lesson: when a rule pushes for interactivity and a spine, add the counter-rule for taste: atmosphere inside imagery beats widgets.
