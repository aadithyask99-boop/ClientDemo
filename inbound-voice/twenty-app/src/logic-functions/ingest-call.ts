/**
 * VERIFIED on a Twenty dev server (twenty-app-dev image) in Codespaces: synced, signed calls return 200, wrong secret
 * and stale timestamps return 401, rawBody is preserved, and sending the same call twice leaves exactly one Call.
 * Not yet verified: multi-workspace installs.
 * WRITTEN WITHOUT BEING RUN (no Twenty server or SDK was available): the Person find-or-create and the follow-up Task below,
 * including the Task, Person and TaskTarget field names and the phone filter. See "Unverified" in ../README.md.
 * The secret comes from an application variable (INGEST_SECRET). Secret variables cannot carry a default value
 * (typecheck rejects it), so a per-workspace secret must be set after install. See ../../SPIKES.md.
 *
 * Contract with ../../../call-service/src/crm.ts:
 *   POST /s/ingest-call, headers x-callservice-timestamp and x-callservice-signature,
 *   signature = hex HMAC-SHA256(secret, `${timestamp}:${rawBody}`).
 */
import { createHmac, timingSafeEqual } from "node:crypto";
import { defineLogicFunction } from "twenty-sdk/define";
import { Response, type RoutePayload } from "twenty-sdk/logic-function";
import { CoreApiClient } from "twenty-client-sdk/core";

const TOLERANCE_MS = 5 * 60 * 1000;

function authentic(event: RoutePayload, secret: string): boolean {
  const ts = event.headers["x-callservice-timestamp"];
  const sig = event.headers["x-callservice-signature"];
  const raw = event.rawBody;
  if (!ts || !sig || raw === undefined) return false; // refuse rather than verify a re-serialized body
  const tsMs = Number(ts) < 1e12 ? Number(ts) * 1000 : Number(ts);
  if (!Number.isFinite(tsMs) || Math.abs(Date.now() - tsMs) > TOLERANCE_MS) return false;
  const expected = createHmac("sha256", secret).update(`${ts}:${raw}`).digest();
  let got: Buffer;
  try {
    got = Buffer.from(sig, "hex");
  } catch {
    return false;
  }
  return got.length === expected.length && timingSafeEqual(got, expected);
}

const handler = async (event: RoutePayload) => {
  const secret = process.env.INGEST_SECRET; // server variable set per workspace at install time (UNVERIFIED mechanism)
  if (!secret || !authentic(event, secret)) {
    return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: { "content-type": "application/json" } });
  }

  try {
    return await ingest(JSON.parse(event.rawBody as string));
  } catch (err) {
    // The caller is authenticated by HMAC, so returning the reason is safe and makes retries debuggable.
    return new Response(JSON.stringify({ error: "ingest failed", detail: String((err as Error)?.message ?? err).slice(0, 400) }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
};

async function ingest(record: any): Promise<Response> {
  // Typed as any: the generated client only knows the Call object after the first sync, so the first typecheck fails otherwise.
  const client: any = new CoreApiClient();

  // Idempotent on providerCallId: look up first, update if present, create otherwise.
  // UNVERIFIED: filter syntax for the generated client.
  const existing = await client.query({
    calls: { __args: { filter: { providerCallId: { eq: record.providerCallId } }, first: 1 }, edges: { node: { id: true, followUpTaskId: true } } },
  });
  const existingId = existing?.calls?.edges?.[0]?.node?.id as string | undefined;
  const existingTaskId = existing?.calls?.edges?.[0]?.node?.followUpTaskId as string | undefined;

  const data = {
    providerCallId: record.providerCallId,
    direction: record.direction,
    callerNumber: record.callerNumber,
    startedAt: record.startedAt,
    endedAt: record.endedAt,
    durationSeconds: record.durationSeconds,
    outcome: record.outcome,
    summary: record.summary,
    // Private storage keys, not links: Twenty LINKS fields reject non-http URLs (verified), and a field type cannot be changed in place, so these are new TEXT fields.
    recordingKey: record.recordingRef,
    transcriptKey: record.transcriptRef,
  };

  let callId = existingId;
  if (existingId) {
    await client.mutation({ updateCall: { __args: { id: existingId, data }, id: true } });
  } else {
    const created = await client.mutation({ createCall: { __args: { data }, id: true } });
    callId = created?.createCall?.id;
  }

  // Follow-up (UNVERIFIED, see the header). The order is what keeps a retry or a redelivered webhook from creating a second
  // task: the task id is saved on the Call the moment the task exists, BEFORE anything that can fail after it. A failure to
  // find the person or to link the task to them is reported as a warning (the task is still useful: its title names the
  // caller), while a failure to create the task itself is thrown, so the call-service retries and logs it.
  const warnings: string[] = [];
  if (record.followUp && callId && !existingTaskId) {
    let personId: string | undefined;
    try {
      personId = await findOrCreatePerson(client, record);
    } catch (err) {
      warnings.push(`person: ${String((err as Error)?.message ?? err).slice(0, 200)}`);
    }
    const taskId = await createTask(client, record.followUp);
    await client.mutation({ updateCall: { __args: { id: callId, data: { followUpTaskId: taskId } }, id: true } });
    if (personId) {
      // The first real run showed Twenty's TaskTarget has no "personId" field. The person field is probably "targetPersonId";
      // try it first, then the old name, and report both errors if neither works.
      const errors: string[] = [];
      let linked = false;
      for (const field of ["targetPersonId", "personId"]) {
        try {
          await client.mutation({ createTaskTarget: { __args: { data: { taskId, [field]: personId } }, id: true } });
          linked = true;
          break;
        } catch (err) {
          errors.push(`${field}: ${String((err as Error)?.message ?? err).slice(0, 120)}`);
        }
      }
      if (!linked) warnings.push(`taskTarget: ${errors.join(" | ")}`);
    }
  }
  return new Response(JSON.stringify({ ok: true, ...(warnings.length ? { warnings } : {}) }), { status: 200, headers: { "content-type": "application/json" } });
}

/**
 * UNVERIFIED: Twenty stores a phone as separate parts. This assumes primaryPhoneNumber holds the national digits
 * ("7400123456"), primaryPhoneCountryCode the country ("GB") and primaryPhoneCallingCode "+44", and that people typed in by
 * hand use the same format. Check one existing person in the workspace before relying on matching.
 * A Person is created only when the caller gave a name on the call; otherwise the Task is created without one.
 */
async function findOrCreatePerson(client: any, record: any): Promise<string | undefined> {
  const phone = record.callerPhone;
  if (!phone?.nationalNumber) return undefined;
  const found = await client.query({
    people: { __args: { filter: { phones: { primaryPhoneNumber: { eq: phone.nationalNumber } } }, first: 1 }, edges: { node: { id: true } } },
  });
  const foundId = found?.people?.edges?.[0]?.node?.id as string | undefined;
  if (foundId || !record.callerName) return foundId;
  const [firstName, ...rest] = String(record.callerName).trim().split(/\s+/);
  const created = await client.mutation({
    createPerson: {
      __args: {
        data: {
          name: { firstName, lastName: rest.join(" ") },
          phones: { primaryPhoneNumber: phone.nationalNumber, primaryPhoneCountryCode: phone.country ?? "", primaryPhoneCallingCode: phone.callingCode },
        },
      },
      id: true,
    },
  });
  return created?.createPerson?.id;
}

/** UNVERIFIED field names: title, bodyV2.markdown, dueAt, status on Task. */
async function createTask(client: any, followUp: any): Promise<string> {
  const created = await client.mutation({
    createTask: {
      __args: { data: { title: followUp.title, bodyV2: { markdown: followUp.body }, dueAt: followUp.dueAt, status: "TODO" } },
      id: true,
    },
  });
  const taskId = created?.createTask?.id as string | undefined;
  if (!taskId) throw new Error("Task was not created");
  return taskId;
}

export default defineLogicFunction({
  universalIdentifier: "00000000-0000-4000-8000-000000000001", // replace with a generated UUID and keep it stable
  name: "ingest-call",
  timeoutSeconds: 10,
  handler,
  httpRouteTriggerSettings: {
    path: "/ingest-call",
    httpMethod: "POST",
    isAuthRequired: false, // we authenticate with our own HMAC instead
    forwardedRequestHeaders: ["x-callservice-timestamp", "x-callservice-signature", "content-type"],
  },
});
