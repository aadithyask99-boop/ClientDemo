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

## Dograh: call-end webhook and multi-client model (docs and source review, not run)

### Call-end webhook
- A **webhook node** in the workflow definition POSTs JSON when a run completes. The target URL, method and a templated payload are set on the node. Several webhook nodes per agent are allowed.
- Payload variables include `workflow_run_id` (a good idempotency key), `workflow_id`, `call_time`, `initial_context`, `gathered_context` (data the agent extracted), `gathered_context.call_disposition` and `mapped_call_disposition`, `cost_info.call_duration_seconds`, `recording_url`, `transcript_url`, and QA `annotations`.
- Delivery is durable: a delivery table, exponential backoff, a sweeper that re-enqueues overdue attempts, and a header carrying the attempt number. Duplicates are possible, so the receiver must be idempotent.
- **Authentication is a stored credential: none, API key header, bearer token, basic auth or a custom header. There is no HMAC signature.** Our receiver therefore authenticates with a per-client secret token and must not trust the payload without it.
- Recording and transcript URLs are described as "public download URLs". Whether they expire or are guessable was not checked. Treat them as sensitive: download them into our own private storage on receipt and do not store the public links long term.
- Outcomes come from per-workflow call dispositions, mapped per organization, which fit our outcome set.

### Multi-client model
- Dograh has **organizations**. In local-auth self-hosting, each sign-up creates its own organization (`org_<user id>`) with its own agents, API keys, telephony configs, model configuration, usage and disposition mapping. Sign-up works through the API while `ENABLE_SIGNUP` is true.
- Org creation also asks Dograh's hosted Model Proxy Service for a default service key (a failure does not block sign-up). So the "no keys needed" defaults depend on a Dograh-hosted service; using our own provider keys per organization avoids it.
- Cross-organization isolation was **not tested**.
- Two workable layouts: (a) one organization and one agent per client, routed by phone number, with our own tenant registry; (b) one organization per client. If clients never log into Dograh (they use Twenty), (a) is simpler. (b) gives per-client usage, limits and credentials inside Dograh. Starting recommendation: (a).
- Scaling: multiple API workers behind nginx with `least_conn` (Dograh 1.29+); campaign orchestrator and the Asterisk manager stay singletons.

### Still unverified
- Per-number inbound routing to a workflow and how a number is attached to an organization or agent (docs: telephony configs and phone numbers).
- Whether the provisioning API can add a webhook node via `create-from-definition`/`update` (the schema suggests yes).
- Real latency and voice quality.

## End-to-end: Dograh webhook to call-service to Twenty (2026-10-15, Codespaces, since reverted)

Result: **it works.** A Dograh text-chat call, ended through the API, produced one `Call` in Twenty (`dograh:7`, 8 s, outcome NO_OUTCOME because disposition extraction was not enabled), with the transcript copied into private storage.

### What ran
- Dograh (host networking) provisioned over its API: sign-up, a stored **bearer-token credential**, an inbound agent from the template, and a **webhook node** added with `PUT /workflow/{id}`, then `POST /workflow/{id}/publish`.
- A text-chat session with two caller turns, then `POST .../text-chat/sessions/{run}/end` with an empty JSON body (the body is required; all fields optional).
- Ending the session enqueued Dograh's completion job, which ran the webhook (log: "Found 1 webhook nodes", delivery succeeded 202, attempt 1).
- call-service (`/webhooks/dograh`) authenticated the bearer token to a tenant, answered 202, queued the write, copied the transcript, and posted the signed record to the Twenty app's `ingest-call` route.

### Problems found and fixed
- The end-session call returned 422 until sent with `{}`.
- Writes failed 6 times, then dead-lettered, with only "Twenty error 500" in the log. The queue had no observability. Added: log lines for webhook receipt and write retry/dead-letter, and Twenty's failure reason in the error text. Retries and dead-lettering behaved as designed.
- Cause 1: the ingest function stored our private `artifact://...` references in Twenty **LINKS** fields, which reject non-http URLs ("The URL of the link is not valid"). They are not public links, so they are now plain text.
- Cause 2: a Twenty field type **cannot be changed in place** (the synced field kept its old link shape and rejected strings). Fix: new TEXT fields under new names and new universal identifiers (`recordingKey`, `transcriptKey`).
- Direct signed posts of Dograh-shaped records passed all along, so the record shape was never the problem. The failure only showed on the real path, which is why this end-to-end run mattered.

### Also observed
- Dograh's text-chat LLM calls go to `services.dograh.com/api/v1/llm/chat/completions`: the bundled model is a **hosted service** at run time, confirmed in its log. Production needs our own provider keys.
- `transcript_url` was fetchable and was copied to local private storage. `recording_url` is empty for a text chat (not tested for voice).
- Dispositions: with extraction off, the disposition falls back to the reason the call ended, which maps to NO_OUTCOME. Enabling per-workflow disposition extraction with our outcome codes is still to do.
- Caller number: `initial_context.phone_number` is a guess and was empty here. For real inbound calls the caller number source must be checked.

### Still unverified
- Disposition extraction with our outcome codes; the caller-number variable; recordings from a real voice call; the artifact store on S3/MinIO with private access; Person linking and Message/Task creation in Twenty.

## Outcomes and caller number (2026-10-15, Codespaces, since reverted)

Test: `spikes/e2e-outcomes.mjs` (run through `e2e-dograh-webhook.sh` with `E2E_SCRIPT=e2e-outcomes.mjs`). Disposition extraction was enabled on the workflow with our eight outcome codes (`booked`, `message_taken`, `transferred`, `transfer_failed`, `info_given`, `callback_requested`, `opted_out`, `no_outcome`) and a description for each; three text-chat calls were run with simulated telephony variables in `initial_context`.

### Verified
- **Enabling extraction works through the API:** a `call_dispositions` list of `{code, description}` in `workflow_configurations` on `PUT /workflow/{id}` is stored and returned.
- **The classifier picks our codes correctly:** Dograh's log shows "Refining call disposition: end_call -> callback_requested", "-> opted_out" and "-> info_given" for the three scenarios (3 of 3 as intended).
- **Caller number:** `{{initial_context.caller_number}}` in the webhook template reached Twenty as the Call's new `callerNumber` field (`+447400123456`) in all three runs. This used a simulated `initial_context`. Per Dograh's docs, telephony sets `caller_number` and `called_number` for real inbound calls (`called_number` is our number, useful for tenant checks).

### Not working in this harness: outcomes through the webhook
- All three Twenty records had outcome NO_OUTCOME. The webhook was sent about 0.3 s before the classifier logged its answer, and, more importantly, the stored run itself still reads `call_disposition: end_call` afterwards.
- Source reading explains it: on the **text-chat** path `_build_text_chat_completion_write` writes `call_disposition` (and `call_status`) from the end reason and overwrites the extracted value. On the **voice** path `PipecatEngine.refine_call_disposition` updates the engine's gathered context and the finished context is persisted once before completion work and webhooks run, so refined outcomes should reach webhooks. That is source-level only; voice outcomes are **not verified**.
- Consequence: text chats cannot be used to verify outcomes. A real voice call (browser WebRTC or a phone number) is needed. Worth reporting upstream as a text-chat inconsistency.
- A reconciliation step (re-fetching the run from Dograh before writing) was considered and rejected: the stored text-chat run has the same fallback value, and the voice path appears to need no such step.

### Mapping on our side
- Our mapper turns `callback_requested`, `opted_out`, `info_given` and the other eight codes into the Twenty outcome set (unit-tested), maps Dograh's starter codes (`appointment_booked`, `do_not_call` and others) via aliases, and falls back to NO_OUTCOME for anything unknown, including the end reasons.

### New in Twenty
- `Call.callerNumber` (TEXT). Linking the caller to a Person is still TODO.

## Booking and outcome fixes (2026-10-15, Codespaces, since reverted)

Full account and results table in [BOOKING.md](BOOKING.md). Headlines:
- Dograh HTTP tools work end to end in text chats: the agent called `check_availability` then `book_appointment`; the call-service booked the slot and recorded a fact that made the call BOOKED in Twenty.
- Tool creation shape (verified): `POST /tools/` with `name`, `description`, `category: "http_api"` and a `definition` of `{schema_version, type, config, messages}`; the config takes `method`, `url`, `credential_uuid`, `parameters`, `preset_parameters` (for example `workflow_run_id` from `{{initial_context.workflow_run_id}}`) and `timeout_ms`. Tools attach to an agent node through its `tool_uuids`.
- The agent-extracted `outcome` variable (agent node `extraction_variables`) is kept on text chats even though the platform disposition is not, but extraction did not run for a one-message call.
- The agent does not always call a tool even when told to. An opt-out is therefore also caught by a deterministic scan of the caller's transcript lines.
- Dograh stores each tool call's result in the run's `gathered_context.tool_results` (seen as a key, contents not inspected).

## Persistence and the Cal.diy build (2026-10-15)

- **Storage:** bookings, call facts and the post-call queue moved to Postgres behind `DATABASE_URL` (see [BOOKING.md](BOOKING.md)). The 23 database tests also pass on a real Postgres 16 through the `pg` driver (Codespace, three runs). That run found a start-up race in `migrate` (concurrent `CREATE TABLE IF NOT EXISTS`), now fixed with an advisory lock.
- **Cal.diy build, attempt 1:** `DOCKER_BUILDKIT=0` (the README's advice) fails immediately: "failed to parse platform" on `FROM --platform=$BUILDPLATFORM`. Building with BuildKit gets past it.
- **Cal.diy build, attempt 2 (stopped):** the free disk of the 4-core Codespace (32 GB) went from 21 GB to 1.9 GB during the install and link step of the first of the two images, and the build was still running. Stopped by hand so a full disk would not damage the Twenty database. Cal.diy does not fit on this machine alongside Twenty; it needs a larger Codespace (more disk), or a different way to run it. Cal.diy's API request shapes in `scheduler.ts` are still unverified.
- **Adapter bug found by reading, not yet fixed:** `CalDiyScheduler.book` throws a plain error on any non-2xx reply, so a slot taken by someone else would reach the caller as "calendar unreachable" (502) instead of "slot unavailable" (409). Fix once the real error response is known.

## Decision: Cal.diy dropped, client calendars used directly (2026-10-15)

- **Why:** Cal.diy did not fit the Codespace (see above), is labelled non-production by its own README, and its API shapes were still unverified after all the effort. We only need two things from it (free/busy and event creation), which Google and Microsoft expose directly.
- **Twenty's calendar:** Twenty connects Google and Microsoft calendars, syncs events that have external participants onto people and companies, and (from release 2.18) can create events from workflows. Its documentation shows no free/busy or availability lookup, so it cannot serve as the booking engine. Sources: its calendar and email user guide, setup guide and release notes. It will show our booked events on the caller's record once the client connects their calendar to Twenty as well.
- **Built:** `CalendarScheduler`, `GoogleCalendarClient` and `MicrosoftCalendarClient` (BOOKING.md). `CalDiyScheduler`, `Tenant.calDiy`, `spikes/cal-up.sh` and the Cal.diy tests were removed. 97 tests pass. Not run against live accounts.
- **Needs from the platform owner before it can be tried:** a Google Cloud project with the Calendar API enabled and an OAuth client, and a Microsoft Entra app registration; then one test calendar of their own to consent with. Creating these accounts is the owner's step.

## First real voice call (2026-10-15, Codespace, throwaway accounts)

Path that worked: caller's phone, Voiso trial number (UK, London), a Voiso inbound workflow with one Route step to a SIP URI, Dograh's provisioned Cloudonix SIP domain, the Dograh agent. The agent answered and introduced itself as an automated assistant; the caller hung up after 11 seconds. Dograh's Agent Runs page recorded run #1 as an inbound call with the caller's number (`447824678418`, no plus sign) and disposition `user_hangup`.

- **Twilio trial dead end:** the "From" number in Twilio's Try out Voice panel is a shared sandbox number, not owned by the account. Dograh checks ownership with Twilio when a number is added and refuses ("not owned by this Twilio account"). A trial gives no number you can receive calls on.
- **Dograh behind a public address:** `BACKEND_API_ENDPOINT` (in Dograh's `.env`) must be the public address of port 8000. With the default `http://localhost:8000` the web UI called localhost from the visitor's own browser and sign-in failed. The inbound webhook URL in the telephony page follows this setting. `dograh-up.sh` now takes `PUBLIC_API_URL` for it. Codespaces drops port forwarding on restart; ports 8000 (public) and 3010 must be re-forwarded.
- **Voiso:** 14-day trial, one free UK number, no more purchasable during the trial. Calls are limited to the registered phone and the trial number (a call from any other number is blocked, heard as busy). Route node offers Variable, Queue, Agent, PSTN and SIP URI. The SIP URI used was `<number>@<dograh inbound hostname>`.
- **Caller number:** arrives without a plus sign; `toE164(x, "GB")` turns `447824678418` into `+447824678418` (checked).
- **Not yet verified on this call:** audio quality and latency (not measured), the call-end webhook to the call-service, tools, recording, the Cloudonix Cockpit binding (was not needed for this call to connect).
