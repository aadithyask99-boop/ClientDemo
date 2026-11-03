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

