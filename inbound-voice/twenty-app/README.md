# Twenty app: call ingest

Source for the Twenty app that owns the Call object and the signed `ingest-call` route.
This folder holds only the two files we wrote. To run them:

```bash
npx create-twenty-app@latest app-spike --display-name "Inbound Voice"   # scaffolds and starts the twenty-app-dev server on :2020
cp src/objects/call.object.ts app-spike/src/objects/
cp src/logic-functions/ingest-call.ts app-spike/src/logic-functions/
# add an INGEST_SECRET entry to applicationVariables in app-spike/src/application-config.ts (isSecret: false for the spike)
cd app-spike && yarn twenty apply
```

Needs Node 24+. See ../SPIKES.md for what was verified.

## Follow-up tasks and people (added 2026-10-16, WRITTEN WITHOUT BEING RUN)

`ingest-call` now also creates a Task for a returned message, a call-back request or a failed transfer, links it to a Person, and finds or creates that Person (only when the caller gave a name). The call-service decides what the task says and when it is due (`call-service/src/followUp.ts`, tested); the Twenty side only writes it.

Nothing here could be run on the author's PC (no Twenty server, no SDK installed), so these are **unverified** until applied in the Codespace:

1. Task field names (`title`, `bodyV2.markdown`, `dueAt`, `status: "TODO"`), `createTaskTarget { taskId, targetPersonId }` (VERIFIED on 2026-10-16; `personId` is not a field), and `createPerson` with `phones { primaryPhoneNumber, primaryPhoneCountryCode, primaryPhoneCallingCode }`.
2. The phone filter `phones.primaryPhoneNumber eq <national digits>`, and the format Twenty stores: open one existing person in the workspace and compare. People typed in by hand may not match until this is checked.
3. That `yarn twenty apply` accepts the new `followUpTaskId` TEXT field (additive, same kind of field as `recordingKey`).
4. If `createTask` fails, the function answers 500 with the reason; the call-service logs `crm-write retry ... error=...` in `/tmp/call-service.log`. The Call itself is already saved, and a retry will not duplicate it or the task (`followUpTaskId`).

To try it: copy `src/objects/call.object.ts` and `src/logic-functions/ingest-call.ts` into the app project in the Codespace (same copy step as above), run `yarn twenty apply`, then send a call that leaves a message and look for the Call, the Task and the Person in Twenty.
