# Spike results

Method: read-only review of public docs and source. No servers were started (Docker is not installed on this machine), so nothing below was exercised at runtime.

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
