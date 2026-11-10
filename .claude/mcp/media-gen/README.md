# media-gen MCP server

Image and video generation as MCP tools, through OpenRouter (Veo, Seedance, Hailuo, Kling, Seedream, Gemini image models and more).
Registered in the root `.mcp.json`; Claude Code asks once to approve it, and a new session is needed to pick it up.

Tools: `list_models`, `generate_image`, `generate_video` (returns a job id), `check_video` (polls, downloads the mp4), `spend_report`.

- Defaults and the spend ledger are shared with `.claude/skills/design-craft/scripts/gen-media.mjs` (`IMAGE_MODEL`, `VIDEO_MODEL`, `BUDGET_USD`, default $2 per server process).
- Files go to `generated/` (git-ignored) unless `out_dir` is given.
- Key: `OPENROUTER_API_KEY` or the openrouter.ai network secret. In cloud sessions Node's `fetch` skips the proxy that injects the key, so the server relaunches itself with `NODE_USE_ENV_PROXY=1`. Without that every call is a 401.
- OpenRouter refuses image and video output while the account balance is under $1 (HTTP 402).
- This is not Google Flow itself: Flow has no public API. Veo, the model behind Flow, is available here as `google/veo-3.1*`.
