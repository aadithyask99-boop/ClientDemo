# Orchestrator mode (main chat plus helper agents) and the owner's brief

## The owner's brief (what the owner gives)
A reference website. Often a screen recording of it that they make, a few words on what they love, and sometimes a client with content. They may describe it aloud; **a chat cannot hear audio**, so ask the owner to type or paste what they said (a few lines is enough: what they love, what the hero should do, the mood, who it is for). Treat that text as the intent and the recording as the motion truth.
- Recording: if the owner attaches a video, extract frames with ffmpeg (for example `ffmpeg -i rec.mp4 -vf fps=2,scale=1280:-1 frames/f%03d.png`), look at them in order, and write down what moves and how (cursor effects, hover, intro, scroll scenes). Combine it with `scripts/capture-site.mjs` (which records scroll only) and the reference's code.
- If there is no recording, say so in the plan and rely on the capture and the code.

## Roles
- **Main chat (orchestrator):** holds `owner-taste.md`, the plan and the owner's replies. Talks to the owner. Decides. Reviews everything. Writes the decisions file. Never does bulk reading or building itself.
- **Reference reader (helper):** captures the reference, reads its code, extracts frames from the recording, returns one page: palette, type, hero type, section rhythm, photography, a motion inventory.
- **Inspiration scout (helper):** runs the motionsites and details.so lookups for the client's subject and returns 5 to 8 mechanisms in one sentence each, with preview frames.
- **Section builders (helpers):** one section (or one small group) each, from a tight brief.
- **QA checker (helper):** builds, screenshots at 1440 and 390 (settled states), runs the probes and returns a short defect list with image paths.
- **Critic (`owner-critic`):** reviews the plan and the build as the owner would (gimmick test included).

One level only: helpers do not start helpers. Helpers cannot talk to the owner.

## The decisions file (`<site>/DECISIONS.md`)
Written by the main chat right after the owner approves the plan. It is the single source of truth for every helper: mode, the chosen hero, palette (hexes), type, spacing, the section list (each with its mood, subject, motion), easter eggs, the owner's likes and dislikes quoted from `owner-taste.md`, the hard rules, and the owner's reactions during the plan. Without it parallel builders drift apart.

## A helper brief must contain
Goal and done-state; the files to read (`DECISIONS.md`, `owner-taste.md`, the no-gadgets rule); the exact folder and branch; what not to touch; how to verify (build, settled-state screenshots at 1440 and 390, look at them); the report format (under 200 words: what changed, commit, screenshot folder, what is still weak). Tell helpers to commit, push and not open a pull request.

## Loop
Helpers report; the main chat looks at the screenshots itself (never only the report); the critic reviews; repeat until the critic says ship, at most three rounds; then publish the artifact and hand over. Keep helper reports short so the main chat stays small.

## Cost note
Helpers cut the main chat's context but each reads the repo itself, so total tokens can rise. Use them for heavy steps (capture and reading, building, QA), not for small edits.
