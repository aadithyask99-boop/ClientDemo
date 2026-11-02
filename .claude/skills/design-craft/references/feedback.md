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
