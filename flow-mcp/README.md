# flow-mcp

An MCP server on Cloudflare Workers that generates images in Google Flow (Nano Banana) through a cloud browser that stays signed in to Google.

- **Endpoint:** `https://flow-mcp.projectatlas.workers.dev/mcp/<MCP_SECRET>` (stateless Streamable HTTP). `Authorization: Bearer <MCP_SECRET>` on `/mcp` also works. Add the secret URL as a custom connector in claude.ai (Settings, Connectors) and every chat gets the tools.
- **Tools:** `flow_generate_image` (prompt, aspect, count), `flow_status`, `flow_signin_start`, `flow_signin_finish`.
- **The login** lives in a Browser Use Cloud profile (`flow-google`, id in `wrangler.jsonc`). Each call starts a browser from that profile, drives Flow's chat agent in one pinned project (`FLOW_PROJECT_ID`), pulls the full-size images out of the page, and stops the browser. If Google signs out, `flow_signin_start` returns a live-view link; sign in, then `flow_signin_finish` saves it.
- **Secrets** (Cloudflare Worker secrets, never in git): `BROWSER_USE_API_KEY`, `MCP_SECRET`.
- **Deploy:** `cd flow-mcp && npm install && npx wrangler deploy`. Test the driver locally with `node test/run.mjs "<prompt>"` (needs `BROWSER_USE_API_KEY` and `FLOW_PROFILE_ID`).
- **Limits:** this automates the Flow website, which Google's terms may not allow; use at your own risk. Flow's page can change and break the selectors in `src/flow.js`. One generation takes 30 to 120 s. Calls at the same time share one Flow project, so run them one at a time.
