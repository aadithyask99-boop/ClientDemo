# Review checklist (from defects actually found)

Run on screenshots at 1280 wide and 390 wide: the first screen, three mid-page sections and the footer. If the site has an entry gate, click it first (Garden: `#seal`, DJ ESKA: "Click to open"). Tick or note each.

1. **Nothing is clipped or covered by fixed UI.** Dock buttons, nav, players and floating buttons must not sit over text. (Garden dance hint under the dock; Garden cover hint under the thread tails.)
2. **Hints and captions do not collide with decoration.** Check them against ribbons, ropes, badges, illustrations.
3. **Moving decoration never covers text.** Butterflies, petals, cursors, particles stay behind copy or avoid it. (Garden butterfly on a date.)
4. **Contrast.** Script or light text on a light or mid-tone background is the usual failure. (Garden finale date, gold on peach.) Aim for AA on body text and 3:1 on large text.
5. **Small text on phones.** Card and caption text must still read at 390 wide. (Halcyon cards.)
6. **One dominant element on the first screen.** No competing headlines or card rows.
7. **Bare stretches have a reason.** Large empty paper or colour between sections should be intended breathing room, not a layout gap. (Garden desktop journey.)
8. **Overlays do not crush the photo.** (Doves hero overlay is heavy.)
9. **The README and the render agree.** Fonts, weights and rules written down match what is on screen. (ILE IFE italics.)
10. **No horizontal scroll and 44 px tap targets on phones.**
11. **Reduced motion and no-JavaScript:** the page is readable and finished, not blank.
12. **Performance:** largest contentful paint near 2.5 s or better, no full-screen blend modes or animated filters, heavy WebGL loads after the intro.
13. **Placeholders are labelled** on the page and listed in the README (stats, reviews, prices, curves, generated likenesses).
14. **Generated imagery is checked at full size** for realism and artefacts (hands, text, reflections).

When a review finds a defect that is not covered here, add it as a new numbered line.
15. **Reference comparison done.** For reference-led work, `compare-sheets.py` was run at least twice. Sections with a reference counterpart match it in composition, type scale, spacing, colour balance and motion; new sections are recognisably the same family. No layout is repeated more than twice; Impeccable did not add devices foreign to the reference.
16. **Curated, not pasted.** Length is at most 1.5 times the reference, text at most 3 times, sections at most the reference's plus 3. One short moment per kind of content; the rest is linked. Content from other pages that was read only to understand the client is not copied onto the page. Every cut or moved item is listed with where it lives.
17. **Motion matches the reference and no section is plain.** `motion-probe.mjs` shows at least 70% of the reference's scroll motion, no section with zero motion, and a wheel response about as quick. Every section has a focal element at the reference's scale (large type, full-bleed media or a live interaction), not a small sentence in empty space.
18. **The plan was approved before the build.** On a reference-led job the owner saw the section plan, including the design and reasoning for every new section, and said go before anything was built or generated.
19. **Settled-state check.** Look at each section once its animation has finished, not mid-animation. No doubled or misaligned hairlines (`motion-probe.mjs` prints a "doubled borders" warning when two horizontal border lines 2 to 30 px apart overlap), no overlapping captions, no clipped digits or letters, no text under fixed UI.
20. **Colour comes from the client's core idea and reads well.** The palette follows the reference's colour rules and the client's logo and subject, with one accent; every text colour is at 4.5:1 or better on its ground (large type 3:1), checked with `palette.mjs` and on the real page; no decorative gradients.
21. **Media is sharp.** `media-quality.mjs` shows no upscaled image or video and no low-bitrate full-width clip; full-width video comes from a 1080p-or-better source; full-bleed photographs are at least as wide as they are drawn (about twice for retina). Stock and open-licence media was taken at original quality, with sources and licences recorded.
22. **Content is scaled to the reference.** The probe's "possibly under-scaled" count for the build is not clearly above the reference's (more than one extra section); cards and tiles are filled by their content and small captions do not sit in large empty areas.
23. **Nothing is repeated, and there is one navigation system.** `detail-audit.mjs` shows: each photograph appears once (a small tile that reuses a full-bleed photograph counts as a repeat, and so do two photographs of the same scene); each fact is stated once (the hero line, the statement and the section lines do not each list the same businesses); no year or figure runs through three sections; one navigation system (a plain list in the header, a menu button, corner labels that repeat the nav words, "see all" links and a footer list all naming the same destinations read as a second navbar); no destination is linked more than three times; section labels do not repeat a navigation word. Attention to detail means reading the page as a visitor does, top to bottom.
24. **Inspiration is not a copy.** In inspiration mode the plan marks every section copy, adapt or new, at most half are copy, and the client's own identity shows at scale in at least two places. Reading the page cold, someone who knows the reference says "inspired by", not "a copy of".
25. **A spine, no filler.** The page has one subject-rooted idea running through it (SKILL.md section 11, "the spine"); every section is a place on it; no section is just a label, heading and list, three plain boxes, or a repeat of another layout. You looked at each section and said which still feel plain.
