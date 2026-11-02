---
name: design-craft
description: How to design and build websites for this owner's client demos and freelance portfolio. Use before designing, rebuilding or restyling any site, landing page or section, or whenever the user shares a reference (video, screenshots, homepage) or says "make it like this". Captures the owner's taste, the reference-to-site process, hard rules learned from approved work, and case studies of every approved site in this repo.
---

# Design craft

The owner sells bespoke, fast, distinctive websites and states on their own portfolio: "Nothing generic" and "none of that generic AI-made look". Every site here has been approved. Treat them as proof of the standard, not as templates to copy.

## 1. Decide the mode first

Say which mode the job is in before you design anything. If the user has not said, ask once.

- **Recreate**: "make it like this reference". Success is fidelity: structure, order, typography, motion and the signature idea (for example the 3D product turn). Study first, match first, improve only afterwards. Swap in an original brand, copy and assets.
- **Inspiration**: "use this as a starting point". Work out why the reference feels the way it does, then build something that is not a copy.
- **Original**: no reference. Pick one strong idea (section 3) and commit to it.

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

## 5. Pair with Impeccable

Impeccable (https://github.com/pbakaus/impeccable, Apache-2.0) supplies generic anti-slop vocabulary and a rule-based detector. This skill supplies the owner's taste and process. Use them in this order:

1. This skill: mode, study, signature idea, rules above.
2. Build.
3. Impeccable as a final pass, when it is installed: `npx impeccable detect <site>/src` for the deterministic checks, then `/impeccable critique` and `/impeccable audit` on single sections. Fix the findings that conflict with section 4 first; treat the rest as suggestions.

Impeccable is not installed in this repo. Ask the owner before installing it, because its installer can add hooks and it sends anonymous telemetry unless turned off (`npx impeccable telemetry off`).

## 6. Previewing a site (screenshots and clips)

Look at the real page, not only the code. The live demos are at `https://clientdemo.maximusmediascape.workers.dev/<slug>/` (slugs: `halcyon`, `more-coffee`, `orra`, `ileife`, `djeska`, `doves-uk`, `garden`).

- **Screenshots:** Playwright and Chromium are pre-installed in cloud sessions (`require('playwright')`). Capture desktop (1280x800) and a phone width (390), and check the first screen, a mid-page section and the footer.
- **60 fps clips:** `portfolio/scripts/record-demo.mjs` (branch `claude/admiring-pasteur-b27yph`) steps the browser clock 1/60 s per frame, so no stutter. It takes 5 to 15 minutes, so run it in the background. Never stop it with `pkill -f record-demo` (it kills your own shell); kill by PID.

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
| Owner's freelance portfolio | `portfolio/` on branch `claude/admiring-pasteur-b27yph` | Original | `references/portfolio.md` |
