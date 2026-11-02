# Brew More: design notes

Draft written from the code, README and commit history. Items marked **(you)** are things only the person who briefed the work can confirm. Please correct anything wrong.

## What this site is

A concept site for a fictional protein iced-coffee brand. It is **reference-led**: the page order, pacing, easing and micro-interactions were studied from a screen recording and a live site (a matcha-protein brand), documented in `../more-nutrition/ANIMATION-STUDY.md`. The brand, tub, label, copy and every image are original. The result is a motion study of a premium direct-to-consumer landing page.

How it was made, in the order it happened: study the reference closely, rebuild its structure, then swap in an original brand and original assets. That process is the thing to repeat.

## The feeling

Warm, tactile, a little cheeky. Think a coffee-shop notebook and a good packaging shoot, not a tech startup. Things feel like physical objects: a tub you can turn, polaroids you can nudge, buttons that squash like jelly. Hand-drawn notes keep it human and never perfectly still.

## What makes it not generic

- **Big condensed type, but with a job.** Anton for claims and the logo, Barlow Condensed for everything else. Headlines are huge and tight (line-height around 0.88, negative tracking) and carry a single toffee-coloured phrase, never a gradient.
- **Real objects instead of boxes.** The tub, flavour tubs and sachets are *rendered in three.js* (200-frame scroll sequence, 23-frame hero turn), so the label is identical from every angle. Photos are candid shots, not stock.
- **Shapes from the product, not from a UI kit.** Fact badges are circles that fill like liquid. Payment methods are overlapping circles, offset like bubbles. A curved ribbon of text scrubs along a path. Thick white curved strokes swoop behind the content like spilled milk.
- **Hand-drawn layer.** Signatures, arrows, underlines and circled words are SVGs drawn twice, with the second copy "boiling" in 7-step 1px jitters. Handwriting font is Reenie Beanie.
- **One motion language.** Four named easings used everywhere; the elastic one drives buttons, pills and stickers, the soft one drives text. Hover is always the same jelly recipe: squash, tilt, lift, bounce back.
- **Warm paper palette.** See tokens below. Nothing is cold or neon.

## Tokens

| token | value | use |
|---|---|---|
| `--oat` | `#f1e8d8` | page background |
| `--caramel` | `#d9b98e` | hero, cards |
| `--espresso` | `#3a2113` | text, buttons |
| `--toffee` | `#c9793b` | the one highlighted phrase per heading |
| `--orange` | `#f39a3d` | stars, small accents |

Scale: everything is in `em`; 1em = 16px at 1440px wide and the whole layout scales with the window. Phone designs use their own design widths (390, 550, 640).

## Rules this site follows

1. One highlight colour phrase per heading, never a gradient fill.
2. Cards are used sparingly and are *objects* (a polaroid with a white border and shadow, a statement card with a smiley badge), not generic rounded rectangles.
3. Every decoration is related to the product: beans, cookies, coffee rings, flavour sachets.
4. Imagery that must be consistent (tub, label, type) is rendered in code, not generated.
5. Motion is part of the layout. Sections pin, fade, scrub or squash, and each has a purpose.
6. Illustrative data (the 3pm energy chart, the Mix your own macros) is labelled as illustrative on the page.
7. Phones get a lighter version (no pinning), not a squeezed desktop.

## Where it is weaker (honest notes)

- The comparison table, review slider and payment row are conventional DTC patterns; they work because of the type and motion around them.
- Several sections share the same large-headline-plus-handwritten-note pattern. It is on-brand but repeated.
- The `Mix your own` and `3pm test` sections were added later and follow the established system, but were not part of the original reference.
- The fonts, the hero-to-ribbon composition and many interactions mirror the reference by design (see the brief). Treat it as a faithful recreation, not a unique identity. If it ever goes to a client as their own brand, it would need to move further from the reference.

## The brief (from the owner)

- **Recreate this reference, nothing more.** The inputs were a screen recording, a couple of screenshots and the reference's homepage. The goal was a faithful rebuild with an original brand, not a loose take on it.
- **Copied exactly on purpose:** the 3D product idea (the tub that turns and tumbles through a scroll sequence), the typography, and the overall Google-style design feel.
- **Why earlier attempts were rejected:** not remembered. The general complaint across sites was boxy layouts, headline-heavy sections and needless gradients.

## What this means for future work

- For a "recreate this" brief, success is fidelity to the reference (structure, type, motion, 3D idea), not novelty. Study the reference first and match it before improving anything.
- For a "take inspiration" brief the bar is different: extract why the reference feels the way it does, then build something that is not a copy. Ask which one is wanted if it is not stated.
- Always say which mode a project is in at the top of its DESIGN.md.
