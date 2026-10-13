# Research report template

A descriptive research dossier for the person working the lead (not a script). First person, every claim tagged A / R / H / N, with screenshots and proof.

1. Copy `research-report.md` to `<client-slug>/research-report.md` and fill it in. Image links are relative to the client folder (`assets/...`). Use top-of-page screenshots for long pages, not full-page captures.
2. Build: `python3 _template/research-report/build_report.py <client-slug>/research-report.md` (needs `pip install markdown playwright` and a Chromium; set `CHROMIUM_PATH` if needed). Output: `<client-slug>/research-report.html` and `<client-slug>/assets/research-report.pdf`.
3. The appendix manifest (file, size, SHA-256) is generated from everything in `<client-slug>/assets/`.
4. Before use, a person checks the facts against the evidence files and signs off.
