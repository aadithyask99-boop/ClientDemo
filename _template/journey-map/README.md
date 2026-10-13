# Journey map template (Maximus Mediascape style)

1. Copy `journey.json` to `<client-slug>/journey.json` and fill it in. Tag evidence in the text with `[A]` (audit), `[R]` (research) or `[H]` (hypothesis). Use `[R: short note]` for research with a note.
2. Set the feeling curves in `emotion` (1 = frustrated, 5 = confident). `observed_until` is the last stage index (from 0) that comes from the audit; later stages are drawn dotted as hypotheses.
3. Build:
   ```sh
   pip install playwright            # once; needs a Chromium. In cloud sessions set CHROMIUM_PATH if Playwright has no browser
   python3 _template/journey-map/build_journey.py <client-slug>/journey.json
   ```
   Output goes to `<client-slug>/assets/customer-journey-map.html` and `.png`.
4. Brand tokens live in `_template/brand/brand.css` (red `#e10600`, cream `#f5efe8`, ink `#17090a`; Bebas Neue and Mulish only, no italics). Do not hard-code other colours or fonts.
