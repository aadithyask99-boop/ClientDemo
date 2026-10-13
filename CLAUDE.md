# Client Website Audits: Instructions

This repo holds website audits for multiple clients. Each audit is done in its own chat and on its own branch.

## First rule: always ask for the client name
At the start of every chat in this repo, before creating any branch, folder or files, ask the user for the **client name** (and the site URL and scope if not given). Do not guess or reuse a previous client's name. Do nothing audit-related until the client name is confirmed.

## Starting a new audit
The user will give: **client name**, **site URL**, and **scope** (e.g. SEO, performance, accessibility, content, UX).

1. Create a slug from the client name (lowercase, hyphens), e.g. `moments-and-memories`.
2. Branch from `main`: `audit/<client-slug>`. Follow-up rounds: `audit/<client-slug>-<yyyy>-q<n>`.
3. Copy `audits/_template/` to `audits/<client-slug>/`.
4. Fill in `README.md` (client, URL, date, scope, status), then write findings in `findings.md`.

## Rules
- Work only inside `audits/<client-slug>/` on that client's branch. Never touch another client's folder.
- Keep screenshots and exports in `assets/` and reference them from `findings.md`.
- Commit small and often with messages like `audit(<client-slug>): <what changed>`.
- Do not push to any branch other than the one designated for the session unless the user gives permission.
- Do not open a PR unless asked. When an audit is delivered, the user decides whether to merge to `main` or tag it (`audit/<client-slug>/v1`).
- `main` holds only shared material: this file and `audits/_template/`.

## Findings format (`findings.md`)
- **Summary**: 3-5 lines and an overall rating.
- **Findings**: each with ID, area, severity (High/Medium/Low), evidence (URL or screenshot), why it matters, and a recommended fix.
- **Quick wins**: the highest-impact, lowest-effort fixes.
- **Next steps**: suggested priority order.
