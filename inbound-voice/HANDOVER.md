# Handover: AI inbound-call platform (read this first)

Written 2026-10-15 and extended 2026-10-16, for the next Claude chat. START WITH SECTION 0. Read this file, then `ARCHITECTURE.md`, `BOOKING.md` and `SPIKES.md` in the same folder. This file is the map; those are the detail. Nothing secret is in this file or the repo: where a secret lives it says where, never what.

## 0. STATE AT A GLANCE (updated 2026-10-16 night: read this first, it overrides older sections where they conflict)

Sections 1 to 12 were written on 2026-10-15; sections 13 to 19 at the end of this file were added on 2026-10-16 and are newer. Detail on each topic is in `ARCHITECTURE.md`, `BOOKING.md`, `SPIKES.md`, `twenty-app/README.md`.

### What exists and works (all verified unless marked)
- **A real phone call works end to end.** Caller -> Voiso number +44 20 3097 2037 (trial, ends about 2026-10-29, only the user's registered phone can call it) -> Cloudonix SIP -> Dograh agent "Sam" for the made-up client **Acme Plumbing** -> our call-service -> Twenty CRM.
- **The agent can:** answer from a knowledge base (`kb/acme-plumbing-faq.txt`, uploaded to Dograh), book, find, move and cancel appointments (by the caller's own number), take messages, handle callback requests and opt-outs. Booking rules (hours, days off, breaks, no double booking, 90-day horizon) are in `call-service/src/localScheduler.ts`.
- **Twenty receives every call** as a Call record with outcome, summary, caller number, and creates a follow-up **Task** (message, callback, failed transfer; never after an opt-out) linked to a Person (`targetPersonId`). Verified on real calls 12, 13 and 78.
- **Tests:** 167 unit tests (`cd call-service && npx vitest run`, `npx tsc --noEmit`) and a 10-scenario self-test through Dograh text chat (`spikes/scenario-test.mjs`, about 3 minutes, details in section 18).
- **Not verified:** the calendar link to a real Google or Microsoft calendar (code exists, mocked tests only); recordings copied to private storage; opt-out and cancel spoken on a real voice call; Postgres storage in the running call-service (it runs in memory: bookings vanish on restart); multi-workspace Twenty; production hosting.

### What the stack is made of (be clear with the user about this, they were confused)
- **Dograh** (open source voice agent platform, BSD licence, v1.49) is the engine: phone line, hear -> think -> speak, agent builder, knowledge base (Files), tools, call-ended webhook, recordings. Its screens show our work: Voice Agents -> the agent canvas (prompts, 7 tools, webhook node), Tools page, Files page, Models page. The user will sell this under their OWN name, so Dograh's name and look will be replaced later.
- **call-service** (`call-service/`, TypeScript) is OUR glue: booking and calendar logic, message and outcome facts, follow-up planning, the signed write to Twenty. Dograh calls it (tools on `localhost:3100` inside the Codespace) and it calls Twenty. Dograh has no calendar or CRM of its own.
- **Twenty CRM** is the CRM (self-hosted, `twentycrm/twenty-app-dev`, port 2020), with our small Twenty app (`twenty-app/`): `Call` object, `ingest-call` function (Person, Task, link).
- **Nothing is trained.** It is prompt + tools + knowledge + settings, tested by calls. `spikes/provision-real-agent.mjs` writes the agent's prompt, tools and webhook through Dograh's API (safe to re-run; it starts from the live definition so editor changes survive).

### Live configuration right now (Codespace "bookish adventure", user's GitHub account)
- Dograh Models page (organisation default): Dograh mode, voice **Cora** (British), speed 1, language **English (UK)**, LLM tier **accurate**, temperature unset. The per-agent voice override was removed, so this page is the one place for voice.
- Agent: workflow 1, published (v9 or later), 7 tools, knowledge base document attached to "Main Agenda and Questions", call-ended webhook to the call-service.
- Twenty app: latest `call.object.ts` and `ingest-call.ts` applied (field `followUpTaskId`).
- Commits: branch `inbound-voice`, last PUSHED commit `9cf81d5`. Local commits `4fbcd33` and `125d3da` (message wording, handover notes) and this edit are NOT pushed. The user approves every push individually: ask first. The repo is public: never commit secrets.
- **Codespace needs the 125d3da code pulled and the call-service restarted** to get the message-wording fix (harmless if not).

### How to bring the stack back (after the Codespace stops)
Start it by opening the web editor `https://bookish-adventure-q7wggwjrrrpg34gr4.github.dev/`. Then in its terminal (details in section 9, plus):
1. Dograh: `cd /workspaces/ClientDemo/inbound-voice/spikes/.work/dograh && REGISTRY=ghcr.io/dograh-hq ENABLE_TELEMETRY=false docker compose up -d`.
2. Twenty: `docker start twenty-app-dev`, wait about 60 seconds, check `curl localhost:2020/healthz`.
3. `git pull -q origin inbound-voice`; stop the old call-service (`pkill -f "src/main.ts"`); copy `/tmp/call-service.log` if you need it (a restart overwrites it); start the new one with the command in section 9. Keep it running between test calls (memory storage).
4. The user sets port **8000 to Public** in the Ports tab (the harness blocks making ports public). Set it back to Private and stop the Codespace when done.
5. To (re)apply the agent: run `provision-real-agent.mjs` inside the Codespace with the login read from `.work/dograh-login.txt` in the shell (never print it); to apply Twenty app changes copy the two files from `twenty-app/src` into `.work/app-spike/src/...` and run `yarn twenty apply` there. The working Twenty key is in `~/.twenty/config.json` (remote `local`); `.work/twenty-apikey.txt` is an expired token.

### Working quirks (will save you hours)
- **Claude in Chrome** drives the user's signed-in Chrome (Codespace editor, Dograh UI on port 3010). The Codespace editor tab **freezes** when a screenshot is taken right after a command prints: wait 10 seconds first, reload the tab (`navigate` to the editor URL) if it hangs, keep terminal output short (use `cut`, `grep`, `head`), run long things with `nohup ... > /tmp/x.out &` and read the file later.
- Dograh run pages (`/workflow/1/run/<id>`, readable with `get_page_text`) show the transcript, per-reply "Reasoning Delay", tool calls and arguments. Text-chat runs have no delays. `/usage` lists runs. The Models page voice, language and tier can be set with the UI; a native `<select>` is set most safely with `form_input`.
- The Files page upload fails in the browser (storage URL is `localhost:9000`): use `spikes/upload-kb.mjs` inside the Codespace, then attach the document on the agent node and publish.
- **Do not write scripts through bash heredocs or `python -c` with backslashes**: `\b` became a backspace character twice. Use the Write tool, then run the file.
- The harness blocks making a port public and entering passwords. The user does those. Never print secrets; one Twenty dev token was printed on screen by mistake (expired).
- Dograh run ids restart if its database is rebuilt, so Twenty `dograh:<id>` rows can collide with old test rows.
- The probe Call `probe:1` in Twenty cannot be deleted through the API (writability works); ignore it.

### The user and how to work with them
- Marketing agency; they will sell this as ONE integrated platform under their own name (Dograh engine + Twenty CRM + calendar). Not a developer: wants things done for them, plain explanations, honest status. Use Dograh's built-in features first; build only the glue. Typing in the chat box beats reply buttons (buttons send only their first line).
- They asked to **see the CRM working in the front end** and later a bespoke design ("inspiration to come, a weekend job"). Do not spend effort on visual design yet.

### NEXT STEPS (in this order)
1. **Front end (user's request):** fork or wrap Dograh's Next.js front end (repo `dograh-hq/dograh`, UI in its `ui` folder; the Codespace runs it as the `dograh-ui` container on port 3010) and add two left-sidebar items under "Build": **CRM** (opens Twenty, port 2020, ideally embedded or deep-linked to Calls and Tasks) and **Calendar** (a bookings view from the call-service: needs a small read endpoint over the `bookings` table, per tenant and token protected). Keep changes in a few isolated files so Dograh updates can still be merged. Branding and design come later. Renaming the model tiers ("accurate" etc.) can only happen in our own front end: show Standard / Precise / Fast and map them to Dograh's values in one file.
2. **Latency and voice:** accurate tier averages about 1.47 s reply delay (default about 1.18 s); retrieval turns reach 2.5 s. Options: try the "fast" tier plus the key facts also written into the agent instructions; provider keys via Dograh Providers/BYOK (user enters keys; Groq for the model, Deepgram for hearing and speaking, ElevenLabs or Cartesia for a more natural voice); Dograh also has a Realtime (speech to speech) mode (OpenAI Realtime, Gemini Live, etc. need a provider key; Claude cannot do audio). Measure from "Reasoning Delay" on call run pages after each single change. Speech and voice time are not in those numbers.
3. **More backend testing on real voice calls:** cancel, opt-out spoken, info-only, an after-hours call, the move flow, and a name that is hard to hear (agent should spell back). Check each in Twenty. Re-run the self-test after any prompt change. Known open points: agent sometimes skips `record_outcome opted_out` (transcript safety net catches it); the call-out price answer from the knowledge base was missed once in 4.
4. **Persistence:** give the call-service a Postgres `DATABASE_URL` so bookings and the post-call queue survive restarts; move tenants from the JSON file to the database with encrypted secrets.
5. **Calendar:** link a real Google or Microsoft calendar. Needs the user to create a Google Cloud OAuth app (and a Microsoft Entra app); Google may take weeks to verify calendar scopes, start early. Optionally show bookings in the new Calendar sidebar view first (no OAuth needed).
6. Later: per-client provisioning script, multi-workspace Twenty, recording consent and retention, transfer to a human, outbound campaigns, notifications, hosting (cloud VM, domain, TLS, backups), legal review (AGPL position, recording consent, whether Dograh's licence allows rebranding: believed BSD-2, not read in full).

### Housekeeping debts for the user (unchanged)
Reset the voice of agent "Tanya" on app.teamfollowup.ai to Lucy (UK); delete Dograh telephony config 2 (user's Twilio keys) and consider rotating the Twilio token and Voiso key; set Codespace port 8000 back to Private; stop the Codespace when idle; Voiso trial ends about 2026-10-29. The Dograh knowledge base sends uploaded documents to Dograh's managed processing service: fine for the made-up FAQ, a privacy point for real clients.

## 1. Who and what

- **The user** is building a product like "Team Followup" (an AI voice receptionist platform, app.teamfollowup.ai): AI answers **inbound calls for clients** (businesses), books appointments, takes messages, and logs every call to a CRM. They have the idea but lacked the full approach. They are not a developer by trade and want things **done for them**. They asked for a full understanding of the product, then a build plan, then a working prototype.
- **Decisions the user made and confirmed**
  - Stack: **Twenty CRM** (self-hosted, multi-workspace, one workspace per client) + **Dograh** (open-source voice AI platform) + our own **call-service** (glue, TypeScript) + the **client's own Google/Microsoft calendar** for booking.
  - Cal.diy was chosen, then **dropped** (see 6.4). Booking now uses our own slot logic plus the client's calendar.
  - Every spike or test on a shared system must be **removed afterwards** ("test and revert back") unless it is part of the build.
  - The **real phone-call test comes last** ("booking then it would last last"). That point has now been reached and a first real call works.
  - They do **not** want to create accounts themselves ("dont make me make accounts... you are wasting my time"): create throwaway accounts yourself through local APIs. They *will* enter secrets (Twilio keys etc.) into forms themselves.
  - They want the design documented in the repo.
- **Preferences to respect**
  - Ask before every `git push` (they approved each push individually). Commit locally freely.
  - Reply buttons in this app only send their first line: **tell the user to type or paste anything important into the chat box itself.** Many replies arrived empty because of this.
  - Never enter passwords, API keys, payment details, or sign in to forms for them (platform rule). Say so briefly and tell them the exact steps. Creating throwaway accounts via a **local/own API** with generated credentials has been accepted.
  - Their memory index has two unrelated entries (website design rules, a Doves UK site). Not relevant here.
- **Still outstanding on the user's side:** reset the voice on app.teamfollowup.ai agent "Tanya" back to Lucy (UK) (an earlier accidental change that I was not allowed to restore); stop the Codespace when done; set Codespace port 8000 back to Private.

## 2. Where everything is (answer to "is it hosted online?")

**Nothing is hosted in production. Nothing runs on the user's own PC.** The PC cannot run Docker (virtualization is disabled in BIOS; the password is unknown and I did not bypass it). Everything runs in a **GitHub Codespace**, a temporary cloud development machine, plus third-party trial services:

| Piece | Where it runs | Notes |
|---|---|---|
| Source code | Public GitHub repo `aadithyask99-boop/ClientDemo`, branch `inbound-voice`, folder `inbound-voice/` | Last pushed commit: `6394f6f`. The repo is **public**: never commit secrets. `.work/`, `.env`, `node_modules/` are gitignored. |
| Dograh (voice AI platform) | Docker Compose inside the Codespace, `inbound-voice/spikes/.work/dograh` | Containers: dograh-api-1, dograh-ui-1, dograh-postgres-1, dograh-redis-1, minio. Host networking (Docker bridge networking is broken in Codespaces). |
| call-service | `npx tsx src/main.ts` inside the Codespace, port 3100, started with `nohup` | **Dies when the Codespace stops.** Uses in-memory storage (no `DATABASE_URL`). |
| Twenty CRM | `twentycrm/twenty-app-dev` container on port 2020 in the Codespace, plus an unused main compose stack in `.work/twenty` | **Port 2020 was not answering at the end.** Unverified whether it is running. |
| Voice models (LLM, speech-to-text, text-to-speech) | Dograh's **hosted** "dograh" provider (services.dograh.com), free, no keys | Slow and not natural (see 8). Using it is a dependency on their hosted service. |
| Telephony | **Voiso** trial (UK number) -> SIP -> **Cloudonix** SIP domain provisioned by Dograh -> our Dograh agent | Details in 5. |
| Codespace | Name "bookish adventure", 4 cores, 16 GB RAM, 32 GB disk. Web editor: `https://bookish-adventure-q7wggwjrrrpg34gr4.github.dev/` | **Auto-stops when idle** (it did once during the work). Uses free monthly hours. |

Codespace port map (URL pattern `https://bookish-adventure-q7wggwjrrrpg34gr4-<port>.app.github.dev`):
- **8000** Dograh API: **PUBLIC** (needed so the Dograh web page and webhooks work from outside). Set it back to Private when finished.
- **3010** Dograh web UI (private; reachable from the user's GitHub-signed-in browser).
- **3100** call-service (private).
- **2020** Twenty app-dev (private; not answering at the end).
- **After any Codespace restart, forwarded ports are dropped and must be re-added in the Ports tab; processes must be restarted** (commands in section 9).

So the honest status: the prototype works end to end for a phone call, but it is a **development setup on a temporary machine**, not a deployed product. A real deployment needs a cloud VM or similar, a domain, TLS, backups, secrets handling and monitoring (section 12).

## 3. The product plan and architecture (short; full version in `ARCHITECTURE.md`)

Goal: a multi-client platform. Each client gets a phone number, an AI receptionist trained on their business, calendar booking on their own calendar, message taking, transfer to a human (planned), and every call logged in a CRM workspace they can see.

Key decisions (numbered as in `ARCHITECTURE.md` section 1):
1. **Twenty stays out of the live call path.** The voice runtime and call-service answer calls without calling Twenty; Twenty is the system of record written to *after* the call. A CRM outage must never drop a call.
2. **Each entity has one system of record** (calls in Twenty; bookings in our Postgres/the client's calendar; tenants in our registry).
3. **Tenant registry** maps a dialed number to a client (tenant), their Twenty workspace, webhook token, booking hours, calendar.
4. **Twenty side is a Twenty App** (`twenty-app/`): a `Call` object plus an HTTP-route function `ingest-call` that verifies an HMAC signature over the raw body and upserts on `providerCallId`.
5. **Voice platform: Dograh leading, LiveKit Agents as fallback**, behind a `VoiceProvider` idea.
6. **Booking runs through HTTP tools on the call-service** behind a `Scheduler` interface: `LocalScheduler` (own slot rules) and `CalendarScheduler` (client's Google/Microsoft calendar).
7. **Licence**: Twenty is AGPLv3 with an "Application Exception": talking to it only via its API/webhooks keeps our service free to use any licence. Do not fork Twenty. Have a lawyer confirm before reselling.

Call flow today:

```
Caller's phone
  -> Voiso number (trial, UK London +44 20 3097 2037)
  -> Voiso inbound workflow "Dograh AI receptionist" (one Route step -> SIP URI)
  -> Dograh's Cloudonix SIP address  <uuid>.sip.cloudonix.net  (UDP/TCP 5060, TLS 443)
  -> Dograh agent (workflow 1: global prompt, "start call", "Main Agenda and Questions", "End Call")
        tools (HTTP, from inside the Codespace) -> call-service on localhost:3100
             /tools/availability  /tools/book  /tools/message  /tools/outcome
        call ends -> webhook node -> call-service /webhooks/dograh (bearer token)
                      -> outbox queue -> artifact copy (recording/transcript to private storage)
                      -> signed POST to Twenty  /s/ingest-call  -> Call record (upsert on providerCallId)
```

Entities / outcome codes: `BOOKED, MESSAGE_TAKEN, TRANSFERRED, TRANSFER_FAILED, INFO_GIVEN, CALLBACK_REQUESTED, OPTED_OUT, NO_OUTCOME`. Outcome precedence (decided in `server.ts`/`booking`): booking tool > opt-out found in the transcript (caller's lines only) > outcome the agent stated through `record_outcome` > message taken > platform disposition > extracted `outcome` variable.

## 4. The code (all in `inbound-voice/`, 101 tests pass, `tsc` clean)

`call-service/` (TypeScript, Fastify, zod, vitest). Run tests: `cd call-service && npx vitest run`. Database tests use PGlite by default; with `TEST_DATABASE_URL=postgres://...` they run on a real Postgres (the vitest config then runs files one at a time).

| File | What it does |
|---|---|
| `src/server.ts` | Routes: `GET /healthz`, `POST /webhooks/call-ended` (HMAC), `POST /webhooks/dograh` (bearer token, per tenant), tools `POST /tools/availability|book|message|outcome` (bearer token). Returns 500 (not 202) if the call could not be stored, so the provider retries. `makeCrmHandler` is shared with the durable queue. |
| `src/main.ts` | Reads env: `PROVIDER_WEBHOOK_SECRET`, `TENANTS_FILE`, `ARTIFACT_DIR`, `ARTIFACT_ALLOWED_HOSTS`, `PORT`, `DATABASE_URL`, `GOOGLE_CLIENT_ID/SECRET`, `MS_CLIENT_ID/SECRET/MS_AUTHORITY`. With `DATABASE_URL` it uses Postgres for bookings, call facts and the queue; without it, memory (lost on restart). |
| `src/types.ts` | `Tenant` (twenty baseUrl/apiKey/ingestSecret, `numbers`, `dograhWebhookToken`, `booking{timeZone,days,open,close,slotMinutes,minNoticeMinutes}`, `calendar{provider,refreshToken,calendarId?}`), `CallRecord`, outcome list. |
| `src/dograh.ts` | Maps the Dograh webhook payload to a `CallRecord` (`providerCallId = dograh:<run_id>`). |
| `src/tenants.ts` | In-memory tenant registry: by dialed number, id, or Dograh token hash. **Tenants still come from a JSON file.** |
| `src/booking.ts` | `check_availability` (accepts `day` words like "next tuesday" and works out the date itself with `resolveDay`; also `date` and `part_of_day`), `book_appointment`. Calendar unreachable -> returns no slots and tells the agent to take a message. |
| `src/localScheduler.ts`, `bookingStore.ts` | Own slot logic (time zone, DST, hours, notice, no double booking). Store is in-memory or Postgres with a unique key on (tenant, start): atomic booking across processes. |
| `src/calendar.ts`, `calendarScheduler.ts` | `GoogleCalendarClient` (OAuth refresh token, freeBusy, events.insert) and `MicrosoftCalendarClient` (Graph calendarView, events). `CalendarScheduler`: offered slots minus busy time; reserve in our DB, then write the event; if the calendar write fails release the slot. **Tested with mocked HTTP only, never against a real Google/Microsoft account.** |
| `src/callTools.ts`, `facts.ts` | `take_message` and `record_outcome` tools; per-call "facts" (booking, stated outcome, message) in memory or Postgres. |
| `src/queue.ts`, `pgQueue.ts` | In-memory retry queue and the durable Postgres outbox queue (claim with `FOR UPDATE SKIP LOCKED`, backoff up to hours, dead letters, scrubs payload after success). |
| `src/db.ts` | Schema (`bookings`, `call_facts`, `outbox`) and `migrate` (one transaction under an advisory lock, safe when several processes start at once). |
| `src/artifacts.ts`, `signals.ts` | Copies recording/transcript into private storage (`artifact://` keys, never public links) and runs the transcript opt-out regex safety net (English only). |
| `src/crm.ts`, `signing.ts`, `phone.ts` | Signed ingest to Twenty, HMAC helpers, `toE164` (libphonenumber; handles `447824678418` without a plus sign). |

`twenty-app/` = the Twenty App source (Call object, `ingest-call`). It was applied to the Twenty dev server in an earlier spike. TODO there: link caller to a Person, create Message/Task records.

`spikes/` = scripts, most already run once:
- `provision-real-agent.mjs` **(the important one)**: rebuilds the Dograh agent for real calls through Dograh's public API. Fixes the generated agent's early hang-up, adds the four tools and the call-ended webhook, sets a British voice override, saves a backup of the original, and is safe to re-run. Needs env `DG_API`, `DG_EMAIL`, `DG_PASSWORD`, `WEBHOOK_TOKEN` (must equal the tenant's `dograhWebhookToken`), `WORKFLOW_ID`, `BACKUP`. Run it from the user's PC against the public API; the tool and webhook URLs it writes are `http://localhost:3100`, which Dograh reaches from inside the Codespace.
- `dograh-chat-test.mjs`, `dograh-run-results.mjs`, `dograh-latest.mjs`: drive the agent through Dograh text chat and read run results (usage in their first line). Text chat does **not** test voice or latency.
- `dograh-up.sh` / `dograh-down.sh`: start/remove Dograh in a Codespace (`PUBLIC_API_URL` sets Dograh's public address). `twenty-up.sh`, `e2e-*.sh/mjs`, `ingest-direct.mjs`: earlier spikes.

## 5. Accounts and services (no secrets here)

- **Dograh** (self-hosted in the Codespace). One organisation. Login is a **throwaway** created by me, saved in the Codespace file `inbound-voice/spikes/.work/dograh-login.txt` (email owner@spike-inbound.dev). Agent = workflow **id 1**, "Inbound receptionist for a small UK business - inbound" (persona "Sam", company "Acme Plumbing", UK hours Mon-Fri 9-5). Telephony configuration **1** = "Dograh Cloudonix SIP" (our inbound path; phone number +442030972037 added with inbound workflow = agent 1). Telephony configuration **2** = Twilio, saved with the user's own Account SID/Auth Token (see Twilio below). Run history: #1, #2 early test calls, #3-#6 text chats, **#7 and #8 real calls**.
- **Voiso** (trial, expires about 2026-10-29; started 2026-10-15). UK London number **+44 20 3097 2037** (free, 4 channels). **During the trial only the user's registered phone can call it**; a call from any other number is blocked (heard as a busy tone). Workflow "Dograh AI receptionist" (Inbound call workflow, id `e12de517-b4a5-46f9-ad4d-c55cfe657b6b`): Start -> Route -> SIP URI `+442030972037@<dograh Cloudonix inbound hostname>` (hostname is shown on Dograh's telephony config 1 under SIP connectivity). Assigned to the London number, Active. The user's Voiso API key exists but is not used.
- **Twilio** (trial, user's account): **a dead end**. The "From" number in Twilio's Try-out panel is a shared sandbox number, not owned by the account, and Dograh refuses it ("not owned by this Twilio account"). A real inbound number needs a paid upgrade, which the user refused. The user's SID/Auth Token are saved in Dograh config 2: delete that config at the end.
- **Cloudonix**: provisioned by Dograh for the organisation. The Cockpit binding step in Dograh's checklist ("bind its DNID to the Voice Application in your Cloudonix Cockpit") turned out **not needed** for the call to connect.
- **Twenty**: dev server (`twenty-app-dev`) with a throwaway admin and API key created via its `/metadata` API; files are in the Codespace `.work/` (twenty-admin.txt, twenty-access.txt, twenty-apikey.txt, ignored by git). Ingest secret for the dev app is the non-secret test value in the app variables.
- **Google Cloud / Microsoft Entra OAuth apps: not created.** Needed for live calendars (the user, or the platform owner, must create them).

## 6. What has been done (chronological, with the lesson from each)

1. **Research.** Looked at the REA tool (morluto/rea) and the Team Followup front end through the user's logged-in Chrome. Declined to extract their implementation (commercial terms); built a feature-level understanding instead (campaigns, agents, voices, telephony, CRM). Wrote `ARCHITECTURE.md`.
2. **Twenty spike.** Self-hosted Twenty in a Codespace (host networking fix). Built the Twenty App (`Call` object, signed `ingest-call` function). Verified: signed ingest, 401 on bad signature, idempotent upsert, `new Response(...)` needed to set status codes, LINKS fields reject `artifact://` so recording/transcript keys are TEXT fields, a field type cannot be changed in place.
3. **Dograh spike and bridge.** Dograh webhook -> call-service -> Twenty verified end to end in text chat. Recording/transcript copied to private storage. Outcome handling: text chat overwrites the stored disposition, so outcomes now come from our own tools plus a transcript opt-out safety net (`BOOKING.md`).
4. **Booking tools.** Four HTTP tools on the call-service; booking, closed day, message, callback, opt-out scenarios passed in text chat (callback and opt-out needed prompt/safety-net fixes).
5. **Persistence.** Bookings, call facts and the post-call queue in Postgres (`DATABASE_URL`). 23 database tests pass on PGlite and on a real Postgres 16 through `pg` (found and fixed a start-up race in `migrate`).
6. **Cal.diy tried and dropped.** Its README's build flag fails on the Dockerfile; with BuildKit the build used almost all of the Codespace's 32 GB disk and still did not finish; it is labelled non-production. Replaced by direct Google/Microsoft calendar clients (`calendar.ts`) in front of our own slot logic. Twenty's own calendar feature only syncs events (shows them on records); it has no availability lookup, so it is not the booking engine.
7. **Voice platform and telephony.** Free LLM/STT/TTS options researched. Twilio trial: dead end (above). Voiso trial worked: number + inbound workflow + SIP route to Dograh's Cloudonix address. **First real call connected**; the agent answered as Sam.
8. **Dograh behind a public address.** The web UI called `http://localhost:8000` from the visitor's browser and sign-in failed. Fix: set `BACKEND_API_ENDPOINT` in Dograh's `.env` to the public port-8000 address and recreate the api and ui containers (now supported in `dograh-up.sh` via `PUBLIC_API_URL`).
9. **Agent rebuild.** The Agent-Builder agent ended the call after "Hi. What is this about?" (edge conditions to End Call too eager). `provision-real-agent.mjs` fixed that, attached the tools and the webhook, and set a British voice override (see 7).
10. **Date bug.** The model asked for Wednesday for "next Tuesday". `check_availability` now accepts the caller's words (`day`) and resolves the date from the real clock in the tenant's time zone; wrong model dates are ignored when `day` is given.
11. **Real call #8** (131 s): greeted, took a name, offered slots, handled "today" (closed) and "8 AM" (before opening), booked Friday 16 Oct 09:00 for "Nim", handled a second issue, ended politely. Run result: disposition `booked`, outcome `booked`, recording and transcript exist.

Commits on `inbound-voice` (all pushed): `77eaea7` booking docs, `2d63975` Postgres storage, `9c1f66f` durable queue, `bff371f` migrate lock, `fcadbf8` test config, `2fb23d9` own calendar (Cal.diy removed), `6394f6f` day resolution + provisioning script. **This handover file and the three `dograh-*.mjs` helpers are new and uncommitted** until the user approves a commit/push.

## 7. Last conversation (where we stopped)

- The user made call #8 and gave only: earlier call "disconnected when I was answering. There was a bit of latency and voice wasn't natural" (that was call #2, before the rebuild). After call #8 their notes arrived **empty** (reply-button problem). I read the run from Dograh's side and reported: booking worked; per-reply model "reasoning delay" 0.85 to 1.9 s (mostly 1 to 1.4 s); the dripping taps/leak detail the caller added was **not saved** (the agent called `record_outcome` with `info_given` and said "I've noted the leaking taps", but nothing stored the detail); Twenty record creation **unverified**; the British voice (Lucy - Capable Coordinator, `dg_voice_299092d9e90ab2b05c47`) **unverified**.
- I asked: "What did the voice and delay feel like to you?" **Unanswered.** Then the user asked for this handover.
- Also asked by the user in the last message: "whole app is hosted online, not locally, right? Anything else?" Answered in section 2 and section 12.

## 8. Known problems and what to do about them (in priority order)

1. **Lost extra details.** Change the agent prompt (edit `AGENT_RULES` in `spikes/provision-real-agent.mjs`, rerun it): extra issues must go into the booking `reason` or a `take_message`; `record_outcome` alone must not be used when the caller gave new information.
2. **Twenty not verified/not running.** Port 2020 did not answer after the Codespace restart. Start `twenty-app-dev`, confirm the app is applied and the `calls` object exists, and check the call arrived (the call-service logs `crm-write ok|retry|dead` lines to `/tmp/call-service.log`; **the call-service has no `DATABASE_URL`, so its queue is in memory and failed writes are lost on restart**). Consider giving the call-service a Postgres and `DATABASE_URL` (Dograh's Postgres container is a separate DB; a new one is simplest).
3. **Latency and voice quality.** Dograh's free bundled stack is slow and flat. Options: own provider keys (Deepgram speech-to-text and text-to-speech share one $200 credit; Groq for the LLM has a free tier) via Dograh's provider connections / model configurations page (v1.49 has `/model-configurations`; the API has `NamedModelConfiguration` and `provider_connection_uuid`; **not yet explored**). The per-agent voice override is `workflow_configurations.model_configuration_override.tts.settings.voice`; the organisation-wide `/user/configurations/user` ignored a voice change. Also unknown: Codespace region and the Voiso/Cloudonix path add delay.
4. **Codespace is fragile.** It stops when idle, drops port forwarding on restart, and the browser-based editor tab freezes under load. See section 10.
5. **Call-service state is in memory** unless `DATABASE_URL` is set (bookings, facts, queue). Bookings made in tests (Tue 20 Oct 09:00, Wed 21 Oct 09:00, Fri 16 Oct 09:00 etc.) are in memory only and vanish on restart.

## 9. How to bring everything back after the Codespace stops

The user must click "start" for the Codespace in GitHub (or just open its web editor URL). Then, in the Codespace terminal, in this order. **I could not read terminal output through the browser; ask the user to run commands and type the output into the chat box.**

1. Restart Dograh (containers persist; `BACKEND_API_ENDPOINT` is already in `.work/dograh/.env`):
   `cd /workspaces/ClientDemo/inbound-voice/spikes/.work/dograh && REGISTRY=ghcr.io/dograh-hq ENABLE_TELEMETRY=false docker compose up -d`
2. In the **Ports** tab: forward 8000 and 3010, set 8000 to **Public** (the user does this; my automated tab froze on the Ports panel). Check `https://bookish-adventure-q7wggwjrrrpg34gr4-8000.app.github.dev/api/v1/health` returns 200 from outside.
3. Update code and start the call-service (tenant file lives at `inbound-voice/spikes/.work/tenants.json`; it holds the webhook token that must match Dograh's credential; if it is missing, recreate it with a **new** token and rerun the provisioning script with that same token):
   `cd /workspaces/ClientDemo && git pull -q origin inbound-voice; cd inbound-voice/call-service && (PORT=3100 PROVIDER_WEBHOOK_SECRET=unused TENANTS_FILE=$PWD/../spikes/.work/tenants.json ARTIFACT_DIR=$PWD/../spikes/.work/artifacts nohup npx tsx src/main.ts > /tmp/call-service.log 2>&1 &)`
   First run on a fresh checkout needs `npm install --no-audit --no-fund` in `call-service`.
   Tenant file shape: `[{"id":"acme","name":"Acme Plumbing","defaultRegion":"GB","twenty":{"baseUrl":"http://localhost:2020","apiKey":"unused","ingestSecret":"spike-test-secret"},"numbers":["+442030972037"],"dograhWebhookToken":"whk_<random hex>","booking":{"timeZone":"Europe/London","days":[1,2,3,4,5],"open":"09:00","close":"17:00","slotMinutes":30}}]`
4. Start Twenty's dev server if needed (see `spikes/twenty-up.sh`; `twenty-app-dev` was on 2020).
5. Test with text chat from the user's PC (no Codespace terminal needed): `DG_API=https://bookish-adventure-q7wggwjrrrpg34gr4-8000.app.github.dev/api/v1 DG_EMAIL=... DG_PASSWORD=... node spikes/dograh-chat-test.mjs`. The password is in `.work/dograh-login.txt` in the Codespace (ask the user; do not paste it in files).
6. Then a real call from the user's registered phone to +44 20 3097 2037; read results with `dograh-latest.mjs` and the Dograh run page `https://bookish-adventure-q7wggwjrrrpg34gr4-3010.app.github.dev/workflow/1/run/<id>` (transcript, reasoning delays, tool calls).

Note: a text-chat run proves the tools and prompt; it cannot prove voice, latency or recordings.

## 10. Working tips and environment quirks (learned the hard way)

- Tools: the **Claude in Chrome** extension drives the user's signed-in Chrome (Codespace editor, Dograh UI, Twilio, Voiso). Load its tools with one ToolSearch call. Tab ids change; create a new tab for new sites. The **built-in browser is not signed in** to GitHub.
- The Codespace web editor tab **freezes** under load (screenshots time out): reload the tab, use waits, avoid screenshots right after heavy commands. Terminal output cannot be read via screenshots or `get_page_text`; writing output to a file and opening it did not work reliably. Better channels: (a) the **Dograh API/UI** (`get_page_text` on the run page works), (b) calling the **public Dograh API from the user's PC** with Node (that is how I provisioned and tested), (c) asking the user to paste output.
- Dograh API facts: base `<public8000>/api/v1`; login `POST /auth/login` returns `token`; `GET /workflow/fetch/1`; `PUT /workflow/1` with `workflow_definition` and `workflow_configurations`; `POST /workflow/1/publish`; tools `POST/PUT /tools/`; text chat `POST /workflow/1/text-chat/sessions` (+ `/messages`, `/end` needing `{}`); run info `GET /workflow/1/runs/<id>` (`gathered_context.tool_results`, `cost_info`, `usage_info`); `GET /user/configurations/voices/dograh` lists 1,003 voices (British ones: Lucy, Cora, Evelyn, Imogen, Julia, Gemma, Oliver, George, etc.). `GET /openapi.json` is under `/api/v1/`.
- Dograh UI facts: Telephony page `/telephony-configurations` (config 1 SIP, config 2 Twilio), agents `/workflow`, runs `/usage`, run page `/workflow/1/run/<id>`.
- The Dograh phone-number form checks ownership with Twilio for Twilio configs only.
- Voiso: Workflow studio is `/flows`; a workflow's builder is `/flows/<uuid>/nodes`; call records `/cdr`; its "Route" node supports Variable, Queue, Agent, PSTN, SIP URI.
- Git: remote is HTTPS with Git Credential Manager; the repo working copy on the user's PC is `D:\Claude\Test\client demo` (folder `inbound-voice`). LF/CRLF warnings are harmless.
- A shell quoting problem broke multi-file python/bash heredocs twice; write scripts with the Write tool and run them.

## 11. Not yet done (the plan from here)

**Next steps (suggested order):**
1. Ask the user how the voice and delay felt; fix lost details (8.1); verify Twenty receives calls (8.2).
2. Reduce latency and improve the voice: provider keys and model configurations (8.3). Compare on a second real call (stopwatch times, voice sound).
3. Persist call-service data: `DATABASE_URL` for the call-service; move the tenant registry to Postgres with **encrypted** secrets (Twenty API keys, ingest secrets, calendar refresh tokens are currently plain text in a file).
4. Twenty side: Person linking (match caller number), Message and Task records, notifications; test **multi-workspace** (app installed in two workspaces), `writability: APPLICATION` enforcement, the server-route trigger (one URL for all tenants), the per-workspace ingest secret problem (app `serverVariables` are per registration, not per workspace).
5. Live calendars: create the Google Cloud and Microsoft Entra OAuth apps (owner's accounts), consent flow to obtain refresh tokens, test free/busy and event creation on a real calendar; Google OAuth verification for calendar scopes may take weeks, start early.
6. Per-client provisioning script (create tenant, Twenty workspace, Dograh agent + tools + webhook, number mapping); Dograh per-number inbound routing (its form says inbound calls "still route by the workflow_id in the webhook URL"; verify with two numbers).
7. Product features from the original plan: knowledge base answers, after-hours behaviour, **transfer to a human with fallback**, voicemail, recording consent and retention, outbound/campaign features (Team Followup has campaigns; not built), a client-facing UI/dashboard.
8. Compliance and jurisdiction input from the user (not yet given): recording consent, opt-out law, data retention, GDPR/PII. The opt-out transcript check is English-only and regex-based.
9. Hosting plan: cloud VM(s) or managed services, domain, TLS, wildcard DNS for Twenty multi-workspace, backups, monitoring, secrets management; production telephony (a paid number from a provider Dograh supports natively, e.g. Twilio, Vonage, Plivo, Telnyx, Cloudonix, Exotel, Vobiz) and own LLM/STT/TTS keys.
10. LiveKit Agents remains the planned fallback if Dograh's quality, latency or control proves insufficient; swapping is intended to be contained behind the voice interface.

**Unverified (do not claim as done):** Twenty receiving a real call; the British voice; recordings from a real call being copied to private storage; Google/Microsoft calendars; Postgres storage in the running call-service (verified in tests only); multi-workspace; the call-service queue under a real outage; concurrency under load.

## 12. Things to flag to the user (anything else)

- **Security.** Codespace port 8000 is public (Dograh API with a throwaway login). The webhook token and Twilio credentials are held in Dograh/the Codespace. The Dograh throwaway password was visible in this chat's tool output, so treat it as burned: it is a test account, but delete or rotate it. Delete Dograh telephony config 2 (user's Twilio keys) and consider rotating the Twilio Auth Token and Voiso API key. Set port 8000 back to Private and stop the Codespace when not testing.
- **Cost and time limits.** The Codespace uses free hours; Voiso trial ends about 2026-10-29; Twilio trial is useless for inbound; free LLM/voice tiers are for testing (several forbid commercial use, and Gemini's free tier may train on data): use **fake test calls only**, never real client calls on these.
- **Single points of dependency.** The free Dograh "dograh" voice/LLM provider and the Cloudonix SIP domain are hosted by Dograh; the prototype breaks if that service changes.
- **The public repo.** Everything committed is public. `HANDOVER.md` deliberately contains no secrets.
- **Legal.** Twenty's AGPL position (section 3 item 7) and call recording/consent need a lawyer's view before real clients.
- **Housekeeping debts:** `ARCHITECTURE.md` section 11 and `BOOKING.md` "Not verified" should be updated whenever a verification item above is closed; `SPIKES.md` is the running log (append, do not rewrite).

## 13. Update 2026-10-16 (second session)

- **User feedback on calls #2 and #8:** voice robotic but acceptable, noticeable delay before replies, the agent said "I'm Sam, an automated caller" repeatedly, it claimed "only next week" yet booked the next day, and the recording could not be downloaded (it sits in Dograh's storage in the Codespace; the copy to private storage has never run on a real call). Voice and delay come from Dograh's free hosted LLM/STT/TTS bundle (the three-model relay is explained to the user: STT, LLM, TTS). Fix path: own keys (Groq for the LLM, Deepgram for STT and TTS, ElevenLabs/Cartesia if the voice is still flat) entered by the user in Dograh. Self-hosting the models needs a GPU server and was judged not worth it yet; whether Dograh can point at self-hosted models is unchecked.
- **Prompt (in `spikes/provision-real-agent.mjs`, NOT yet applied to the live agent):** no more "automated" or repeated introductions; check the exact day the caller asks for before saying nothing is free; never lose details (job details go into the booking reason or `take_message`); new section for cancelling or moving appointments.
- **Scheduler (committed `ea34146`, pushed):** days off, breaks, booking horizon, overlap-safe slots, the booking `reason` is now stored (it was dropped before), find/cancel/reschedule tools (`/tools/find-appointment|cancel|reschedule`) matched on the caller's own number (`caller_number`, preset from `initial_context`), calendar event deletion for Google and Microsoft, outcome rules for cancelled/moved calls. Details in `BOOKING.md`. Text-chat runs have no `caller_number`, so these tools answer "caller unknown" there: test them on a real call or with a simulated `initial_context`.
- **Follow-up (committed locally, see git log):** `followUp.ts` plans a Task per call (message, callback, failed transfer; never after an opt-out); the CRM writer attaches it last. The Twenty side (`twenty-app/`: Person find-or-create, Task, `followUpTaskId` guard) was written without a Twenty server or SDK and is **unverified**; steps in `twenty-app/README.md`.
- **Tests:** 159 pass, `tsc` clean. Still true: nothing has run against a live Twenty, Google or Microsoft account since these changes.
- **To make the live agent match the code (in this order):** start the Codespace; restart Dograh (section 9 step 1) and re-forward ports; start Twenty (`twenty-app-dev`, port 2020) and check it answers; `git pull`; stop the OLD call-service first (`pkill -f "src/main.ts"`, otherwise port 3100 is taken and the old code keeps answering) and start the new one; keep it running between test calls (no `DATABASE_URL`, so bookings live in memory and a restart loses them); re-run `spikes/provision-real-agent.mjs` (it adds the three new tools and the prompt), copy the two Twenty app files across and `yarn twenty apply`.
- **Not built yet:** buffers between jobs, variable-length appointments, a CANCELLED outcome in Twenty, do-not-contact flag on the Person for opt-outs, notifications (email/SMS/Slack) for new tasks, Person link on the Call record itself.

## 14. First real calls with the new build (2026-10-16, runs 9 to 12)

- **Worked on a real call:** booking by day word, find and reschedule by the caller's own number (`caller_number` arrives from telephony without a plus sign and matches), a message with urgent flag, no more "automated" intro, honest answers about other customers' bookings. call-service wrote runs 9 to 11 to Twenty (`crm-write ok`). Reasoning delay per reply still 0.8 to 2.3 s (free hosted model).
- **Bug found on call 11:** the agent offered a slot "2:30 PM" (start `13:30Z`), copied `14:30Z`, and booked 3:30 PM while telling the caller 2:30. Cause: UTC start values in summer. Fix (committed, needs pushing and a call-service restart): offered and returned `start` values are now local with offset (`2026-10-16T14:30:00+01:00`), clock digits equal the label, tested. Prompt also says to read back the tool's label and spell back unclear names (call 9 heard the name "ID").
- **Twenty bug found on call 12:** `createTaskTarget` has no `personId` field (error text "Object taskTarget doesn't have any personId field"). Task link now tries `targetPersonId` then `personId`, failures are warnings. The old code created a Task on each of 5 retries before failing: **delete duplicate "Return message from Christian" tasks (up to 5) in Twenty** and check whether the Person exists once.
- **Not yet checked:** recordings (copy to private storage), transcripts in `.work/artifacts`, the Call / Task / Person records inside Twenty, whether `targetPersonId` is the right field.
- The user was adding provider keys in Dograh's model-configurations page (their own step) to improve voice and delay.

## 15. Twenty checked (2026-10-16, afternoon)

- **Verified with a signed probe record on the running Twenty dev server:** the ingest function creates the Call, a Task (status TODO, due time as sent), saves `followUpTaskId` on the Call, finds or creates the Person, and links them with **`createTaskTarget { taskId, targetPersonId }`** (`personId` is not a field). No warnings were returned. People matching by phone is still unverified (the probe created a new person; an existing one was not looked up).
- **Verified:** `writability: APPLICATION` blocks deleting a Call through REST (400). The probe Call `probe:1` therefore remains in Twenty and can only be removed by the app or from the database; ignore or remove it by hand.
- **Real calls in Twenty:** runs 9, 10, 11 BOOKED, 12 MESSAGE_TAKEN, and 13 NO_OUTCOME, 14 CALLBACK_REQUESTED, 15 OPTED_OUT (made by the user later; transcripts not yet read). One Person "Christian" exists (not duplicated). Call 12 had two duplicate tasks; one was deleted. **Call 14 (callback) has no follow-up task and no `followUpTaskId`**: unexplained, the call-service log for it was overwritten by a restart (the log lives in `/tmp/call-service.log`, so copy it before restarting). It most likely ran before the fixed ingest function was applied. Retest with a new callback call.
- **Gotchas:** the Twenty REST list endpoints cap at 200 rows and the demo workspace already holds 200 tasks and 200 people, so a plain list can miss new rows: fetch by id or filter. The `.work/twenty-apikey.txt` key is no longer valid; the working key is in `~/.twenty/config.json` (remote `local`) inside the Codespace. `twenty-apikey.txt` holds a bare token that was printed on screen once by mistake (dev server, expired).

## 16. Correction and callback result (2026-10-16, later)

- **Correction:** Twenty's `dograh:13`, `:14`, `:15` (and `:1` to `:8`) that I first read as new calls were **leftovers from yesterday's text-chat spikes on an earlier Dograh database**. Dograh's run ids restarted when its database was re-created, so **`dograh:<run id>` collides across Dograh instances and real runs overwrite old rows**. For production prefix the id with a per-instance identifier. The real Dograh run list ends at #13.
- **Real run 13 (callback, 43 s):** worked end to end: `record_outcome callback_requested` -> webhook -> Twenty Call `dograh:13` CALLBACK_REQUESTED, **Task "Call back +447824678418" (TODO) created and `followUpTaskId` saved**. Weak points: the agent recorded the callback before asking the name, asked for a number it already had, and the call ended before a name could be stored, so the task has no name. The prompt now has a "Callbacks" section (ask name and reason, `take_message`, then `record_outcome`, ring the calling number); re-run `provision-real-agent.mjs` to apply.
- **Twenty front end** is the stock Twenty UI on port 2020 (forwarded address `https://bookish-adventure-q7wggwjrrrpg34gr4-2020.app.github.dev/`, sign-in needed). Calls appear as the custom object "Calls" and follow-ups under Tasks.

## 17. Knowledge base and the editor (2026-10-16, evening)

- **Product intent:** the user's agency will sell this under its own name as one integrated platform. Use Dograh's built-in features first; build only the glue (booking, CRM writes). See the memory note.
- **Knowledge base:** `kb/acme-plumbing-faq.txt` (made-up Acme content) is uploaded to Dograh (Files page: Completed, 5 chunks) and attached to the "Main Agenda and Questions" node in the agent editor; published as **v8**. Not yet tested on a call. Note Dograh warns that uploaded documents go to its managed Model Proxy Service for parsing: fine for fake content, a privacy point for real clients.
- **Upload gotcha:** the Files page upload fails in the browser ("Failed to fetch") because its storage URL is `http://localhost:9000`, the visitor's own PC. Upload from inside the Codespace with `spikes/upload-kb.mjs <file>`, then attach the document in the node editor (Knowledge Base Documents checkbox) and publish.
- **Provisioning script change:** `provision-real-agent.mjs` now starts from the live definition (not the saved backup), so editor changes such as the attached document survive a re-run.
- **The editor shows our work:** Dograh's agent editor lists the 7 tools on the node, the call-ended webhook node and the prompts; the Tools page lists the tools. "Test Audio / Run Test" in the editor can call the agent from the browser (untested; WebRTC from a Codespace may not connect).

## 18. Self-test and model tier comparison (2026-10-16, night)

- **`spikes/scenario-test.mjs`** drives the agent through Dograh text chat with an adaptive scripted caller (answers name, choice of times, yes/no, "this number is fine") for 10 scenarios (faq, book, move, cancel, cancel-nothing, message, callback, opt-out, info, closed-day), checks the tool calls, and, inside the Codespace, the Call and Task in Twenty. The agent's lines come from `run.logs.realtime_feedback_events[].payload.text`. It takes about 3 minutes. Text chat has no voice or latency. In the Codespace it needs the Twenty CLI key in `~/.twenty/config.json`. The check "booked nothing" in closed-day and the "no tool call for opt-out" check are known to be too strict (the adaptive caller may accept another day; the transcript safety net catches opt-outs).
- **Results, same 10 scenarios:** default tier: faq 1/4 (answered "90 days guarantee" and "£60 covers the first hour": made up, the FAQ says 12 months and half an hour), everything else passed except opt-out tool and Saturday check. **"accurate" tier: faq 3/4, the agent called `retrieve_from_knowledge_base` and gave the 12 months and card-only answers**; same pass pattern otherwise. So the knowledge base is only used reliably on "accurate". **The live Models page is now on "accurate" with voice Cora** (organisation default; per-agent voice override removed). Latency of "accurate" on a real voice call is **not measured**: compare "Reasoning Delay" on call run pages.
- **Bugs found and fixed by the self-test:** a taken message was overwritten by a later `record_outcome info_given` (now outranked); UTC start values caused the call 11 time mix-up (local offsets now); test harness bugs (reading replies, `\b` regexes mangled into backspace characters by a Python heredoc: write scripts with the Write tool).
- **Open:** the agent sometimes does not call `record_outcome opted_out` (safety net still marks OPTED_OUT); the call-out price question did not always retrieve from the knowledge base on "accurate" (3/4); calendar link to real Google/Microsoft; voice quality and latency untested since the changes; Dograh editor "Test Audio" untested.

## 19. First voice call on the accurate tier (run 78, 2026-10-16, 15:01)

- **What happened:** 2m45s call. The agent used `retrieve_from_knowledge_base` and gave correct FAQ answers (call-out 60 pounds incl. first half hour, area, 12 months guarantee, card or bank transfer only). The caller asked for an urgent callback because they only had cash: `take_message` (urgent) then `record_outcome callback_requested`. Twenty: Call `dograh:78` CALLBACK_REQUESTED, caller +447824678418, Task "Call back Joseph" (TODO, due about an hour later) with the message and number in the body. End to end worked on a real call.
- **Latency (reasoning delay per reply, ms):** 945, 2081, 1172, 1122, 1073, 1082, 2478, 2227, 1040, 950, 1185, 2295, 2258, 1064, 1666, 1440, 849: **average about 1.47 s, up to 2.5 s on turns that retrieve from the knowledge base.** Earlier default-tier call 9 averaged about 1.18 s. So "accurate" is roughly a quarter slower. Speech-to-text and text-to-speech time is not in these numbers.
- **Speech recognition:** the transcript contained Devanagari characters in one caller line: language was on "Multilingual (auto-detect)". Language is now **English (UK)** on the Models page. Models page now: Dograh mode, voice Cora (British), speed 1, English (UK), LLM tier accurate, temperature unset.
- **Polish done:** a message that already starts with the caller's name no longer repeats it ("Joseph: Joseph needs...").
- **Run page quirk:** `runtime_configuration.llm_model` shows "default" even on the accurate tier: it is a label, not the resolved model.

## 20. Front end started (2026-10-16, later)

- **call-service:** new read-only `GET /api/bookings?from=&to=` (tenant bearer token, default now to +90 days, only that tenant's rows), `BookingStore.list` in memory and Postgres. 170 tests pass, `tsc` clean. Needs a call-service restart to be live (bookings are in memory: a restart empties them).
- **Front end:** `frontend/` holds an overlay, not a fork: three new files (CRM page, Calendar page, `/api/calendar` proxy) plus `apply-overlay.mjs` that patches Dograh's `AppSidebar.tsx`. Type-checks against Dograh main. See `frontend/README.md`. **Not built into the `dograh-ui` container and not seen in a browser yet.** Next: in the Codespace clone dograh, apply the overlay, build the UI image with the three settings, swap it in for `dograh-ui` on port 3010, then check CRM (is Twenty framable?) and Calendar with a real booking.
- Still open from section 0 NEXT STEPS: 2 to 6. Commits are local, not pushed.

### 20b. Front end deployed and checked (2026-10-16, night)
- **Live in the Codespace:** the `dograh-ui` container on port 3010 now runs our image `dograh-ui-custom` (built from `spikes/.work/dograh-src` with `docker build --network host -f ui/Dockerfile -t dograh-ui-custom .` from the repo ROOT, about 5 to 12 minutes). It is started with three compose files: `docker-compose.yaml`, the existing `docker-compose.override.yaml` (host networking, do not overwrite it) and `docker-compose.ours.yaml` (our image plus `CALL_SERVICE_URL` and `CALL_SERVICE_TOKEN`; holds the tenant token, gitignored under `.work`). Restart with `docker compose -f docker-compose.yaml -f docker-compose.override.yaml -f docker-compose.ours.yaml up -d ui` in `.work/dograh`.
- **Checked in a browser:** sidebar shows CRM and Calendar under Build. **Calendar** lists a test booking (Tue 20 Oct 10:00, "Test Booking", in memory only, vanishes on call-service restart). **CRM**: Twenty refuses to be shown in an iframe (broken-page icon), so the page now has three "Open ..." buttons that open Twenty's Calls, Tasks and People in a new tab (commit `55354a7`, not pushed). The Calls link reaches Twenty's sign-in page; signing in is the user's step.
- **Gotchas:** the Codespace editor tab freezes while a Docker build runs (wait, reload, read the log from `~/uibuild.log`); `/tmp` is not safe for logs there. Typing files into the terminal is safest as base64 (`echo ... | base64 -d > file`).
- **Still not done:** backend voice-call tests (cancel, spoken opt-out, after-hours, move, hard-to-hear name) and latency tuning (next steps 2 and 3 in section 0): both need the user to make calls.

### 20c. CRM inside the sidebar with no second login (2026-10-16, night)
- **Decision (user):** the client logs in once, in our app. No Twenty login screen, and Twenty is bespoke background tech for the product; no need to track Twenty updates. Twenty's own SSO is paid, so we did not use it.
- **Built without editing Twenty:** `frontend/twenty-gateway/server.mjs`, a small proxy in front of Twenty. It signs in as one configured Twenty user through Twenty's two GraphQL sign-in calls (`getLoginTokenFromCredentials`, `getAuthTokensFromLoginToken` on `/metadata`), forwards the HttpOnly `twenty-session` cookie, presents Twenty's own address as the request origin upstream, sets the page's local-storage flag `isCookieAuthActiveState=true` (Twenty's front end decides "signed in" from that flag because the cookie is HttpOnly), and removes X-Frame-Options / sets CSP `frame-ancestors`. Env: `LOGIN_EMAIL`, `LOGIN_PASSWORD`, `FRAME_ANCESTORS`, `UPSTREAM`, `PORT`.
- **Verified in the Codespace (private test):** gateway on port 2021 (private forwarding) opens Twenty already signed in; the UI image was rebuilt with `NEXT_PUBLIC_TWENTY_URL` set to the 2021 address; the sidebar CRM page shows Twenty's Calls and Tasks inside the page with no login, real call and task rows visible. Demo user used: Twenty's seeded one. The gateway is started by hand (`setsid nohup node frontend/twenty-gateway/server.mjs`), not part of compose yet, so it stops when the Codespace stops.
- **Security (important):** anyone who can reach the gateway is signed in as that user with no password. It must only be reachable through our own app's sign-in (same domain behind our proxy, or an internal network). Never make port 2021 public. In production put it on a subdomain of the app's domain behind our auth; cross-site cookies were fine in the Codespace test but a real domain should be tested.
- **Licence note:** we did not modify Twenty, so the AGPL change-disclosure point is not triggered by this. If Twenty's own code is edited later, the changed Twenty source must be offered to its users; lawyer to confirm.
- **Still to do:** put the gateway under compose and a per-client config; tenant token or app session check in front of it; then the backend voice-call tests and latency tuning (section 0, steps 2 and 3).

## 21. Backend scenario test and persistence (2026-10-16, night)
- **call-service now stores in Postgres** in the Codespace: database `callservice` created in the existing `dograh-postgres-1` container (`CREATE DATABASE callservice`, nothing else touched). Start command adds `DATABASE_URL=postgres://postgres:postgres@localhost:5432/callservice` to the section 9 command; the log says `storage: postgres (bookings, call facts, post-call queue)` and bookings survive a restart. Logs now go to `~/call-service.log`.
- **Full scenario test (10 scenarios, text chat, Twenty checks included), accurate tier:** PASS book 3/3, move 2/2, cancel 1/1, cancel-nothing 2/2, message 4/4, callback 5/5, info 3/3. FAIL faq 1/4, opt-out 2/3, closed-day 1/2. Opt-out: only the known "agent did not call record_outcome opted_out" check failed; the Twenty outcome and the no-task rule passed (transcript safety net works). Closed-day: the only booking left in the database is a Monday, nothing on a Saturday, so the failing check is the known over-strict harness check, not a booking bug.
- **FAQ:** was missing the call-out price and sometimes the guarantee and cash answers. Added a prompt section "Questions about the business" (always call `retrieve_from_knowledge_base` for prices, fees, guarantees, payment, areas, services, hours; never guess) to `spikes/provision-real-agent.mjs`, re-provisioned and published. Four re-runs: guarantee and payment now correct every time; the call-out price is still missed in 3 of 4 because the lookup returns nothing for "call-out fees" and the agent falls back to taking a message (correct fallback, wrong outcome). **Next fix:** widen the wording of that FAQ entry (add "fee", "charge", "how much do you charge", "price") in `kb/acme-plumbing-faq.txt`, re-upload with `spikes/upload-kb.mjs`, attach the new document on the agent node, publish, re-run `node spikes/scenario-test.mjs faq`.
- **Not testable in text chat:** voice, latency, a hard-to-hear name, real phone calls. The user wants latency tuning after the backend checks.
- **FAQ fixed (same night):** widened the wording of the price, guarantee and payment entries in `kb/acme-plumbing-faq.txt` (added "fee", "charge", "price", "warranty", "cash, card or bank transfer"), re-uploaded with `spikes/upload-kb.mjs`, and attached with the new `spikes/attach-kb.mjs <document_uuid>` (replaces the document ids on the agent node through the API and publishes; no editor needed). `node spikes/scenario-test.mjs faq` now passes 4/4 in four runs in a row. Lesson: the knowledge base is matched by meaning on the question text, so each FAQ entry should include the other ways a caller would ask it.

## 22. Slim client front end: scheduling, customers, calls, follow-ups (2026-10-17, DEPLOYED and tested in the browser, see 22b)
- **Decision (user):** clients should see a calendar and scheduler, not the whole CRM. Staff can add bookings and customers by hand. Twenty stays behind the scenes (kept as a sidebar "CRM" item for admin use, to be hidden from clients later).
- **call-service (177 tests pass, `tsc` clean):** new staff API on the same tenant bearer token as the tools: `GET /api/slots?day=YYYY-MM-DD` (free times), `POST /api/bookings` (add by hand), `POST /api/bookings/:uid/cancel`, `POST /api/bookings/:uid/move {start}`. They go through the same schedulers and slot rules as the phone agent (hours, breaks, days off, no double booking, the client's own calendar), so a manual booking cannot clash with a phone one. Code in `src/staffApi.ts`, wired in `src/server.ts`. Staff act on any upcoming booking through the sentinel phone `STAFF` in `localScheduler.ts` (a caller cannot send it: it fails number parsing; tested). `GET /api/bookings` now also returns the working hours (`config`). Tests in `test/staffApi.test.ts`.
- **Front-end overlay (`frontend/overlay`, type-checks against Dograh main):** `calendar/page.tsx` is now a week grid (prev, today, next; click a free cell to add, click a booking to move or cancel, New booking button); `customers/page.tsx` (list, search, add; UK phone numbers stored the way the call recorder stores them so later calls match); `calls/page.tsx` (list with outcome and summary); `follow-ups/page.tsx` (to-do list from tasks, "Mark done", show-done toggle). Server proxies: `api/calendar` (list), `api/staff/[...path]` (slots and booking changes, whitelisted paths), `api/crm/[...path]` (Twenty REST: calls, tasks, people, add person, mark task done). `apply-overlay.mjs` now adds each missing sidebar item (CRM, Calendar, Customers, Calls, Follow-ups).
- **To deploy in the Codespace:** `git pull`; restart the call-service (command in section 21, with `DATABASE_URL`); add `TWENTY_URL=http://localhost:2020` and `TWENTY_API_KEY=<key from ~/.twenty/config.json remote local, never print it>` to `spikes/.work/dograh/docker-compose.ours.yaml` next to `CALL_SERVICE_*`; `node frontend/apply-overlay.mjs spikes/.work/dograh-src`; rebuild and swap the UI (section 20b commands). Then check in the browser: add a booking, move it, cancel it, add a customer, mark a follow-up done.
- **Unverified:** the Twenty REST field names and response shape used by `api/crm` (calls, tasks, people: `startedAt`, `callerNumber`, `outcome`, `bodyV2.markdown`, `phones.primaryPhone*`) were written from the app source, not run; person creation by phone format; everything in the browser. Not built yet: editing a customer, linking a booking to a customer record, working-hours and time-off settings screen (tenants still come from a JSON file), overriding the slot rules by hand, linking a real Google or Microsoft calendar.

### 22b. Deployed and tested (2026-10-17)
- **Live in the Codespace** (UI image rebuilt, call-service on Postgres, `TWENTY_URL` and `TWENTY_API_KEY` set in `docker-compose.ours.yaml`). Sidebar: CRM, Calendar, Customers, Calls, Follow-ups.
- **Tested in the browser:** week-view Calendar loads with real bookings; clicking an empty cell opens the add form prefilled; adding a booking works and appears at once; Move (to 10:30) works; Cancel works; Customers list loads from Twenty and Add customer works (UK number stored as +44 national form); Follow-ups lists real tasks and Mark done works; Calls lists calls with outcome and summary. Test leftovers in the demo CRM: customer "Zed Testcustomer" (+447700900123) and one follow-up (Call back Priya Shah) marked done.
- **Gotcha found:** the Codespace had restarted: `twenty-app-dev` was not running (`docker start twenty-app-dev`), and the call-service crashed because Postgres was not ready yet at start (`ECONNREFUSED`): start it a minute after the containers are healthy. The gateway and call-service are started by hand and die on a restart. **Next: one restart script** (containers, wait for health, Twenty, call-service, gateway) and put the call-service and gateway under compose.
- **Browser tip:** the in-page Cancel uses `window.confirm`; when driving it through the browser extension, run `window.confirm = () => true` first so it does not lock the session.
- **Observed:** the Customers list also shows Twenty's demo seed people (example.com emails); the demo workspace should be emptied or replaced with a clean per-client workspace. Several test callers share a name ("Jamie Fox") with different numbers.
