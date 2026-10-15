# Booking and call outcomes: what is built and what is verified

Date of the live tests: 2026-10-15, in a Codespace, with Dograh text-chat calls (no audio). Code: `call-service/`.

## The tools the agent calls

The call-service exposes four HTTP tools. Dograh calls them with the client's bearer token, which also identifies the client. Each tool that changes anything also receives the call's run ID, so what the tool did is recorded as a fact about that call.

| Tool | Route | What it does |
|---|---|---|
| `check_availability` | `POST /tools/availability` | Free slots on a date (YYYY-MM-DD), optionally morning or afternoon. If the day is closed it returns the next available slots. |
| `book_appointment` | `POST /tools/book` | Books a slot the caller chose. Refuses a time that was not offered or is taken (409). Reports a calendar failure as an error, never as a booking. |
| `take_message` | `POST /tools/message` | Records a message for staff, with a callback number and an urgent flag. |
| `record_outcome` | `POST /tools/outcome` | States `callback_requested`, `opted_out`, `info_given` or `no_outcome`. It cannot state `booked` or `message_taken`, which only the other two tools can produce. |

## Where the scheduling comes from

`LocalScheduler` is our own slot logic: per-client time zone, working days, opening hours, slot length, minimum notice, no double booking, correct across daylight-saving changes. It is the default and what the tests use. Tenants with a Cal.diy configuration use the Cal.diy adapter instead (not yet run against a real Cal.diy). Bookings, call facts and the post-call queue are stored in Postgres when `DATABASE_URL` is set (tables `bookings`, `call_facts` and `outbox`, created on start); without it they are held in memory and lost on restart. With a database the webhook answers 202 only after the call is stored, and answers 500 (so the provider retries) if it could not be; the write to Twenty is retried with backoff for hours, then dead-lettered, and a finished job keeps no call data. A unique key on (tenant, start time) is what stops two callers taking the same slot, across processes too. Bookings are not yet written to the client's real calendar.

## How a call's outcome is decided

In order of authority:

1. **Booking** made through the tool: BOOKED, and the summary names the slot and the caller.
2. **Opt-out heard in the transcript** (safety net, see below): OPTED_OUT, overriding everything except that the booking is still mentioned in the summary.
3. **Outcome the agent stated** through `record_outcome`.
4. **Message taken** through `take_message`: MESSAGE_TAKEN.
5. **The platform's disposition** (on voice calls the classifier's answer), then the agent's own extracted `outcome` variable, else NO_OUTCOME.

This ordering exists because the platform's disposition cannot be trusted on text chats (it stores only the end reason) and an LLM does not reliably call a tool every time.

## Live results

| Scenario | Expected | Result |
|---|---|---|
| Book next Tuesday morning | BOOKED | PASS: booked "Tuesday 20 October at 09:00", summary names the caller |
| Ask for a closed day, then decline | no booking | PASS: nothing booked, NO_OUTCOME |
| Leave a message | MESSAGE_TAKEN | PASS |
| Ask for a callback | CALLBACK_REQUESTED | FAIL first time (agent did not call the tool); PASS after a firmer instruction, with the agreed time in the summary |
| One-message opt-out | OPTED_OUT | FAIL twice (agent did not call the tool); PASS once the transcript safety net existed |

The two failing cases each passed in a later separate run after a change. No single run of all five scenarios with the final code has been made.

## What this shows about the agent

The hosted model Dograh bundles follows tool instructions most of the time but not always. A single-message call is the weakest case: the agent did not call `record_outcome` even when told to. Production should use a stronger model of our own choosing, and anything legally important must not depend on the model calling a tool.

## The opt-out safety net

`call-service/src/signals.ts` scans only the caller's lines of the copied transcript for clear opt-out phrases ("do not contact me again", "remove my number from your list", "take me off", "unsubscribe", "opt me out"). It deliberately ignores the agent's own words and ordinary requests such as "don't call me before 9". It runs only when a transcript was copied (so it needs the artifact store configured). It is a backstop, not a classifier: phrases it does not know will be missed, and the list needs growing with real calls.

## Not verified

- Voice calls (all tests were text chat). Outcomes on voice calls rely on Dograh's classifier, which the source suggests is stored before the webhook.
- Cal.diy as the scheduler (the image build started in the Codespace but has not finished; the README's `DOCKER_BUILDKIT=0` advice fails on this Dockerfile, so `cal-up.sh` uses BuildKit); a real client calendar.
- Postgres storage: verified. The 23 database tests (`persistence.test.ts`, `pgQueue.test.ts`) pass on PGlite and, run with `TEST_DATABASE_URL=postgres://... npm test`, on a real Postgres 16 through the `pg` driver (Codespace, three runs in a row). That covers three simultaneous bookings of one slot over separate connections (one wins), a job stored before a crash being run by the next process, an expired lock being taken over, a redelivery during a run not being lost, and two workers sharing 20 jobs with none run twice. Not covered: a Postgres outage in the middle of a run, and sustained load.
- The real server found one bug PGlite could not: starting several processes at once collided in `CREATE TABLE IF NOT EXISTS`. Fixed by running the schema in one transaction under an advisory lock, and a test starts six migrations at once.
- Tenants still come from a file, not the database (their Twenty API keys and secrets need encryption at rest first).
- Messages as records in Twenty: the message is carried on the call record but no Message object is created yet.
- Transcript wording in other languages for the opt-out check.
