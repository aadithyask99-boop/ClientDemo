# Inbound Voice Agent Platform: Architecture and Data Model

Status: draft 1. Scope: inbound calls only, many clients, Twenty as the CRM.

Sources: feature ideas from viewing a commercial product's UI through the owner's own logged-in account, plus its public docs (no code, bundles or private APIs were examined, and nothing was copied). Technical facts come from Twenty's public docs and repo and LiveKit's docs. Anything not read or tested is marked **UNVERIFIED**.

## 1. Decisions

1. **Twenty stays out of the live call path.** A Twenty outage or slow response must not drop or delay a call, and an inbound call needs a fast answer. (Twenty's docs state 100 requests per minute and 60 records per batch; that may be the Cloud limit and be configurable when self-hosted, **UNVERIFIED**. The decision holds either way.) The call service resolves the client from the dialed number and loads agent config from its own database (cached in memory). Calls are written to Twenty asynchronously through a queue. The one exception is a caller lookup by phone number, with a 400 ms timeout. If it fails or times out, the call continues with an unknown caller.
2. **One system of record per entity** (section 4). Without this split the data model is ambiguous.
3. **Tenant registry.** Each client maps to one Twenty workspace (own subdomain), one API key, one webhook secret, its numbers and its agent config. One key and one secret per workspace is assumed, **UNVERIFIED**.
4. **Schema and write path ship as a Twenty App**, not as per-workspace metadata scripts. The Apps SDK (`defineObject`, `defineLogicFunction`) is MIT licensed and fits Twenty's application exception.
   - `writability: APPLICATION` means only the app's own logic functions may create, update or delete those records (from Twenty's objects doc). Our sync worker therefore does **not** write Call, Agent or Message over the REST API. It POSTs to an HTTP-route logic function (`ingest-call`) that the app exposes, and that function writes the records, running as the application (from the logic-functions doc).
   - **Verified in a spike (SPIKES.md):** the app syncs, the signed route returns 200 or 401 correctly, the raw body is preserved, and a repeated call creates one record. The route must return `new Response(...)` to set the status.
   - **Design option to adopt:** Twenty also offers a server route trigger: one URL for all tenants, with a resolver that verifies the signature and routes to the right workspace. It would replace per-workspace URLs and secrets. Not yet tried.
   - Route auth: the function is protected by a shared-secret HMAC that we compute over the raw body and the function verifies using `rawBody` (documented for `RoutePayload`), with `forwardedRequestHeaders` set for the signature and timestamp. Using `isAuthRequired: true` with an API key instead is an alternative; whether an API key satisfies it is **UNVERIFIED**.
   - If the HTTP-route path proves unworkable, fall back to `writability: OPEN` and restrict writes through the API key's role.
   - **UNVERIFIED:** how one app installs across many self-hosted workspaces (`operations/publishing.mdx` and `sync-and-recovery.mdx` not read), and the default timeout for logic functions (the docs example uses 2 seconds, so keep the function small and batch-friendly). Fallback: run the same app install per workspace from a provisioning script.
5. **Voice platform: Dograh (open source, BSD-2) is now the leading candidate**, pending a listening test; LiveKit Agents remains the fallback. Dograh was started and driven through its API in a spike (SPIKES.md): it provisions agents programmatically, supports inbound telephony per workflow, custom and MCP tools (our booking), a knowledge base, transfer, and ambient noise and turn-taking settings. Voice quality, latency, filler words and its call-end webhook are unverified.  Findings from the review: call results come back through a **webhook node** (templated JSON, durable retries, authenticated by a per-client bearer token, not signed; use `workflow_run_id` as the idempotency key; copy recordings into our own private storage); multi-client can start as **one Dograh organization with one agent per client**, routed by phone number through our tenant registry. Details in SPIKES.md. Original default: **LiveKit Agents**, because it can be self-hosted and keeps call data on your infrastructure. Vapi or Retell get to a first call faster. The swap point is the `VoiceProvider` interface in section 3. See section 7 for what to verify before promising any tuning feature.
6. **Booking uses self-hosted Cal.diy** (decided), behind the `Scheduler` interface. Cal.diy is the MIT-licensed community edition of Cal.com, with no license key. It connects to each client's Google or Microsoft calendar, finds open slots and creates the booking. The call service talks to it over its API.
   - **Production caveat:** Cal.diy's README says it is intended for personal, non-production use and points commercial users to Cal.com. We accept this for the prototype and Phase 2. Before real clients go live, make an explicit go or no-go: harden Cal.diy (security review, backups, upgrade plan) or replace the adapter with our own slot logic over Google Calendar and Microsoft Graph. The interface makes that a contained change.
   - **Multi-client:** Teams and Organizations are removed in Cal.diy. Default: one Cal.diy user per client, each with their own connected calendar and event types, inside one instance. **UNVERIFIED:** isolation between users, API coverage for availability and booking, and API authentication. Fallback: one instance per client.
   - **OAuth:** each client connects a calendar with read and write access. Google and Microsoft app verification is **UNVERIFIED** and may take time, so start it early.
   - Slot offers are re-checked at booking time. A booking the calendar refuses becomes a `take_message` fallback and is flagged for staff.
7. **License posture.** The call service talks to Twenty only through its HTTP API and webhooks and does not incorporate or modify Twenty's source. Under Twenty's AGPLv3 additional permission, the service can then carry its own license. Forking Twenty ends that protection. Have a lawyer confirm before reselling.

## 2. Scope

In:
- Answer inbound calls per client, from a knowledge base.
- After-hours behavior, take a message, voicemail.
- Book appointments through Cal.diy on the client's calendar.
- Transfer to a human rep, with a fallback when the transfer fails.
- Post-call summary, outcome, notification, and follow-up task in the CRM.
- Per-client recording consent, retention and PII handling.

Out (later): outbound calling, cadences, power dialer, dispatch modes, split tests, billing and rebilling, whitelabel.

## 3. Components

```
 Caller
   |  PSTN
 Twilio (or Telnyx)  number per client
   |  SIP / media stream
 Voice runtime (LiveKit Agents)   [VoiceProvider interface]
   |  STT -> LLM (tools) -> TTS, interruption handling
   |------------------- tools -------------------+
   |                      |                      |
 Knowledge search     Scheduler (Cal.diy)    Transfer (Twilio dial to rep)
   |
 Call service (Node/TypeScript)
   - tenant registry + agent config (Postgres, cached)
   - webhook receiver for telephony events
   - post-call pipeline (queue: BullMQ + Redis)
   - object storage (recordings, transcripts)
   |
   +--> Twenty sync worker --> Twenty (one workspace per client)
   +--> Notifier (email / Slack / SMS)
```

Interfaces to keep swappable: `VoiceProvider`, `Scheduler`, `Notifier`, `CrmWriter`.

## 4. Entities and system of record

| Entity | System of record | Notes |
|---|---|---|
| Client (tenant) | Call service DB | Maps to Twenty workspace subdomain, API key (encrypted), webhook secret |
| Phone number | Call service DB | E.164, tenant, routing rules, hours, fallback |
| Agent config | Call service DB | Prompt, voice, language, tools enabled, tuning, hours |
| Knowledge base | Call service DB + vector store | Per tenant, versioned |
| Raw call record | Call service DB | Provider call ID is the unique key |
| Recording, transcript | Object storage | Linked by URL from Twenty |
| Person, Company | Twenty | Matched by normalized phone |
| Call (mirror) | Twenty custom object | Outcome, summary, duration, links; written by sync worker |
| Follow-up task | Twenty | Created per outcome |
| Rep (transfer target) | Call service DB | Number, hours, skills, pause flag; optionally mirrored to Twenty |

### Twenty custom objects (shipped by the app)

**Call** (`writability: APPLICATION`)
- `providerCallId` TEXT, unique, idempotency key
- `direction` SELECT (INBOUND)
- `startedAt`, `endedAt` DATE_TIME; `durationSeconds` NUMBER
- `outcome` SELECT: BOOKED, MESSAGE_TAKEN, TRANSFERRED, TRANSFER_FAILED, INFO_GIVEN, CALLBACK_REQUESTED, OPTED_OUT, NO_OUTCOME
- `summary` TEXT
- `recordingUrl`, `transcriptUrl` LINKS
- `callerNumber` PHONES
- relation: many Calls to one Person (nullable)
- relation: many Calls to one Agent

**Agent** (`writability: APPLICATION`): `name`, `status`, `serviceDescription`. Read-only mirror of the config for display.

**Message**: `body`, `callbackNumber`, `urgent` BOOLEAN, relation to Call and Person.

Standard Twenty Person, Company, Task and Note objects are reused as-is.

## 5. Inbound call sequence

1. Caller dials the client's number. Twilio sends the call to the voice runtime.
2. Runtime resolves tenant and agent config from the dialed number (cache first, Postgres second). No Twenty call here.
3. Recording consent line is played if the tenant's jurisdiction requires it. Declining ends or de-records the call per tenant policy.
4. In parallel with the greeting, the service looks up the caller in Twenty by E.164 number with a 400 ms timeout. On failure it proceeds as unknown caller.
5. Agent converses. Tools available: `search_knowledge`, `check_availability`, `book_appointment`, `take_message`, `transfer_to_human`, `end_call`.
6. After hours: agent follows the tenant's after-hours policy (take message, book next slot, or emergency transfer).
7. Transfer: dial the rep. If no answer within N seconds, fall back to take a message, and mark `TRANSFER_FAILED`.
8. Call ends. The runtime posts the final event to the call service webhook.
9. Post-call job (queue): finalize transcript, generate summary and outcome, store recording and transcript, notify.
10. Sync job (queue, rate-limited per workspace): signed POST to the workspace's `ingest-call` logic function, which upserts Person if new, upserts Call keyed by `providerCallId` (idempotent), and creates Task or Message as the outcome requires. Reads (caller lookup in step 4) use the normal REST API with the workspace API key.

## 6. Twenty integration details

- **Auth:** bearer API key per workspace, scoped to a role with only the objects the sync needs.
- **Rate limit:** 100 requests per minute, 60 records per batch (documented). The sync worker uses a per-workspace token bucket and batches where possible.
- **Phone matching:** normalize everything to E.164 before lookup. **UNVERIFIED:** how Twenty stores phone numbers (I believe the country code and number are separate parts, but found no source) and the exact filter syntax. Confirm against the workspace's generated API docs before writing the lookup.
- **Writes:** Call, Agent and Message are written only by the app's logic function (decision 4). Person, Task and Note writes from that function use the application's own access.
- **Idempotency:** unique on `providerCallId`. Upsert, never blind create. Retries are expected.
- **Inbound webhooks from Twenty** (for example Person created or updated): no event filtering exists, so the receiver filters by event name. Verify the HMAC against the **raw request body** (not a re-serialized `JSON.stringify(req.body)`), compare in constant time, and reject timestamps older than 5 minutes.
- **Schema install:** the Apps SDK app described in decision 4.
- **Multi-workspace mode:** `IS_MULTIWORKSPACE_ENABLED=true`, wildcard DNS and TLS for `*.your-domain`. **UNVERIFIED:** whether API keys are strictly bound to one workspace, and how provisioning a new workspace is automated.

## 7. Voice quality features: parity check

Features seen in a reference product's settings. "Documented" means the LiveKit Agents docs page I read states it. Everything else is "check" and nothing is promised until checked. Vapi and Retell docs were not read at all.

| Feature | Our approach | LiveKit Agents | Vapi / Retell |
|---|---|---|---|
| Turn detection (when the caller has finished) | Turn detector model, VAD, STT endpointing or manual | Documented: all four modes plus realtime-model detection | check |
| Delay before the agent replies | Endpointing min and max delay | Documented: fixed `min_delay` and `max_delay`; dynamic endpointing is Python only; defaults not stated on the page | check |
| Interruption (barge-in) | Runtime feature | Documented: pauses on user speech, truncates history to what was heard, can be disabled, false-interruption resume | check |
| Ambient background sound | Audio mix | Documented as supported (ambient and thinking sounds), details on a separate page not read | check |
| Noise and background-speech suppression | STT-side or telephony filter | Not stated on the page read; only automatic gain control (Python) is mentioned | check |
| Voice speed and temperature | TTS parameters | Not stated on the page read; depends on the TTS vendor chosen | check |
| Filler words in agent speech | Prompt instruction | check | check |
| Short acknowledgements while the caller talks | Backchannel | check | check |
| Speak first with a custom opening line | Greeting message | check | check |

Targets once a platform is chosen: first audio under 1 second after the caller stops speaking (p50), under 1.8 seconds (p95). These are goals, to be measured in Phase 2.

## 8. Phased plan with acceptance criteria

**Phase 0: foundations (1 to 2 weeks)**
- Twenty multi-workspace up on a server with wildcard TLS. Two test workspaces.
- Call service skeleton, Postgres, Redis, tenant registry.
- Done when: a script creates a tenant record, installs the app schema into a workspace, and stores the key and secret. Creating the workspace by hand is acceptable in this phase (automated provisioning is unverified).

**Phase 1: one call, end to end (1 to 2 weeks)**
- One Twilio number, one scripted agent, transcript saved, Call row visible in Twenty.
- Done when: a scripted test call completes, the Call appears in Twenty with `providerCallId`, outcome, summary and recording link within 60 seconds of hangup, and a repeated webhook creates no duplicate.

**Phase 2: real inbound behavior (2 to 3 weeks)**
- Knowledge base answers, take message, after-hours policy, transfer with fallback, booking via Cal.diy.
- Done when: five scripted scenarios pass (FAQ answer, booking, message, successful transfer, failed transfer falling back to a message) and p50 first-audio latency is under 1 second on a network-sampled test set of 20 calls.

**Phase 3: multi-client and operations (2 to 3 weeks)**
- Per-tenant config UI or admin API, consent and retention policy per tenant, notifications, monitoring and alerting, sync retry with dead-letter queue.
- Done when: two tenants run concurrently with no data crossing, a Twenty outage for 10 minutes loses no calls (they sync after recovery), and a retention job deletes expired recordings.

**Phase 4: hardening**
- Load test (target to be set from expected client call volume), security review, backup and restore drill, runbooks.

## 9. Risks

| Risk | Impact | Mitigation |
|---|---|---|
| Twenty rate limit (100 rpm per workspace?) | Sync backlog | Queue, batching, token bucket, no Twenty in call path |
| Latency stacking (STT, LLM, TTS, network) | Calls feel robotic | Streaming everywhere, regional hosting, latency budget per stage |
| Recording consent laws | Legal exposure | Per-tenant consent flow, jurisdiction setting, counsel review |
| PII in transcripts | Breach impact | Encrypt at rest, access control, redaction option, retention limits |
| Twenty app install across workspaces unclear | Provisioning work | Scripted per-workspace install fallback |
| AGPL boundary | License exposure | API-only integration, no Twenty source changes, legal check |
| Webhook replay or duplicates | Duplicate records | HMAC with raw body, timestamp window, idempotency keys |
| Platform lock-in (voice) | Rework | `VoiceProvider` interface |
| Telephony fraud and spam calls | Cost | Per-number rate limits, blocklist, spend alerts |

## 10. Open decisions

| # | Decision | Default |
|---|---|---|
| 1 | Voice runtime | LiveKit Agents; Vapi or Retell if speed to first call matters more than control |
| 2 | Calendar and booking | **Decided:** self-hosted Cal.diy. Open: production go or no-go before launch; multi-staff routing |
| 3 | Jurisdiction(s) of callers and clients | Unknown; consent and retention are configurable per tenant. **Needed from you.** |
| 4 | Follow-ups in Twenty workflows or in our own worker | Own worker first (testable, versioned); move to Twenty workflows later if clients want to edit them |
| 5 | Telephony vendor | Twilio |
| 6 | Hosting region and cloud | Not chosen |
| 7 | Expected call volume per client | Not known; sets load targets in phase 4 |

## 11. Not yet verified (checklist before Phase 0)

See [SPIKES.md](SPIKES.md) for what the docs, source review and the Codespaces runtime spike settled. Verified: app sync, signed ingest, idempotency. Not verified: multi-workspace installs, `writability` enforcement, Cal.diy, voice latency. New concern from that review: app `serverVariables` are per registration, not per workspace, so the per-workspace ingest secret may need to be set another way (post-install hook, key-value store or a header-based scheme). Check before Phase 0.

- [ ] Twenty Apps: installing one app across many workspaces (`operations/publishing.mdx`, `sync-and-recovery.mdx`).
- [ ] API key scope: one workspace per key?
- [ ] Phone filter syntax in Twenty's REST and GraphQL.
- [ ] Multi-workspace provisioning automation.
- [ ] Cal.diy: user isolation, availability and booking API, API auth, and the production go or no-go.
- [ ] Google and Microsoft OAuth app verification requirements and lead time.
- [ ] Remaining "check" cells in the section 7 table, on the chosen platform.
- [ ] Logic function route auth: does an API key satisfy `isAuthRequired: true`, and what is the timeout ceiling?
- [ ] Twenty phone field storage format and filter syntax.
- [ ] Twenty rate limit: per workspace or per instance, and configurable on self-hosted?
