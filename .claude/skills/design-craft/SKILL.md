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
| Capture of an existing site (screenshots, design language, scroll video) | `.claude/skills/design-craft/scripts/capture-site.mjs`, output in `captures/<site>/` (git-ignored) |
| Written audits of client sites (as-is design, decisions, before and after) | `.claude/skills/design-craft/references/clients/<client>.md` |
| Image and video generation, budget, key, 3D notes | `.claude/skills/design-craft/references/assets.md` and `scripts/gen-media.mjs` |
| Spend ledger (every generation call, no secrets) | `.claude/skills/design-craft/spend-ledger.jsonl` |
| Colour guidance and the palette and contrast tool | `.claude/skills/design-craft/references/colour.md`, `scripts/palette.mjs` |
| Media quality rules and the checker for pixelated images and video | `.claude/skills/design-craft/references/media.md`, `scripts/media-quality.mjs` |
| Repetition and redundancy audit (reused images, repeated text, navigation layers) | `.claude/skills/design-craft/scripts/detail-audit.mjs`, checklist item 23 |
| Preview bundler for publishing a built site as an artifact | `.claude/skills/design-craft/scripts/bundle-preview.mjs` (output in `captures/<site>/preview/`) |
| Impeccable (installed) | `.claude/skills/impeccable/` |
| The approved sites | `<slug>/` at the repo root, each with its own `README.md` |
| Videos and posters of the sites (60 fps clips) | `portfolio/public/work/<slug>.mp4` and `<slug>.webp` |
| Recorder for those clips | `portfolio/scripts/record-demo.mjs` |
| Image generation scripts | `garden/scripts/gen-art.mjs`, `more-coffee/scripts/gen.mjs` |
| Runs commands with the encrypted API key | `scripts/env.sh` |
| Deploy of all demos | `wrangler.jsonc`, `demo-index/index.html` |

**Logging and improving:** after each job, add what was learned to the matching file in `references/` (or a new file), then commit and push. That commit is the memory. A new chat only knows what is committed.

## 1. Decide the mode first

Say which mode the job is in before you design anything. If the user has not said, infer it from what they gave you and state it; ask only if you truly cannot tell.

- **Recreate**: "make it like this reference". Success is fidelity: structure, order, typography, motion and the signature idea (for example the 3D product turn). Study first, match first, improve only afterwards. Swap in an original brand, copy and assets.
- **Inspiration**: "use this as a starting point". Work out why the reference feels the way it does, then build something that is not a copy.
- **Original**: no reference. Pick one strong idea (section 3) and commit to it.
- **Improve an existing site**: the client already has a site; make it better, often using a reference for direction. Follow section 9. This is common: the job is not always to build something new.

**The brief, five points** (read them from what the owner gave you; ask only for what is missing and cannot be reasonably assumed, and never ask permission to proceed): recreate or inspiration? What is the reference (video, screenshots, homepage)? The feeling in three words? What must be copied exactly? What must be avoided? Record the answers in the feedback log.

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

**Impeccable is installed** in `.claude/skills/impeccable/`. Use it automatically at the steps below; never ask the owner whether to run it or to install it. If the folder is somehow missing, say so in one line and review by hand.

- The engine binary is not stored in git (it is about 22 MB and platform specific). The launcher `.claude/skills/impeccable/scripts/impeccable` downloads the right one on first use and verifies it against `engine-checksums.txt`. If a session has no network access to download it, say so and review by hand.
- Telemetry is off for this repo (`.impeccable/config.json`). Do not turn it on.
- Its auto-run hooks (a check after every edit and a deep pass on stop) were installed locally in `.claude/settings.local.json`, which is git-ignored. They are not part of the shared setup. Run the checks yourself at step 5 instead.
- Quick check: `.claude/skills/impeccable/scripts/impeccable detect <site>/src`. Without a built page this only runs regex rules, so it undercounts; for the full check scan a built `.html` or the dev server.
- Recorded ignores (deliberate, approved choices) live in `.impeccable/config.json`. Currently: Garden's Fraunces font.

| Step | Who | What |
| --- | --- | --- |
| 1. Brief | this skill | Ask the brief questions and decide the mode (section 1). Read `feedback.md`, `fingerprints.md` and the matching case studies. Run the sameness check (section 8). |
| 2. Study | this skill | Study the reference; look at the real pages (section 6). |
| 3. Context | Impeccable (installed) | If the site has no `PRODUCT.md` / `DESIGN.md`, run `/impeccable init` and seed it from this skill's case study for that site, so per-site context is written once. |
| 4. Build | this skill | Apply sections 3 and 4. |
| 5. Review | Impeccable (installed), automatic | `npx impeccable detect <site>/src`, then `/impeccable critique <section>` and `/impeccable audit` on the parts that changed. Run these yourself, every job, without asking. Only if `.claude/skills/impeccable/` is missing, review against section 4 by hand and say so. Always run `references/checklist.md` on desktop and phone screenshots too. |
| 6. Log | this skill | Write a `feedback.md` entry with the reasons, the mistakes and the lesson (section 8). |

**Precedence when they disagree:** (1) the owner's words and the reference they chose, then (2) the owner's approved sites and this skill's rules, then (3) Impeccable. Impeccable is a defect finder, not a designer: accept its findings about real defects (contrast, accessibility, broken layout, performance, heading order) and do not let its taste findings ("too much text on flat fields", "add colour or imagery") add devices that the reference does not have. When the reference is the aim, a critique that says the build is plainer than Impeccable would like is not a defect. Record deliberate choices as ignored with a reason (`impeccable ignores add-value ...`).

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

**Before building (sameness check, for original work and loose inspiration; skip it for recreate and for any job where the owner loves a reference's design language, because there the reference decides, see section 11):** read `references/fingerprints.md`. State the new site's typeface, palette, signature idea, first-screen element and motion style. It must differ clearly from every existing site on at least three of those five. If it leans on a device that already repeats (see the list in that file), say why it is right for this client.

**While building (decision notes):** keep one line per important choice in the working notes: what was chosen, why, and the risk. These become the "choices and reasons" in the log.

**No mid-job approvals, except the plan checkpoint in section 11 (rule 0) on reference-led jobs.** Otherwise decide, state the assumptions you made in the handover, and finish the whole job in one pass. The owner reviews the finished, published result and then asks for changes. Ask a question mid-job only when something essential is missing and cannot be guessed (no reference, no URL, no brand to work from).

**After building (review):** run `references/checklist.md` on desktop and phone screenshots, then Impeccable (section 5). Note which findings were right, and which were overridden and why.

**Log:** add an entry to `references/feedback.md` using its template: choices and reasons, what Impeccable and the checklist said, the owner's reaction in their own words, the mistake and its real cause, and one lesson.

**Promote:** when the same lesson shows up twice, move it out of the log. A new rule goes into section 4. A defect goes into `checklist.md`. A new device or a site goes into `fingerprints.md`. Impeccable findings that it caught and the checklist missed also become checklist lines. Commit and push, because a new chat only knows what is committed.

**Assets and money:** generation goes through `scripts/gen-media.mjs` with the $2 budget described in `references/assets.md`. Stay inside the budget without asking; stop and ask only if the job genuinely needs more than the cap. Never ask for a key to be pasted in chat.

## 9. Improving an existing client site

Sometimes the job is not to build something new: the client has a site and the owner wants it better (more interactive, more distinctive, clearer), often with a reference for direction. The homepage comes first.

**Gather (ask only what is missing):** the client's URL; which page to redesign (start with the homepage; other pages you read are for understanding the client, not content to copy onto it); what the owner or client dislikes or wants more of; the reference, if any, and whether to recreate or take inspiration; whether the site must stay on its current platform (for example WordPress or Wix) or may be rebuilt in Astro as a separate demo; anything that must not change (brand colours, logo, legal text, URLs that already rank).

**Steps**
1. **Capture the current site.** Run `node .claude/skills/design-craft/scripts/capture-site.mjs <url> --out captures/<client> --video`. It writes full-page and viewport-strip screenshots at 1440 and 390 wide, a real-time scroll recording with a contact sheet, and `design-language.json` and `report.md` (fonts by amount of text, sizes, weights, text and background colours, headings, nav, libraries, SEO basics, measured speed, other pages found). Look at the screenshots and the contact sheet yourself; do not rely on the report alone. Only capture pages the owner is allowed to review.
2. **Write the as-is audit** in `references/clients/<client>.md`: the design language in plain words (type, colour, spacing, imagery, tone, motion), what works and should be kept, what is generic or broken (run `references/checklist.md` on the screenshots), the SEO basics that must be preserved (title, description, h1 and headings, URLs, structured data), speed numbers, and the first-screen element today.
3. **Run Impeccable on the live page** (automatically): `.claude/skills/impeccable/scripts/impeccable detect <url>` (a URL scan also runs the rules that need a rendered page), then `/impeccable critique` and `/impeccable audit` on the homepage. Note which findings are real: the URL scan gives specific, useful results (for example text over photo overlays at about 2.6 to 2.9:1 contrast) but also some false positives (a "1.0:1" on identical colours is usually hidden or layered text), so confirm each one on the screenshots before acting.
4. **Study the reference** (section 2) and write the signature idea for the improved version. Run the sameness check (section 8) against `fingerprints.md` and against the client's current look; it must be clearly better, not just different.
5. **Present the section plan and wait for the owner's go** (section 11, rule 0): what stays, what changes, what is added, and for new sections the design and the reasoning. After the go, run to the end.
6. **Build the improved homepage** as a separate demo in this repo (a new `<client>/` Astro folder, deployed like the others), not on the client's live site. Keep the preserved SEO items, keep the client's content and brand assets, and say what is placeholder.
7. **Prove it:** capture the new version with the same tool and put before and after side by side (first screen at 1440 and 390, speed, SEO basics, Impeccable and checklist results), then deliver it as in section 10.
8. **Log** in `feedback.md` and update `references/clients/<client>.md` and `fingerprints.md`.

**Rules for this mode:** improve what is weak and keep what works; never remove content that ranks or that the client must keep; speed and accessibility must not get worse; and never present a generated likeness or invented claim as the client's own.

## 10. Definition of done and delivery (one pass, then publish)

A job is **not finished and must not be handed over** until every line below is true. Do all of it yourself, in one pass, without asking the owner anything in between (the only stop is the plan in section 11, rule 0, before the build).

1. **Built** in this repo as an Astro site (a new `<site>/` folder, or the existing one), following sections 3 and 4.
2. **Impeccable run:** `.claude/skills/impeccable/scripts/impeccable detect <built page or live url>`, then `/impeccable critique` and `/impeccable audit` on what you built. Fix every real finding; record any you overrode and why (`impeccable ignores add-value ...` for approved choices).
3. **Checklist run:** `references/checklist.md` on screenshots at 1440 and 390 wide (`scripts/capture-site.mjs` on the preview, or your own Playwright shots). Fix what fails. For reference-led work also run `scripts/motion-probe.mjs <build> --vs <reference>` and fix its warnings, and run `scripts/media-quality.mjs <build url>` and fix every upscaled or low-bitrate item, and run `scripts/detail-audit.mjs <build url>` and remove the repetition it finds (each photograph once, one fact in one place, one navigation system).
4. **Published as an artifact**, so the owner can open it: run `node .claude/skills/design-craft/scripts/bundle-preview.mjs <site-folder> --title "<Name> homepage (concept)"`, then call the Artifact tool with `file_path` = the bundle's `page.html`, `root` = the bundle folder, `files` = the contents of `files.json` (first publish) or `files-update.json` (updates; it also removes stale files), and an `icon` word on the first publish. To update, publish again with the same `url`. The bundler needs to be checked on a local server first: serve the bundle folder and confirm no 404s and no console errors (a missing file shows as a broken page). Over 255 files or 64 MB, publish in parts to the same url.
5. **Logged and committed:** a `feedback.md` entry, case-study or fingerprint updates, committed and pushed to the branch.

**Real client names and branding:** a redesign of a real client's site uses their name, so title the artifact as a concept ("EVM Group homepage concept"), never as the official site, and keep it private (artifacts are private by default). If the Artifact tool refuses, deliver the files and screenshots and do not look for another host.

**The handover message** is the last thing, and it contains: the artifact link first; three lines on what you built and the main design idea; what Impeccable and the checklist found and what you fixed; anything you assumed, any placeholder, and anything not verified (for example not tested on a real phone); the spend if images or video were generated. Then stop and wait for the owner's changes. Do not end with questions such as "should I run Impeccable?" or "should I publish?": those are already done.

**Iteration:** when the owner asks for changes, make them, rerun steps 2 to 5 on what changed, republish to the same url, and give the new handover.

## 11. Working from a reference: copy the language, curate the content

The owner's best results came from giving a reference (screenshots, a screen recording, a homepage) and getting back something that clearly belongs to it, with the client's content in it. Rule 0 is the one place you stop and wait for the owner; after their go, run to the end. Then rules 1 to 5, in this order.

**How close to copy depends on the mode (section 1), and "love the design language" means inspiration unless the owner says recreate, replicate or copy.**
- **Recreate or replicate:** match the reference closely (rule 1 as written).
- **Inspiration:** take the reference's principles (restraint, type scale, spacing, the feel of the motion, the kind of section) but make the page clearly the client's own. At most half of the sections may mirror a reference section one to one; the rest are adapted or new. The client's identity (its colour, subject, imagery, or a device rooted in what it is) shows at scale in at least two places. A stranger who knows the reference should say "inspired by", not "a copy of". Every check that measures closeness to the reference (the side-by-side, the motion match) is a floor for quality and not a goal; do not chase similarity once the page is close in feel.

**First, choose the path** (count the content blocks against the reference's sections, and say which path you are on):
- **Replicate:** the owner gives a reference and their own content, wants it matched, and changes only a few things (some colours, their copy). No client site is needed; the owner's content comes from their message. Map their content into the reference's sections one to one, in the reference's order. Change only what they ask for. **Skip the inspiration research and the curation:** use their content as given, shortened only where a slot's design demands it (and say so). The plan is a short slot map. Ask only if some content fits no slot, and offer the options: a new section (then run the funnel for that section alone), fold it into an existing slot, or leave it out or link it.
- **Extend:** the owner has more content than the reference has sections for, or an existing site is being improved. Rules 0 to 5 below apply in full, and the funnel runs for each section the reference has no counterpart for.

**Offer three hero options first.** The hero is the first impression and the main thing that makes a site feel unique. Before the section list, offer three hero options for this client from `references/hero-options.md` (3D object, scripted film, type with the image, a gate to touch, a transition reveal, a pointer world, film with a moment), each with what the visitor sees, the technique, what it needs, one risk and the precedent from our sites; recommend one. At least one option is interactive or 3D and at most one is a plain film. The chosen hero is where the spine starts.

**The spine comes before the section list (every reference-led or original job, any mode).** The owner wants an immersive, interactive, emotional site: one continuous idea you travel through, not a stack of sections. Every approved site has one (Orra's world, the Garden's thread, DJ ESKA's vinyl gate, Halcyon's glass). A plan with only a list of sections fails. Before the flow, write: **the spine** (one physical, subject-rooted idea that runs through the whole page, for a car dealer group a drive along a road through the state; say what the visitor travels past, what moves, what is 3D or filmed), **why it is this client's own**, and **how each section is a place on it**. Then judge every section with two questions: would the owner remember it, and does it carry feeling? A section that is only a label, a heading and a list, three white boxes with numbers, or a repeat of another section's layout is filler: cut it, merge it into a neighbour, or rebuild it as a moment on the spine. Borrowed mechanisms (details.so, our case studies) serve the spine, they are not a substitute for one. A calm reference such as ESR sets the typography and restraint, never the whole page: the client's spine still has to be added at scale. Look at the finished page yourself, section by section, before delivery, and say honestly which sections still feel plain. Counts and probes cannot tell plain from alive.

**0. Plan first, and wait for the owner's go (the only checkpoint).** After studying the reference and the client's current site, and before building or spending anything, present a short section plan in the format of `references/plan-template.md`: the page's flow, the palette (ground, ink and one accent, from the client's core idea and the reference's colour rules, checked with `scripts/palette.mjs`; see `references/colour.md`), each section with its content, layout, focal element and motion, and, for every section the reference has no counterpart for, the design you propose and why. Think it through against three sources: the client's current design (which brand cues to keep), the reference's design system and patterns, and our own sites (`references/patterns.md` for mechanisms by content type, `fingerprints.md` to avoid sameness, the two or three closest case studies). Give a recommended option and one alternative for each new section, and name the precedent from our own sites that it borrows a mechanism from, plus an inspiration shortlist of two or three real live examples found with the funnel in `references/inspiration-research.md` (a plan without a precedent and an alternative for each new section is incomplete; write them into the section map file too). End with "Reply go, or tell me what to change." After the go, run to the end without further questions; if the owner edits the plan, update it and proceed, do not ask again.

**1. Copy the reference's design language and signature moments closely** (recreate and replicate; on inspiration take its principles, see above). Type, scale, colour balance, spacing, grid, image treatment, motion, and its hero and intro. Study it from full-resolution frames and its own code, never from small contact sheets. Do not copy its words, photos or code.

**2. Curate the client's content; never paste it.** (Extend path. On the replicate path the owner's own content is used as given.) The page you are building is a highlight reel in the reference's rhythm, not an archive of the client's site.
- **Other pages are for understanding.** If you read the client's About page, history, team or news, it is so you understand the client: its story, tone, what is unique, what matters. It is not content to place on the page you are building. The owner asked you to read them to understand, not to copy them across.
- **Size like the reference.** Aim for about the reference's length (at most 1.5 times), about its amount of text (at most 3 times) and its section count plus at most 3. `compare-sheets.py` prints these and warns.
- **One short moment per kind of content** (story, brands, history, awards, people, testimonials). Choose the strongest one to three facts for each, rewrite long paragraphs into one strong line, keep names and numbers exact. A timeline of twenty entries becomes three or four dates. A list of eight directors becomes one line or one image.
- **Everything else becomes a link** ("Our story", "Our people"), not a section. Cut duplicates, filler and typos.
- **Test it:** after thirty seconds of scrolling, can a visitor say what the client is, what makes it special, and where to click next? Does every section make them want to click through? A section that is mostly lists or paragraphs belongs on its own page. Curating means fewer items at full design weight, not smaller type and emptier sections.

**3. Where the client has content the reference has no section for, design it in the reference's own language** (its type, colours, spacing, motion, image treatment) so it looks as if the reference's designer had drawn it. Sections must not repeat a neighbouring layout, and no layout is used more than twice.

**4. Compare before delivering, in stills and in motion.** Capture the build with `scripts/capture-site.mjs` and run `python3 .claude/skills/design-craft/scripts/compare-sheets.py captures/<ref> captures/<build> captures/<build>/compare.png`. Look at `compare.png` and `compare-first.png`, read its length and word warnings, and write one line per section: same composition, type, spacing, colour and motion as the reference, or same family if it is a new section. Look at screenshots taken once each section has finished animating, not mid-animation, and heed the probe's doubled-border warning. Fix and compare again; at least two rounds. Impeccable and the checklist then fix real defects only and must not add devices foreign to the reference (section 5 precedence).

**5. Match the motion, and finish every section.** The reference's motion is part of its design language, and it is a lot of code. Write a **motion spec** from its scripts and recording: per section the entrance, the scroll behaviour (scrub, pin, parallax, colour flips), the hover or pointer response, and the transitions, with its real easings, durations, staggers and smooth-scroll settings, and how it splits and reveals text. Implement that, not just smooth scroll and an intro. Then measure with `node .claude/skills/design-craft/scripts/motion-probe.mjs <build url> --vs <reference url>`. Targets: the build's scroll motion is at least 70% of the reference's, no section has zero motion, and the response to one wheel notch is about as quick as the reference's (tune the smooth-scroll lerp until the curves match). **No plain sections:** a section that is a small sentence or a short list in a lot of empty space is unfinished. Give each section one focal element at the reference's scale (large type, full-bleed media or a live interaction) and one deliberate motion, or cut it. The probe measures presence, not quality, so still look at the motion.

**Steps:** capture the reference at full quality and read its code (record real sizes, colours, easings); write its design system in half a page (type scale, label style, colours, spacing, grid, image treatment, motion, section patterns); list the client's content and mark the highlights; map each highlight to a reference counterpart or a new section in the same language; use source material of the same kind and of good quality (real footage or photography where the reference does, not many same-grade generated stills; sharp, not upscaled: full-width video from 1080p-or-better sources at a good bitrate, photographs at least as wide as they are drawn, checked with `scripts/media-quality.mjs`; rules in `references/media.md`); build; compare; hand over.

**Handover states:** which sections replicate the reference, which are new and how they come from its language, what was cut or moved to another page and where it lives, and what could not be matched.

**If the owner says "it does not look like the reference", the comparison was too forgiving. If they say "you left my content out" or "it is cluttered", rules 2 and 3 were misapplied: it is a highlight reel with links, not an archive and not a copy.** Evidence from EVM Group (reference esrbespoke.au): first it added its own devices; then, told to match, it dropped the client's content; then, told to keep all content, it pasted the whole About page onto the homepage (2,023 words against the reference's 319, 12 sections against 7, 2.9 times the length). The balance is rule 2. Then it was curated well but plain: against the reference the build had 14 elements moving with scroll against 271 (5%), 8 of 10 sections with no motion at all, 0 scrub or pin against the reference's 3 each, and sections that were one small sentence in empty space. Rule 5 is the answer.
