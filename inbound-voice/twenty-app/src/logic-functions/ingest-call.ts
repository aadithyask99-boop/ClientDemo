/**
 * NOT RUN. Written from Twenty's docs (logic-functions.mdx, objects.mdx). Needs a running Twenty server to verify:
 *  - the exact import paths and the CoreApiClient query/mutation shape,
 *  - whether `rawBody` is preserved in practice (the docs say it can be undefined),
 *  - the default timeout (docs example uses 2s; raise timeoutSeconds if needed).
 *
 * Contract with ../../../call-service/src/crm.ts:
 *   POST /s/ingest-call, headers x-callservice-timestamp and x-callservice-signature,
 *   signature = hex HMAC-SHA256(secret, `${timestamp}:${rawBody}`).
 */
import { createHmac, timingSafeEqual } from "node:crypto";
import { defineLogicFunction } from "twenty-sdk/define";
import type { RoutePayload } from "twenty-sdk/logic-function";
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
    return { statusCode: 401, body: JSON.stringify({ error: "unauthorized" }) };
  }

  const record = JSON.parse(event.rawBody as string);
  const client = new CoreApiClient();

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
  return { statusCode: 200, body: JSON.stringify({ ok: true }) };
};

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
