# Handover: AI inbound-call platform (read this first)

Written 2026-10-15 at the end of a very long session, for the next Claude chat. Read this file, then `ARCHITECTURE.md`, `BOOKING.md` and `SPIKES.md` in the same folder. This file is the map; those are the detail. Nothing secret is in this file or the repo: where a secret lives it says where, never what.

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
