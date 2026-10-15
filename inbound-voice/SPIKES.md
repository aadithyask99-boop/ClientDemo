# Spike results

Method: docs and source review, then a runtime spike in GitHub Codespaces (Docker is not usable on the author machine: virtualization is off in firmware). Runtime results are marked VERIFIED and were observed on 2026-10-15.

## Twenty: installing one app across workspaces

Read: `operations/publishing.mdx`, `operations/sync-and-recovery.mdx`, `config/install-hooks.mdx`, `logic/logic-functions.mdx`.

Learned (from docs):
- `yarn twenty app:publish --private` uploads a tarball to a specific server. The app gets a registration shared by every workspace that installs it.
- A "share link" uses the server base URL (no workspace subdomain), so it works for any workspace on that server. Installation is per workspace. Workspaces can auto-upgrade when a higher `version` is deployed.
- Installing requires the app to be listed, pre-installed by the operator, or owned by the workspace. "Pre-installed by the operator" is mentioned but not explained.
- A post-install hook can seed data and configure the workspace, and receives `APP_ACCESS_TOKEN` and `API_URL`.
- Logic functions can expose an HTTP route (`httpRouteTriggerSettings`), with `isAuthRequired` true or false, optional `forwardedRequestHeaders`, and `rawBody` for HMAC checks. They run as the application when nobody triggered them.
- `yarn twenty plan` previews metadata changes without applying them.

Verdict: the design in ARCHITECTURE.md decision 4 is supported by the docs. Per-client provisioning is "create workspace, install app, set the ingest secret".

Still unverified: how to pre-install for every new workspace automatically, how a per-workspace secret reaches the function (`serverVariables` are per registration, not per workspace), whether `rawBody` is always present, the default function timeout.

## Cal.diy: API surface

Read: `apps/api/v2` controllers in the repo.

Learned (from source):
- A NestJS API v2 exists in the repo: `GET /v2/slots` (version header `2024-09-04`), `POST /v2/slots/reservations`, `POST /v2/bookings` (version header `2024-08-13`), reschedule and cancel under `/v2/bookings/:uid`, listing bookings requires auth with a read permission.
- Auth guards accept an API key or access token.
- Google calendar app docs exist in the repo.

Still unverified: whether the published Docker image runs API v2 or only the web app, the exact request and response bodies (the scheduler adapter parses defensively), per-user isolation, Microsoft calendar support, how API keys are created (the web UI per user is assumed).

## Call service scaffold

Typechecks. 19 tests pass: signature verification over the raw body, stale and tampered requests, E.164 normalization, tenant resolution, fast 202 acknowledgement, retry through an outage, dead-lettering of permanent failures, signed writes to the ingest route, scheduler request shapes, caller lookup never throwing.

Not covered: persistence (tenants and the queue are in memory), the voice runtime, telephony, a live Twenty or Cal.diy.

## Next spikes needing Docker

1. Run Twenty with `IS_MULTIWORKSPACE_ENABLED=true`, create two workspaces, deploy the app tarball, install in both, post a signed call, check idempotency.
2. Run Cal.diy via Docker Compose, check API v2 is served, connect a test Google calendar, request slots, make a booking.
3. Place a test call through the chosen voice platform and measure first-audio latency.

## Runtime results (Codespaces, 2026-10-15)

### Environment findings
- **Docker-in-Docker bridge networking is broken in Codespaces.** Containers on a compose network could not reach each other (`db:5432` timed out while Postgres was healthy), so Twenty's server crash-looped. Fix: `network_mode: host` for all four services plus `PG_DATABASE_HOST=localhost`, `REDIS_URL=redis://localhost:6379`. `spikes/twenty-up.sh` now does this when `CODESPACES` is set. VERIFIED.
- **Twenty's own compose needs `SERVER_URL` to equal the origin the browser uses.** A request from another origin (for example `localhost:3000` while `SERVER_URL` is the forwarded `app.github.dev` URL) logs "Refused to issue a session cookie" and sign-up half-completes. VERIFIED.
- **Browser sign-up half-completed twice**, leaving a user with no workspace ("user already exists", then "workspace not found"). Creating the user and workspace through the `/metadata` GraphQL API (`signUp`, `signUpInNewWorkspace` with `displayName`, `activateWorkspace`) worked. The UI form seems to omit the workspace name. Cause not proven.
- **Twenty publishes a `twentycrm/twenty-app-dev` image** with a pre-seeded demo workspace on port 2020. `npx create-twenty-app@latest` starts it and configures the CLI with an API key. This is the easy path for app development. Needs Node 24+. VERIFIED.

### Twenty app (verified against the dev server)
- `twenty apply` synced our `Call` object and `ingest-call` function (66 metadata items added, no errors). VERIFIED.
- The SDK typecheck caught two problems: the generated client does not know a custom object until after its first sync (so the function types the client as `any`), and select-option colors need a literal type.
- A route-triggered function must return `new Response(body, { status })`. Returning a plain object produces HTTP 200 with the object as the body (a "401" in the body but 200 on the wire). VERIFIED.
- `rawBody` is preserved and HMAC verification over it works: valid signature 200, wrong secret 401, stale timestamp 401. Forwarded headers worked with `forwardedRequestHeaders`. VERIFIED.
- Idempotency: the same signed call sent twice leaves exactly one `Call` (`totalCount: 1`). VERIFIED.
- Secret application variables cannot have a default value (typecheck rejects `value`), so a per-workspace secret must be set after install. For the spike the variable was non-secret.

### Design consequences
1. `httpRouteTriggerSettings` resolves the workspace from the request host, so each tenant needs its own domain (multi-workspace subdomains). Alternative from the same docs: `serverRouteTriggerSettings`, one URL for all tenants, where a resolver in the owner workspace verifies the signature and enqueues the target function in the right workspace (acks 202). That means one secret and one URL for the call service. Worth adopting; not yet tried.
2. Per-workspace secrets need a provisioning step after install, or the server-route design avoids them.

### Still unverified
- Multi-workspace mode (`IS_MULTIWORKSPACE_ENABLED`) with two workspaces and the app installed in both.
- Whether `writability: APPLICATION` actually blocks writes through the REST API.
- Person linking, Message and Task creation in the ingest function.
- Server-route trigger.
- Cal.diy (not started).
- Voice platform latency.

## Dograh test (2026-10-15, Codespaces, since reverted)

Open-source voice AI platform (BSD-2-Clause, Python). Started from its compose file, tested through its REST API, then removed (containers, volumes, credentials, files).

### Verified
- **Runs in Codespaces only with host networking** (same bridge problem as Twenty). `spikes/dograh-up.sh` adds the override with `networks: !reset []`. The upstream `start_docker.sh` only prepares `.env` in a non-interactive shell and prints the launch command, so the compose command is run directly, without its public Cloudflare tunnel. Postgres, Redis, MinIO, API (:8000) and UI (:3010) came up healthy; `/api/v1/health` returned 200.
- **Fully scriptable, no manual account:** `POST /api/v1/auth/signup` (email, password, name) returns a token; `POST /api/v1/workflow/create/template` builds an inbound agent from a call type, use case and description. It created a workflow with start, agent, global and end-call nodes. (`.test` email domains are rejected as reserved.)
- **Text-chat API works with no provider keys configured:** a session started in about 1.9 s; agent turns took 1.8 to 3.0 s. The agent greeted the caller and asked for a name. This is text through Dograh's bundled stack, not voice latency.
- **Provider catalogs:** LLM (openai, google, groq, openrouter, azure, aws_bedrock and others), TTS (elevenlabs, deepgram, cartesia, openai, google, rime, inworld and others), STT (deepgram, assemblyai, cartesia, openai, google, soniox and others), plus speech-to-speech (openai_realtime, aws_nova_sonic, grok, ultravox, google). Defaults: openai, elevenlabs, deepgram.
- **API surface (160 paths):** per-workflow inbound telephony webhook (`/telephony/inbound/{workflow_id}`), telephony status callbacks (Twilio, Vonage, Telnyx, Plivo, Vobiz, Cloudonix, Exotel), transfer results, campaigns, tools (custom and MCP, with a test endpoint), knowledge base (upload, search), recordings, workflow runs with transcript and recording URLs, API keys, website embed.
- **Tuning keys in workflow configuration:** ambient noise (enabled, volume 0.3), turn start strategy (`min_words`, 2 words), turn stop strategy (`transcription`), smart turn stop seconds (2), max user idle timeout (10 s), max call duration (300 s), pronunciation dictionary, TTS cache, context compaction.
- **Call dispositions** exist per workflow (for example qualified, not interested, wrong number), which map onto our outcome set.

### Not found or not verified
- Filler words, active-listening backchannels, and voice speed/temperature were not among the workflow configuration keys. They may live in TTS settings or agent prompts; unchecked.
- A call-ended webhook endpoint was not seen in the API paths (the README mentions webhooks, probably a workflow node). Unchecked.
- Voice quality and real latency (needs audio), real inbound telephony, and whether the bundled "dograh" provider calls a hosted service (self-host independence) are untested.
- Multi-client separation (organizations) was not examined.
- Telemetry is on by default (`ENABLE_TELEMETRY=false` disables it).

### Dograh voice library check (second run, since reverted)
- The built-in `dograh` voice provider lists **1,003 voices** (428 English: US 155 female and 152 male, GB 14 female and 31 male, AU 20 female and 11 male, plus Irish, Indian, others), each with name, description, accent, gender and a `preview_url`.
- **Previews are served from `services.dograh.com`** (`/api/v1/voice-proxy/dograh/voices/<id>/preview`, MP3, about 50 to 70 KB, no login needed). So the bundled "no keys needed" voices are a hosted Dograh service, not local. A self-hosted deployment that uses them depends on that service; using our own provider keys (ElevenLabs, Deepgram, Cartesia and others) avoids it. Their terms and limits were not checked.
- No speech-synthesis endpoint was found in the API (only a TTS cache), so custom-script samples would need a provider key. The ElevenLabs voice list returns 400 without one.
- Six previews were confirmed playable (`audio/mpeg`): Ailsa and Charlotte (GB female), Alec (GB male), Allie (US female), Adrian (US male), Aila (AU female). Judging them is subjective and still to be done by a person.
- Real-time browser calls from a Codespace are expected to be a problem (WebRTC needs UDP). Not attempted.
