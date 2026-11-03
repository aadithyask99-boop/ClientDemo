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

## EVM Group homepage (improve an existing site, 2026-11-02)
- **Mode:** improve existing, inspiration from esrbespoke.au (primary) and forgeautomotive.co.uk (interactivity). Owner confirmed.
- **Mistakes and real causes:** (1) built a second hero (film, then three car panels): I took "three cars" from Forge literally and did not ask what felt redundant. (2) Boxed white nav buttons: I never compared the reference nav up close. (3) Single looped clip and no intro: I read ESR's motion from a contact sheet instead of stepping its recording frame by frame. The real hero is a wordmark that assembles from slices, a fast-cut montage, a typed headline and plain-text nav. (4) Old press photos were 1120 px wide strips and looked soft; generating sharp versions with the press photo as reference (about 2 cents each) kept each model accurate and gave one consistent look.
- **Impeccable said:** detector found two contrast failures (fixed). Design review: the back half was text on flat fields with one repeated row layout, red used only in tiny accents, no onward links. Fix applied: pinned list plus large image rollers for marques and sectors, five giant red year scenes, a full-bleed photo break.
- **Lessons (promote if repeated):** study a reference's motion frame by frame before building; make each section carry one image or object, not a text row; use the brand colour at large scale once; generate from the client's own photos as references when brand accuracy matters.
- **Tooling notes:** `gen-media.mjs` needs `NODE_USE_ENV_PROXY=1` and a dummy `OPENROUTER_API_KEY` in this cloud setup (the proxy injects the real key). Free stock sites Pexels and Pixabay return 403 here; Coverr works.

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


## EVM Group homepage, round two: reference fidelity (2026-11-02)
- **Owner's words:** after the second version they said it still looked plain and the nav looked bad; the repo rules then changed so the reference decides. Task: apply section 11 to the EVM homepage.
- **What I did:** stepped the ESR intro at 5 frames per second at full size, read its computed type values and column positions, wrote `references/clients/evm-group-section-map.md`, rebuilt every section to it (black and white only, three columns at 32, 380 and 960 px, statements 40px, marques 92px with a sticky square tile, numbered rows, one footer wordmark), and compared with `compare-sheets.py` three times.
- **Real mismatches the comparison found:** (1) a black bar behind the header (the dark theme colour applied to the header element); (2) footer wordmark too high; (3) phone: no logo and Contact until scroll, headline too low, marques list too large and tile hidden, wordmark not at the bottom. All fixed in rounds two and three.
- **Impeccable said:** detector flagged low contrast on the pale inactive marques (the reference's own colour, #e6e6e6, 1.2:1), tight line height on small labels, a straggler, and 4.47:1 on a grey. Fixed the labels, the straggler and the grey. Lifted the pale list to #d2d2d2 (1.5:1) as a small departure for legibility and kept it otherwise, because the reference uses it on purpose. Accessibility test: tap areas widened to 44px with a pseudo element, menu opens and closes with Escape, reduced motion shows everything with no console errors.
- **Mistakes and real causes:** the previous version added red years, a list-left image-right layout three times and scrubbed words because I followed Impeccable's "add colour and imagery" critique and the house case studies instead of the reference; and I had read the reference from thumbnails. The cure is the order: frames, measured values, section map, build, compare, then defects only.
- **Could not match:** the hero film (ESR uses wide cinematic shots; free stock gives close-ups of Porsche details and night traffic), the geometric ESR wordmark (the EVM mark is a serif italic), and the uppercase labels (owner's rule).
- **Lesson (promote if repeated):** when a reference is loved, extract its section list and measured sizes first and make Impeccable the last step, defects only.

### 2026-11-02  Overcorrection: copied the reference and dropped the client's content (EVM Group again)
- Owner's words: it "just replicated everything" and "did not try to use logic to add content from the other client website"; it "removed some bits"; what it should do is understand the reference, replicate it, then come up with new solutions or designs for the leftover content in the same design language. It "did a decent job, but it wasn't perfect".
- Evidence: the latest build, rebuilt "to the ESR section map", has Intro, Hero, Statement, Marques, History, Footer. Sectors, Directors and Testimonials from the earlier version are gone, although the Sectors data is still in the data file.
- Cause: my section 11 told it to match the reference's section map, keep the same number of distinct compositions and add no devices the reference lacks. It had no content inventory and no step for content without a counterpart, so it dropped what did not fit.
- Fix: section 11 rewritten as two jobs (replicate the design system and signature moments; solve the client's content in that language), with a design-system step, a content inventory, a mapping step with new sections derived from the reference's vocabulary, and a comparison that checks both fidelity and content completeness. Checklist item 16 added.
- Lesson: fidelity rules need a counterweight that protects the client's content; "match the reference" must mean match its language, not its section list. I swung from too different to too literal; check both sides of a rule.
- Promote to: SKILL.md section 11 (done), checklist 16 (done).


## EVM Group homepage, round three: ESR's design system carrying all of EVM's content (2026-11-02)
- **Owner's words:** "You copied the ESR section list and dropped the client's content. Keep ESR's design system and signature moments, and put ALL of EVM's content back."
- **What I did:** content inventory first, from the old site's pages, its public data endpoints (`/api/brands`, `testimonials`, `achievements`, `awards`) and the contact blocks inside its script bundle (the data were not in the rendered pages). Then the section map (13 sections: 6 replicate ESR, 7 new from ESR's own type, grid, colour and motion: numbers, mission and vision, chronicle with a sticky decade, letters, a people roller, recognition rows, a testimonials reader, contact and careers on the sign-up field style). Compared with `compare-sheets.py` twice, plus my own screenshots of the sections the capture tool stops short of (it keeps 14 screens).
- **Real mismatches the comparison found:** black letterbox bars in a source clip showing as a dark strip at the top of the hero; white headline unreadable over a bright shot (regraded darker); the capture tool cannot see past 14 screens, so the reader, contact and footer needed separate screenshots.
- **Impeccable said (defects only, all fixed):** dim label colours on black below 4.5:1, form placeholders 3.5:1, a white form button on white (the browser's dark-scheme default), tight line height in history rows, a skipped heading level, headline shadow needed over the film. Kept deliberately: the pale inactive marques (ESR's own style, lifted to #d2d2d2).
- **Mistakes and real causes:** the previous round dropped Sectors, Directors, Testimonials, awards, history and contact to fit the reference's section list. Cause: I treated the reference's page as the template instead of its design system. The cure is the order in section 11: design system, content inventory, then map each content block to a reference section or a new one.
- **Lesson:** inventory the client's whole site before touching the reference's layout. If the page is a Single Page App, read its data endpoints and bundle for content the rendered pages hide.
- **Cut and why:** duplicate slides; the sector EUROREPAR (no content); brand descriptions that were test filler; the old counters' typos fixed; messages shown as the excerpts the site itself shows.


### 2026-11-02  Third swing: pasted the whole About page onto the homepage (EVM Group)
- Owner's words: it "took literally all the content ... and just pasted it there without thinking and making it better, removing unnecessary stuff"; "looks cluttered and looks so bad"; instead of becoming easier it became complicated. Also: the home and About pages were crawled "for the AI to understand more of the website", not to add everything from About onto the homepage.
- Evidence: the latest build has 13 sections, 2,023 words (reference 319, 6.3x), 12 sections measured against 7, and a page 2.9x the reference's length, including the mission, vision, chairman's letters, a decade-by-decade timeline and a list of every director.
- Cause: the instruction I gave the chat ("put ALL of EVM's content back", plus "nothing that matters is dropped") and my skill's inventory step. I fixed the dropped-content failure and created a pasting failure; nothing said to curate, nothing said that other pages are only for understanding, and nothing measured size against the reference.
- Fix: section 11 rewritten shorter as four rules (copy the language; curate, do not paste, with size limits; design the leftover content in the same language; compare); the comparison tool now prints length, word and section ratios and warns; checklist item 16 now means curated, not pasted; other pages are for understanding only.
- Lesson: I swung between two extremes by adding rules each time. A rule that protects the client's content needs a rule that limits it, and a fidelity rule needs a measurement. Prefer a short principle with a number that can be checked.
- Promote to: SKILL.md section 11 (done), checklist 16 (done).

## EVM Group homepage, round four: highlight reel, not an archive (2026-11-02)
- **Owner's words:** "Your last build pasted the client's whole About page onto the homepage. The homepage must be a curated highlight reel about the size of the ESR reference."
- **What I did:** measured ESR with the updated tool (6,870 px, 319 words, 7 sections), set limits, then kept ONE short moment per kind of content (story, brands, history, awards, people, testimonials), rewrote long text into one line each and turned everything else into a labelled link. Full content moved to `src/data/archive.ts` for the linked pages. Result: 9,044 px (1.3x), 314 words (1.0x), 9 sections, no length or word warnings. Compared with `compare-sheets.py` three times in clean capture folders.
- **Real mismatches the comparison found:** the first curated pass was under the limits but too thin (7,586 px, 7 sections) against the owner's aim of 8 to 9 sections and about 10,000 px, so a second photograph and a careers line were added; leftover strips from an older capture made the sheet say 14 screens (cause: the capture tool does not clear its folder; use a fresh `--out` each round); two links said the same thing.
- **Impeccable said:** only the ESR-style pale inactive list (kept) and a one-word last line (fixed).
- **Mistakes and real causes:** I treated "put ALL the content back" as "put every block on the homepage". The homepage is a hub: its job is to make people click through. Cause: I read the client's About page as content to place instead of material to understand.
- **Lesson:** decide the homepage's word budget from the reference before choosing content, and give every block outside it a destination page.

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


## EVM Group homepage, round five: plan first, then motion that matches (2026-11-03)
- **Owner's words:** after the plan, "use the stock videos, pictures" and "the images showing on the subsequent [marques] are actually wrong ... it would be better to just show the brands, for example Nissan's logo ... proceed with your idea."
- **What I did:** read the reference's page script (not just its look): Lenis lerp 0.1, `expo.out` and `power4.out` eases, about 41 tweens, 20 timelines, 3 pins held at "top top" without spacing, active-item triggers at centre; wrote the motion spec; built every section with one focal element and one scroll-linked motion (word and letter reveals, scrubbed photo inset, a pinned odometer for the years, counters, a tile that follows the pointer). Replaced every generated still with CC0 photographs and free stock film; replaced the marques tile with brand logos (Simple Icons).
- **Measured:** `motion-probe.mjs` 213 elements moving with scroll against 271 (79%, was 5%), no section without motion, wheel-notch curve within about 20 px of the reference. `compare-sheets.py`: 10,071 px (1.47x), 350 words, 9 sections, no warnings, two clean rounds.
- **Real defects the checks found:** split words lost their spaces (inline-block swallows trailing space), which also made statement lines break differently from the measured ones; pinned milestones left two captions visible when the page was scrolled fast; the odometer clipped the neighbouring digit's top; the page was 1.7x long until the pinned scene was shortened. Impeccable's contrast flags were animation start states, verified to reach full opacity after scrolling.
- **Lessons:** (1) motion presence is only measured when it is scroll-linked; one-shot reveals that finish before the probe samples do not count, so use scrubbed word or letter reveals for text; (2) after splitting text into lines, set `white-space: nowrap` on each line or `text-wrap: pretty` re-wraps it; (3) for brand lists use the brand's logo, not a picture of a car (generated cars did not match the brands); (4) free sources that worked here: Coverr (video), Openverse with `license=cc0,pdm` (stills), Simple Icons through jsDelivr (logos); Pexels, Pixabay and Unsplash return 403 from the cloud container.

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


## EVM Group homepage, round six: plan v2, palette line, new sections (2026-11-03)
- **Owner's words:** "The plan v2 for Milestones, Proof and Where next is approved: go", with a palette line before the build.
- **What I did:** wrote the palette line first (ESR's black and white, EVM red as one small accent, contrast measured), then built the line and node for Milestones (Dieste), white squares over a photograph for Proof (Virugroup) and a line under each link for Where next. Probe, compare twice, Impeccable, checklist 19 and 20.
- **Real defects found by the checks:** `--red` was undefined (I had deleted it when removing the red, so the new accent rendered transparent; the page looked fine without it, only a measurement of the node and fill showed it); a doubled hairline 17 px apart in Sectors (a section border plus the first item's border, found by the probe's new doubled-border check); the page crept to 1.5x the reference with the new stage (trimmed pins and stage height); the squares overlapped on a phone because the scroll drift also ran there.
- **Lessons:** (1) when a design token is removed, grep for its uses before adding something that needs it; (2) the settled state matters: take screenshots after scrolling, and measure computed colours, not only how it looks; (3) any scroll-driven offset needs a phone rule, or items overlap when the layout stacks; (4) `palette.mjs` measures against its tinted ground, so recheck the accent on the page's real white and black.

### 2026-11-03  Pixelated stock media and under-scaled content (EVM Group build)
- Owner's words: lots of white space here and there; the open-licence images and the hero video look pixelated; make sure good quality ones are used when the media is not the client's own.
- Evidence (measured): `media-quality.mjs` shows the hero film is 1440 x 810 enlarged to cover 1440 x 900 (scale 1.11, so upscaled) at about 750 kbps, 19 s in 1.7 MB (very low bitrate for a full-width clip); the full-bleed photographs are scale 0.7 to 0.8 (sharp on normal screens, soft on retina). White space overall matches the reference (56% empty against 58%), so the issue is content scale, not amount of space: the probe's advisory flags about 8 of the build's 10 sections as possibly under-scaled against 3 of the reference's 8 (it is noisy, so use it relatively). Examples: Milestones' right column (216 px tile, one 20 px caption), Proof's 300 px squares with a number and a 14 px caption, Where next's 14 px descriptions.
- Cause: the checklist had no media-quality item, the chat's note says the free stock was 720p and it was re-compressed to 1.8 MB, and nothing measured whether small content sat in large empty areas. The best stock sites were also blocked in this environment (Pexels and Pixabay 403), which pushed it to the low tiers.
- Fix: `references/media.md` (minimums, originals not previews, what to do if the best source is blocked, licences), `scripts/media-quality.mjs`, an advisory under-scale check in `motion-probe.mjs`, checklist items 21 and 22, and a rule in the reference protocol.
- Lesson: sharpness is measurable (scale and bitrate); do not accept a low tier of a free source without saying so, and ask for the file or the domain allowance.
- Promote to: media.md and checklist 21 and 22 (done).

