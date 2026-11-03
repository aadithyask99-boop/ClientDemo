# ClientDemo

Concept websites for client demos and the owner's freelance portfolio (`portfolio/`). One folder per site, each an Astro project, deployed together by `wrangler.jsonc`.

## Design work

Before designing, rebuilding or restyling any site or section, use the `design-craft` skill (`.claude/skills/design-craft/`). It holds the owner's taste, the process for working from a reference, hard rules, and a case study for every approved site. It also says when to call Impeccable, if installed. Add what you learn to its `references/` after each job.

Site folders may have their own `README.md` and `CLAUDE.md`; read them before editing that site.

## How a design job runs

Run the whole job in one pass and hand over a finished, published result; do not stop to ask permission along the way, with one exception: on a reference-led job, present the section plan and wait for the owner's go before building (design-craft skill, section 11, rule 0). Impeccable is installed and the checks run automatically as part of the job. A job is only done when it has been built, checked with Impeccable and the checklist, published as an artifact (link first in the handover), and logged. The exact steps are in the `design-craft` skill, section 10. Ask a question only when something essential is missing and cannot be reasonably assumed (no reference, no URL, no brand).

## When there is a reference

When the owner gives a reference (screenshots, a recording, a homepage) and likes its design language, copy that language and its signature moments closely, studied from full-resolution frames and its own code. Then curate the client's content, do not paste it: the page is a highlight reel about the size of the reference, with one short moment per kind of content and links for the rest. Other pages of the client's site that you read (About, history, team) are only to understand the client; do not move their content onto the page you are building. Compare the build with `compare-sheets.py` at least twice and heed its length and word warnings. Before building, show the owner a short plan of the sections, especially the new ones you will design for content the reference lacks, using the client's current design, the reference and our own sites as sources (`references/plan-template.md`, `references/patterns.md`), and wait for their go. Match its motion, not only its look: write a motion spec from its scripts and run `motion-probe.mjs` (the build needs at least 70% of the reference's scroll motion and no section without motion). No section may be a small sentence in empty space. Impeccable fixes real defects only. Details: `design-craft` skill, section 11.
