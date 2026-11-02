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
