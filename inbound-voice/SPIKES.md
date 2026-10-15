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
