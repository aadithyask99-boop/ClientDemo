import type { CallRecord, Tenant } from "./types.js";
import { SIGNATURE_HEADER, TIMESTAMP_HEADER, sign } from "./signing.js";

export interface CrmWriter {
  /** Idempotent on record.providerCallId. Throws on any failure so the queue retries. */
  writeCall(tenant: Tenant, record: CallRecord): Promise<void>;
}

export class RetryableError extends Error {}
export class PermanentError extends Error {}

/**
 * Writes through the Twenty app's `ingest-call` HTTP-route logic function (see ../twenty-app).
 * Call, Agent and Message are APPLICATION-writable, so the REST API with a workspace key is not used for writes.
 * The route path (/s/ingest-call) and the signature headers are our own contract with that function.
 * UNVERIFIED against a running Twenty server.
 */
export class TwentyIngestWriter implements CrmWriter {
  constructor(private readonly fetchImpl: typeof fetch = fetch) {}

  async writeCall(tenant: Tenant, record: CallRecord): Promise<void> {
    const rawBody = JSON.stringify(record);
    const timestamp = String(Math.floor(Date.now() / 1000));
    const url = new URL("/s/ingest-call", tenant.twenty.baseUrl).toString();

    let res: Response;
    try {
      res = await this.fetchImpl(url, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          [TIMESTAMP_HEADER]: timestamp,
          [SIGNATURE_HEADER]: sign(tenant.twenty.ingestSecret, timestamp, rawBody),
        },
        body: rawBody,
        signal: AbortSignal.timeout(10_000),
      });
    } catch (err) {
      throw new RetryableError(`Twenty unreachable: ${(err as Error).message}`);
    }

    if (res.ok) return;
    // 4xx other than 408/429 will not succeed on retry; surface for the dead-letter queue.
    if (res.status >= 400 && res.status < 500 && res.status !== 408 && res.status !== 429) {
      throw new PermanentError(`Twenty rejected call ${record.providerCallId}: ${res.status}`);
    }
    throw new RetryableError(`Twenty error ${res.status} for call ${record.providerCallId}`);
  }
}

/** Caller lookup on the live path: short timeout, never throws, returns null on any problem. */
export async function lookupPersonByPhone(
  tenant: Tenant,
  e164: string,
  fetchImpl: typeof fetch = fetch,
  timeoutMs = 400,
): Promise<{ id: string } | null> {
  try {
    // UNVERIFIED: the phone filter syntax. Confirm in the workspace's generated API docs before relying on this.
    const filter = encodeURIComponent(`phones.primaryPhoneNumber[eq]:${e164}`);
    const url = new URL(`/rest/people?filter=${filter}&limit=1`, tenant.twenty.baseUrl).toString();
    const res = await fetchImpl(url, {
      headers: { authorization: `Bearer ${tenant.twenty.apiKey}` },
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!res.ok) return null;
    const body = (await res.json()) as { data?: { people?: Array<{ id: string }> } };
    return body.data?.people?.[0] ?? null;
  } catch {
    return null;
  }
}
