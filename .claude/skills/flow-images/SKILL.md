---
name: flow-images
description: How to generate images with the owner's Google Flow (Nano Banana) account. Use whenever a site, section or design needs generated imagery, before OpenRouter. Default route is the Flow MCP installed on the owner's laptop (see SETUP.md); the owner's own browser via Claude's browser tools, and a self-hosted server kit, are the alternatives.
---

# Flow images

Flow has no API, so a browser signed in to Google has to run somewhere. Routes, in order of least headache:

1. **The Flow MCP on the owner's laptop** (`flow_*` tools from https://github.com/GTAI-1/flow-mcp; set-up steps for their Mac and Windows PC in `SETUP.md`). Free, no cap from our side, uses their own Chrome profile. If the `flow_*` tools are in the session, use them: `flow_status` first, then `flow_agent_images` for batches of stills (0 credits) or `flow_generate` for single images, then `flow_download`. Never start video or anything that spends credits unless the owner says so; keep `max_credits` low.
2. **The owner's own browser through Claude's browser tools** (below), when the MCP is not installed.
3. **The self-hosted kit in `flow-server/`**: a signed-in Chrome on a free always-on server plus an MCP server, so every chat works with every laptop off. About 30 minutes to set up, untested on a real server. See its README.
4. Rented browsers (Cloudflare Browser Run, Browser Use) are capped or billed; the owner rejected both.

The rest of this page is route 2.

## Route 2: the owner's own browser

1. Use whichever browser tool the session has, and read its skill first: Claude in Chrome (`mcp__claude-in-chrome__*`, skill `anthropic-skills:chrome-browser`), the desktop app's built-in browser (`mcp__Claude_Browser__*`, skill `anthropic-skills:built-in-browser`), or the same pane on the owner's computer from a cloud session (`mcp__remote-devices__Claude_Browser__*`; link it with `list_computer_folders` then `request_computer_folder`).
2. No such tool in the session: say so plainly and ask the owner to open the Claude app or Chrome extension on their computer. Do not substitute silently; offer the server kit (route 3) if they want it working with their computer off.
3. Never export or copy Google cookies or sessions, never hide that the browser is automated, never run a service that exposes a signed-in browser. The harness blocks those, and they were not allowed in this project's setup.

## Procedure (the Flow screens below were verified on 2026-11-10; the owner's-browser route itself is untested until first use)

1. Open https://flow.google.com/. Signed in means the dashboard with a **New project** card. Landing on `/about`, or on a Google sign-in page, means signed out: ask the owner to sign in, do not type credentials yourself.
2. Open the working project (create one called "Claude assets" the first time). Dismiss the "Get started" dialog if it shows.
3. Use the chat panel on the right ("What do you want to create?"). Leave its settings alone (confirm before generating stays on, default model Nano Banana 2.1). Type: `Generate N image(s), no questions, aspect ratio X: <prompt>` (ratios 16:9, 4:3, 1:1, 3:4, 9:16; N up to 4 per request) and send with the arrow button.
4. Wait for the agent's stop button to disappear (30 to 120 s). New images appear in the grid. Images need no confirmation (free). **Never approve a credit prompt for video or anything else without the owner saying so.**
5. Full size: a preview is `https://flow.google.com/asb/<id>=s512-rw`. Swap the suffix for `=s0` to get the original (1024 px JPEG), fetched inside the signed-in page. Save it to the repo (`generated/`, git-ignored; copy approved ones into the site's assets). If the browser tool cannot hand a file to the session, use Flow's Download button and tell the owner where it landed.
6. Check each image at full size. Keep the prompts that worked in the site's case study.

## Rules
- One job at a time; batch up to 4 images per request.
- Only the owner's account and the one working project. Never delete projects or media.
- Flow's page changes; if a step no longer matches, describe what you see and adapt rather than guess. Add what you learn to `.claude/skills/design-craft/references/feedback.md`.
- Automating a Google site may go against Google's terms; the owner knows and has accepted the risk.
- Anything not made in Flow (video, or when the owner has no browser open): `references/assets.md` and the `media-gen` MCP.
