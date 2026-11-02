# ClientDemo

Concept websites for client demos and the owner's freelance portfolio (`portfolio/`). One folder per site, each an Astro project, deployed together by `wrangler.jsonc`.

## Design work

Before designing, rebuilding or restyling any site or section, use the `design-craft` skill (`.claude/skills/design-craft/`). It holds the owner's taste, the process for working from a reference, hard rules, and a case study for every approved site. It also says when to call Impeccable, if installed. Add what you learn to its `references/` after each job.

Site folders may have their own `README.md` and `CLAUDE.md`; read them before editing that site.

## How a design job runs

Run the whole job in one pass and hand over a finished, published result; do not stop to ask permission along the way. Impeccable is installed and the checks run automatically as part of the job. A job is only done when it has been built, checked with Impeccable and the checklist, published as an artifact (link first in the handover), and logged. The exact steps are in the `design-craft` skill, section 10. Ask a question only when something essential is missing and cannot be reasonably assumed (no reference, no URL, no brand).

## When there is a reference

When the owner gives a reference (screenshots, a recording, a homepage) and likes its design language, do two jobs. First replicate the reference's design system and signature moments closely, studied from full-resolution frames and its own code, never from small contact sheets. Then solve all of the client's content in that language: list the content, and for anything the reference has no section for, design a new section from the reference's own type, colour, spacing and motion. Do not drop the client's content to fit the reference, and do not add devices foreign to it. Before delivering, compare the build against the reference with `compare-sheets.py` at least twice. Impeccable fixes real defects only. Details: `design-craft` skill, section 11.
