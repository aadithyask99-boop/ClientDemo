/**
 * VERIFIED on a Twenty dev server (twenty-app-dev image) in Codespaces: synced, signed calls return 200, wrong secret
 * and stale timestamps return 401, rawBody is preserved, and sending the same call twice leaves exactly one Call.
 * Not yet verified: Person linking and Message/Task creation (still TODO below), multi-workspace installs.
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
    calls: { __args: { filter: { providerCallId: { eq: record.providerCallId } }, first: 1 }, edges: { node: { id: true } } },
  });
  const existingId = existing?.calls?.edges?.[0]?.node?.id as string | undefined;

  const data = {
    providerCallId: record.providerCallId,
    direction: record.direction,
    startedAt: record.startedAt,
    endedAt: record.endedAt,
    durationSeconds: record.durationSeconds,
    outcome: record.outcome,
    summary: record.summary,
    recordingUrl: record.recordingUrl ? { primaryLinkUrl: record.recordingUrl } : undefined,
    transcriptUrl: record.transcriptUrl ? { primaryLinkUrl: record.transcriptUrl } : undefined,
  };

  if (existingId) {
    await client.mutation({ updateCall: { __args: { id: existingId, data }, id: true } });
  } else {
    await client.mutation({ createCall: { __args: { data }, id: true } });
  }

  // TODO: upsert Person by E.164 number, link the Call, and create Message or Task by outcome.
  return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { "content-type": "application/json" } });
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
