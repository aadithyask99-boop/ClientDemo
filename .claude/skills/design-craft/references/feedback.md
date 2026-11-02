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
