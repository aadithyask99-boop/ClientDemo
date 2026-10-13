# Client Website Audits: Instructions

This repo holds website audits for multiple clients. Each audit is done in its own chat and on its own branch.

## First rule: always ask for the client name
At the start of every chat in this repo, before creating any branch, folder or files, ask the user for the **client name** (and the site URL and scope if not given). Do not guess or reuse a previous client's name. Do nothing audit-related until the client name is confirmed.

## Starting a new audit
The user will give: **client name**, **site URL**, and **scope** (e.g. SEO, performance, accessibility, content, UX).

1. Create a slug from the client name (lowercase, hyphens), e.g. `moments-and-memories`.
2. Branch from `main`: `<client-slug>`. Follow-up rounds: `<client-slug>-<yyyy>-q<n>`.
3. Copy `_template/` to `<client-slug>/`.
4. Fill in `README.md` (client, URL, date, scope, status), then write findings in `findings.md`.
5. Build the customer journey map: copy `_template/journey-map/journey.json` to `<client-slug>/journey.json`, fill it in, and run `python3 _template/journey-map/build_journey.py <client-slug>/journey.json` (see `_template/journey-map/README.md`). Write it up in `<client-slug>/customer-journey.md` from `_template/customer-journey.md`.

## Rules
- Work only inside `<client-slug>/` on that client's branch. Never touch another client's folder.
- Keep screenshots and exports in `assets/` and reference them from `findings.md`.
- Commit small and often with messages like `<client-slug>: <what changed>`.
- Do not push to any branch other than the one designated for the session unless the user gives permission.
- Do not open a PR unless asked. When an audit is delivered, it is merged into `main` (via PR, when the user asks) so `main` holds every client's folder.
- `main` contains this file, `_template/`, and one folder per client: `<client-slug>/`.

## Branding
All client-facing visuals follow the Maximus Mediascape brand in `_template/brand/brand.css`: red `#e10600`, cream `#f5efe8`, ink `#17090a`, Bebas Neue headings, Mulish body; no italics, one size per heading level, no decorative stars or stickers. Reuse the tokens; do not invent new colours or fonts.

## Evidence labels
Mark each claim **A** (observed in the audit), **R** (from research, with a link) or **H** (hypothesis). Say plainly when research is thin. Never present a hypothesis as fact.

## Findings format (`findings.md`)
- **Summary**: 3-5 lines and an overall rating.
- **Findings**: each with ID, area, severity (High/Medium/Low), evidence (URL or screenshot), why it matters, and a recommended fix.
- **Quick wins**: the highest-impact, lowest-effort fixes.
- **Next steps**: suggested priority order.
