# Call brief template

Two pages for the person calling a lead: (1) the brief with evidence, (2) the call plan and script.

1. Copy `call-brief.json` to `<client-slug>/call-brief.json` and fill it in. Every row needs an evidence tag and a source file or URL: **A** observed (saved screenshot or output), **R** research (link), **H** hypothesis, **N** not checked.
2. Build: `python3 _template/call-brief/build_brief.py <client-slug>/call-brief.json` (needs Playwright + Chromium; set `CHROMIUM_PATH` if needed). Output: HTML, two PNG pages and a PDF in `<client-slug>/assets/`.
3. Before it goes to the caller, a person ticks off the "Check before dialling" list and signs the "verified by" line.
4. Keep contact details in the CRM, never in the repo.
