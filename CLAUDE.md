# Client Lead Research: Instructions

This repo holds research on leads and clients of Maximus Mediascape. Each lead is researched in its own chat and on its own branch. The main output is a **research report** for the person working the lead (a dossier, not a sales script).

## First rule: always ask before starting
At the start of every chat in this repo, before creating any branch, folder or files, ask the user for:
1. **Client name** (never guess or reuse a previous one).
2. **Website URL** and any social links they already have.
3. **The lead details**: the form text in the lead's own words, where the lead came from (campaign, form, date), and what the form said about being contacted.
4. **Scope** (default: lead, website, Google presence, competitors, gaps, our solution).
Do nothing else until the client name is confirmed.

## Process for a new lead
1. Branch from `main`: `<client-slug>` (lowercase, hyphens). Copy `_template/` to `<client-slug>/`.
2. **Set up the tools** in a new chat with `bash _template/research-report/setup.sh` (installs jev-seo, marketingskills, wappalyzer-next, Lighthouse, Pa11y, Playwright; they do not carry over between chats).
3. **Collect evidence with tools, not memory.** Follow `_template/research-report/README.md` (tools, commands, what to capture). Save every screenshot and tool output in `<client-slug>/assets/`.
4. **Two-step browsing.** Step 1: the built-in headless browser. For anything blocked, logged in, or empty, step 2: the browser plugin or the user's own signed-in Chrome, if available. If neither works, mark it **N** (not checked) and say why. Never fill the gap from memory.
5. **Write the report** in `<client-slug>/research-report.md` from `_template/research-report/research-report.md`, then build the PDF with `_template/research-report/build_report.py`.
6. **Verify before handing over.** Check every statement against a saved file. Search the draft for strong words ("no", "none", "always", "most", "cannot") and confirm each. Say plainly what is not verified.
7. Optional extras, only when asked: customer journey map (`_template/journey-map/`), call plan and first messages (`_template/call-brief/`).

## Rules
- Work only inside `<client-slug>/` on that client's branch. Never touch another client's folder.
- Use top-of-page screenshots for long pages, not full-page captures. Name files with the date.
- Do not store the lead's phone number or email in the repo. Say "see CRM".
- Commit small and often: `<client-slug>: <what changed>`.
- Do not push to any branch other than the one designated for the session unless the user gives permission.
- Do not open a PR unless asked. Delivered work is merged into `main` (via PR, when asked) so `main` holds every client's folder.
- `main` contains this file, `_template/`, and one folder per client.
- Never paste tokens or secrets into chat; they belong in the environment settings.
- Compliance (UK): sole traders are treated like individuals for marketing messages, and TPS applies to marketing calls. This comes from open-source notes, not a legal source: check the ICO website before relying on it.

## Evidence labels
Mark each claim **A** (observed, with a saved file), **R** (research, with a link), **H** (hypothesis) or **N** (not checked). Say plainly when research is thin. Never present a hypothesis as fact.

## Branding
All client-facing visuals follow the Maximus Mediascape brand in `_template/brand/brand.css`: red `#e10600`, cream `#f5efe8`, ink `#17090a`, Bebas Neue headings, Mulish body; no italics, one size per heading level, no decorative stars or stickers. Reuse the tokens; do not invent new colours or fonts.

## Our offer (confirm before quoting)
Prices and plans come from maximusmediascape.com (checked 13 Oct 2026): Starter from £999 plus VAT one-off (50/50, up to 5 pages); Care £599 a month plus VAT; Growth £999 a month plus VAT plus ad spend (at least £300). Re-read the plan pages at the start of each lead.
