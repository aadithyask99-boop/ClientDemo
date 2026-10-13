# Research report template

A descriptive research dossier for the person working the lead (not a script). First person, every claim tagged A / R / H / N, with screenshots and proof.

1. Copy `research-report.md` to `<client-slug>/research-report.md` and fill it in. Image links are relative to the client folder (`assets/...`). Use top-of-page screenshots for long pages, not full-page captures.
2. Build: `python3 _template/research-report/build_report.py <client-slug>/research-report.md` (needs `pip install markdown playwright` and a Chromium; set `CHROMIUM_PATH` if needed). Output: `<client-slug>/research-report.html` and `<client-slug>/assets/research-report.pdf`.
3. The appendix manifest (file, size, SHA-256) is generated from everything in `<client-slug>/assets/`.
4. Before use, a person checks the facts against the evidence files and signs off.

## Research steps (what to run and capture)
Save everything in `<client-slug>/assets/` with the date in the file name.

| Step | How | Notes |
|---|---|---|
| Website screenshots | Playwright with Chromium, desktop 1366 and mobile 390. Scroll down and back up before the shot so lazy images load. Wait for any "checking your browser" screen to clear | Top-of-page shots for each key page |
| SEO crawl | `jev-seo` (github.com/AgriciDaniel/jev-seo), `bin/jevseo run <url> --no-jev` | Its score is not a quality score |
| Speed | Lighthouse, mobile and desktop | |
| Accessibility | Pa11y with the axe runner | |
| Technology | `wappalyzer-next` (`wappalyzer -i <url> --scan-type fast`) and a look at the page source | GPL-3.0, internal use. Full mode needs a working Playwright browser |
| Tracking tools | Search the page HTML for analytics and pixel tags | |
| Google listing | Google Maps search, signed out; signed in if available | Note it may be a limited view |
| Company records | Companies House search; domain registry (RDAP) for dates | |
| Legal pages | Look for privacy, cookie and terms links | |
| Competitors | Homepage screenshots, technology scan, Google Maps rating | Say how they were chosen and how small the sample is |
| Our offer | Re-read the plan pages on maximusmediascape.com | |
| Keyword demand | Google Ads Keyword Planner API when credentials are set up | Not available until set up |

Anything blocked (Google Search, Facebook, Instagram, Yell and similar) goes into the report as **N**, with the reason.
