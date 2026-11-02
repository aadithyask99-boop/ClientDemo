---
name: design-craft
description: How to design and build websites for this owner's client demos and freelance portfolio. Use before designing, rebuilding or restyling any site, landing page or section, or whenever the user shares a reference (video, screenshots, homepage) or says "make it like this". Captures the owner's taste, the reference-to-site process, hard rules learned from approved work, and case studies of every approved site in this repo.
---

# Design craft

The owner sells bespoke, fast, distinctive websites and states on their own portfolio: "Nothing generic" and "none of that generic AI-made look". Every site here has been approved. Treat them as proof of the standard, not as templates to copy.

## 0. Where everything lives (one map)

Everything is in this repository (ClientDemo). Nothing is stored outside it, so any new chat that opens the repo has all of it. If a path below is missing, the branch you are on is out of date: say so.

| What | Where |
| --- | --- |
| This skill and entry point (`/design-craft`) | `.claude/skills/design-craft/SKILL.md` |
| Case studies, lessons, defects found (read and add to these) | `.claude/skills/design-craft/references/` |
| Sameness check: one row per site, devices that already repeat | `.claude/skills/design-craft/references/fingerprints.md` |
| Review checklist built from real defects | `.claude/skills/design-craft/references/checklist.md` |
| Feedback and learning log (the memory of the loop) | `.claude/skills/design-craft/references/feedback.md` |
| Image and video generation, budget, key, 3D notes | `.claude/skills/design-craft/references/assets.md` and `scripts/gen-media.mjs` |
| Spend ledger (every generation call, no secrets) | `.claude/skills/design-craft/spend-ledger.jsonl` |
| Impeccable, once installed | `.claude/skills/impeccable/` |
| The approved sites | `<slug>/` at the repo root, each with its own `README.md` |
| Videos and posters of the sites (60 fps clips) | `portfolio/public/work/<slug>.mp4` and `<slug>.webp` |
| Recorder for those clips | `portfolio/scripts/record-demo.mjs` |
| Image generation scripts | `garden/scripts/gen-art.mjs`, `more-coffee/scripts/gen.mjs` |
| Runs commands with the encrypted API key | `scripts/env.sh` |
| Deploy of all demos | `wrangler.jsonc`, `demo-index/index.html` |

**Logging and improving:** after each job, add what was learned to the matching file in `references/` (or a new file), then commit and push. That commit is the memory. A new chat only knows what is committed.

## 1. Decide the mode first

Say which mode the job is in before you design anything. If the user has not said, ask once.

- **Recreate**: "make it like this reference". Success is fidelity: structure, order, typography, motion and the signature idea (for example the 3D product turn). Study first, match first, improve only afterwards. Swap in an original brand, copy and assets.
- **Inspiration**: "use this as a starting point". Work out why the reference feels the way it does, then build something that is not a copy.
- **Original**: no reference. Pick one strong idea (section 3) and commit to it.

**The brief, five quick questions** (ask only what is not already clear): recreate or inspiration? What is the reference (video, screenshots, homepage)? The feeling in three words? What must be copied exactly? What must be avoided? Record the answers in the feedback log.

Most approved work here is reference-led. The owner's usual inputs are a screen recording, a few screenshots and the reference homepage, plus a short explanation of the feeling they want.

## 2. Process for a reference

1. **Study before building.** Watch or step through the recording. Note the page order, pacing, easing, hover behaviour and what happens on scroll. When code is available, read it and record real values (see `more-nutrition/ANIMATION-STUDY.md` for the standard). When the video and the code disagree, the video shows what a visitor saw.
2. **Write down the signature.** One or two things make the reference memorable (a 3D tub, a name hidden behind a building, a vinyl gate). Name them. Keep them.
3. **Rebuild structure and motion**, then replace everything else: brand, copy, imagery, code. Never copy a reference's words, pictures or code.
4. **Make the assets original and consistent.** Anything that must look identical from every angle (a product, a label, type) is rendered or drawn in code, not generated. Photos can be generated, then cut out and keyed cleanly.
5. **Check phone and reduced motion** as part of the design, not after it. Phones get a lighter version, not a squeezed desktop.
6. **Look at the real page** (section 6), then **record what you learned** in `references/` (section 7).

## 3. What makes these sites not generic

- **One through-line idea per site**, repeated with discipline: a thread that stitches down the page (garden), blur to clarity (ILE IFE), a bird that lands as the page (Halcyon), a name that sits behind the building (Orra), jelly hovers and a 3D tub (Brew More), a vinyl gate (DJ ESKA), calm editorial photography (Doves).
- **Shapes come from the subject**, not from a UI kit: embroidered arches and hoops, liquid-fill badges, bubble payment circles, radar tiles, ink-bleed reveals.
- **Type with a reason.** Usually one or two families, chosen for the client, applied with one weight rule. Big, tight headlines are fine when they carry a single highlighted phrase or word, never a gradient fill.
- **Restrained colour.** A small palette sampled from the client's logo or product. The accent is used sparingly (gold only on the wordmark, pills and small marks; orange only as a spark).
- **Motion is layout.** Sections pin, scrub, fade or squash for a purpose. Calm beats busy. Slow easings, long reveals.
- **One dominant element on the first screen.** Seen in every approved site: a giant wordmark (Brew More, Orra, DJ ESKA), a full-bleed portrait or photograph (ILE IFE, Doves), or a single creature (Halcyon's kingfisher). Everything else on that screen is small. Do not fill the first screen with several competing headlines or cards.
- **Real or rendered imagery** in place of stock-looking filler, with generated art held to one shared style prompt.

## 4. Hard rules (learned from approved work and stated by the owner)

- No generic boxy layouts: avoid rows of same-size rounded cards. Use hairline lists, arches, ovals, photography, columns split by lines, or objects with character.
- No headline-heavy walls. Every large headline must earn its space.
- No gradients for decoration. Gradients only where they depict something real (a sunset sky, a glow, a fade into the page colour).
- No small label above a section title (no "eyebrow" labels).
- No italics and no em dashes in page copy, unless the site's own rules allow them (garden is deliberately italic serif).
- Content lives in one data file per site (`src/data/site.ts` or `invitation.ts`) so a new client is mostly one file plus new art.
- Honest placeholders: anything invented (stats, reviews, prices, curves) is labelled as illustrative on the page and listed in the README.
- Respect `prefers-reduced-motion`. Keep the page readable without JavaScript.
- Performance is part of design: avoid full-screen blend modes and animated filters; pre-blur shadows; prefer a pre-rendered video to stitched, filtered stills; load heavy WebGL after the intro.
- Never state a model name in commits or files pushed to a repo.

**Stack defaults** (what every approved site here uses): **Astro** with TypeScript and plain CSS, static output, because it ships very little JavaScript and stays fast (the portfolio measures about 1.0 s largest contentful paint). Add only what the design needs: GSAP (ScrollTrigger, SplitText) for motion, Lenis for smooth scroll on desktop pointers, Swiper for sliders. Use Three.js or canvas only when it is the signature idea (Halcyon's glass and keycaps, Brew More's rendered tub), and load it after the intro so it cannot block the first paint. Keep content in one data file per site. Use another framework only if the client needs something Astro cannot do, and say why first.

## 5. One workflow, two tools

This skill is the single entry point. Impeccable (https://github.com/pbakaus/impeccable, Apache-2.0) is a helper that this skill calls at set moments. The owner should never have to invoke the two separately.

**How it starts:** it loads automatically when the owner describes design work ("rebuild the Orra hero like this video", "restyle the footer"), or on demand with `/design-craft`. Impeccable has its own `/impeccable` commands; use them only as the steps below say.

**Is Impeccable installed?** It is installed at project scope in `.claude/skills/impeccable/` (engine v0.1.18). Check with `test -d .claude/skills/impeccable`; if the folder is missing, do every step except the Impeccable ones and say so in one line.

- The engine binary is not stored in git (it is about 22 MB and platform specific). The launcher `.claude/skills/impeccable/scripts/impeccable` downloads the right one on first use and verifies it against `engine-checksums.txt`. If a session has no network access to download it, say so and review by hand.
- Telemetry is off for this repo (`.impeccable/config.json`). Do not turn it on.
- Its auto-run hooks (a check after every edit and a deep pass on stop) were installed locally in `.claude/settings.local.json`, which is git-ignored. They are not part of the shared setup. Run the checks yourself at step 5 instead.
- Quick check: `.claude/skills/impeccable/scripts/impeccable detect <site>/src`. Without a built page this only runs regex rules, so it undercounts; for the full check scan a built `.html` or the dev server.
- Recorded ignores (deliberate, approved choices) live in `.impeccable/config.json`. Currently: Garden's Fraunces font.

| Step | Who | What |
| --- | --- | --- |
| 1. Brief | this skill | Ask the brief questions and decide the mode (section 1). Read `feedback.md`, `fingerprints.md` and the matching case studies. Run the sameness check (section 8). |
| 2. Study | this skill | Study the reference; look at the real pages (section 6). |
| 3. Context | Impeccable, if installed | If the site has no `PRODUCT.md` / `DESIGN.md`, run `/impeccable init` and seed it from this skill's case study for that site, so per-site context is written once. |
| 4. Build | this skill | Apply sections 3 and 4. |
| 5. Review | Impeccable, if installed | `npx impeccable detect <site>/src`, then `/impeccable critique <section>` and `/impeccable audit` on the parts that changed. If not installed, review against section 4 by hand. Always run `references/checklist.md` on desktop and phone screenshots too. |
| 6. Log | this skill | Write a `feedback.md` entry with the reasons, the mistakes and the lesson (section 8). |

**Precedence when they disagree:** this skill and the owner's approved sites win over Impeccable's generic rules. An approved choice is deliberate (for example garden's italic serif, or a gradient that depicts a sunset). When the detector flags one, record it as ignored with a reason (`npx impeccable ignores add-value <rule> <value> --reason "..."`) instead of changing the site. Accept Impeccable's findings freely when they point at real defects (contrast, spacing, heading levels, accessibility).

## 6. Previewing a site (screenshots and clips)

Look at the real page, not only the code. The live demos are at `https://clientdemo.maximusmediascape.workers.dev/<slug>/` (slugs: `halcyon`, `more-coffee`, `orra`, `ileife`, `djeska`, `doves-uk`, `garden`).

- **Screenshots:** Playwright and Chromium are pre-installed in cloud sessions (`require('playwright')`). Capture desktop (1280x800) and a phone width (390), and check the first screen, a mid-page section and the footer.
- **60 fps clips:** `portfolio/scripts/record-demo.mjs` steps the browser clock 1/60 s per frame, so no stutter. It takes 5 to 15 minutes, so run it in the background. Never stop it with `pkill -f record-demo` (it kills your own shell); kill by PID.

```
node scripts/record-demo.mjs <slug> <url> [--length 18] [--start 6] [--scroll 4200] [--gate "click to open"] [--sync-video] [--fps 60]
```

Settings used for the current clips: doves-uk `--start 3.5 --scroll 4800`; ileife `--start 4 --scroll 4800`; orra `--start 5 --scroll 5200`; more-coffee `--start 4 --scroll 5200`; djeska `--start 4 --gate "click to open" --scroll 4800`; halcyon `--length 20 --start 8 --scroll 5200 --sync-video`. `--start` is how long the site's own loader gets before scrolling; `--gate` is for an enter screen; `--sync-video` is for an intro that is a `<video>`. Look at a contact sheet of the frames in `/tmp/record-<slug>/` before trusting the result.

## 7. Keep the library growing

After each site or major section, add or update a short file in `references/`:

- Mode (recreate / inspiration / original) and whether the owner confirmed it.
- The inputs (video, screenshots, homepage) and the signature idea.
- Palette, type, and the through-line.
- What worked, what is weaker, and what to do differently next time.

Index of case studies:

| Site | Folder | Mode | File |
| --- | --- | --- | --- |
| Brew More (protein coffee) | `more-coffee/` | Recreate (confirmed) | `references/more-coffee.md` |
| The Garden (wedding invitation) | `garden/` | Inspiration (inferred) | `references/garden.md` |
| Halcyon (cyber security) | `halcyon/` | Original hero, referenced sections | `references/halcyon.md` |
| Orra (architectural residences) | `orra/` | Inspiration with frame-by-frame sections | `references/orra.md` |
| ILE IFE (facials studio) | `ileife/` | Client mock | `references/ileife.md` |
| DJ ESKA | `djeska/` | Recreate structure of a template | `references/djeska.md` |
| Doves UK (funeral and repatriation) | `doves-uk/` | Recreate from client reference | `references/doves-uk.md` |
| Owner's freelance portfolio | `portfolio/` | Original | `references/portfolio.md` |

## 8. The loop (learn, mistake, learn again)

The aim is that each job makes the next one better, and that the reasons are written down, not only the results.

**Before building (sameness check):** read `references/fingerprints.md`. State the new site's typeface, palette, signature idea, first-screen element and motion style. It must differ clearly from every existing site on at least three of those five. If it leans on a device that already repeats (see the list in that file), say why it is right for this client.

**While building (decision notes):** keep one line per important choice in the working notes: what was chosen, why, and the risk. These become the "choices and reasons" in the log.

**Checkpoints with the owner:** I am better at catching defects than at judging distinctiveness, so show the owner two things before building the rest: the direction (reference, signature idea, type, palette, first screen as a sketch or screenshot), then the built first screen. Do not build the whole page on an unchecked first screen.

**After building (review):** run `references/checklist.md` on desktop and phone screenshots, then Impeccable (section 5). Note which findings were right, and which were overridden and why.

**Log:** add an entry to `references/feedback.md` using its template: choices and reasons, what Impeccable and the checklist said, the owner's reaction in their own words, the mistake and its real cause, and one lesson.

**Promote:** when the same lesson shows up twice, move it out of the log. A new rule goes into section 4. A defect goes into `checklist.md`. A new device or a site goes into `fingerprints.md`. Impeccable findings that it caught and the checklist missed also become checklist lines. Commit and push, because a new chat only knows what is committed.

**Assets and money:** generation goes through `scripts/gen-media.mjs` with the $2 budget described in `references/assets.md`. Ask before any run that could exceed the budget, and never ask for a key to be pasted in chat.
