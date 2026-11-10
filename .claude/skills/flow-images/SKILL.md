---
name: flow-images
description: How to generate images with the owner's Google Flow (Nano Banana) account. Use whenever a site, section or design needs generated imagery, before OpenRouter. The only supported way is the owner's own signed-in browser, driven through Claude's browser tools.
---

# Flow images

Flow has no API. The one supported way to use it here is **the owner's own browser, already signed in to Google, driven by Claude's own browser tools**. That keeps images free and uncapped, uses their normal login and network, and needs no server.

## The only way

1. Use whichever browser tool the session has, and read its skill first: Claude in Chrome (`mcp__claude-in-chrome__*`, skill `anthropic-skills:chrome-browser`), the desktop app's built-in browser (`mcp__Claude_Browser__*`, skill `anthropic-skills:built-in-browser`), or the same pane on the owner's computer from a cloud session (`mcp__remote-devices__Claude_Browser__*`; link it with `list_computer_folders` then `request_computer_folder`).
2. No such tool in the session: say so plainly and ask the owner to open the Claude app or Chrome extension on their computer. Do not substitute silently.
3. Never use a rented or hosted browser, never export or copy Google cookies or sessions, never hide that the browser is automated, never run a service that exposes a signed-in browser. Those were tried and are not allowed.

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
