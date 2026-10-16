import { describe, expect, it } from "vitest";
import { PermanentError, RetryableError, type CrmWriter } from "../src/crm.js";
import { RetryQueue } from "../src/queue.js";
import { buildServer } from "../src/server.js";
import { sign } from "../src/signing.js";
import { InMemoryTenantRegistry } from "../src/tenants.js";
import type { CallRecord, Tenant } from "../src/types.js";

const tenant: Tenant = {
  id: "t1",
  name: "Acme Dental",
  defaultRegion: "GB",
  twenty: { baseUrl: "https://acme.crm.example.com", apiKey: "k", ingestSecret: "ingest" },

  numbers: ["+442071234567"],
};
const registry = new InMemoryTenantRegistry([tenant]);
const providerSecret = "provider";

const payload = {
  providerCallId: "call_123",
  dialedNumber: "+44 20 7123 4567",
  callerNumber: "07400 123456",
  startedAt: "2026-10-15T10:00:00Z",
  endedAt: "2026-10-15T10:02:00Z",
  durationSeconds: 120,
  outcome: "MESSAGE_TAKEN",
  summary: "Caller left a message",
  message: { body: "Call me back", urgent: false },
};

function signedRequest(body: string, secret = providerSecret) {
  const timestamp = String(Math.floor(Date.now() / 1000));
  return {
    method: "POST" as const,
    url: "/webhooks/call-ended",
    headers: {
      "content-type": "application/json",
      "x-callservice-timestamp": timestamp,
      "x-callservice-signature": sign(secret, timestamp, body),
    },
    payload: body,
  };
}

describe("POST /webhooks/call-ended", () => {
  it("rejects unsigned and wrongly signed requests", async () => {
    const crm: CrmWriter = { writeCall: async () => {} };
    const { app } = buildServer({ registry, crm, providerSecret });
    const body = JSON.stringify(payload);
    expect((await app.inject({ method: "POST", url: "/webhooks/call-ended", payload: body, headers: { "content-type": "application/json" } })).statusCode).toBe(401);
    expect((await app.inject(signedRequest(body, "wrong"))).statusCode).toBe(401);
  });

  it("returns 404 for a number that belongs to no tenant", async () => {
    const crm: CrmWriter = { writeCall: async () => {} };
    const { app } = buildServer({ registry, crm, providerSecret });
    const body = JSON.stringify({ ...payload, dialedNumber: "+442079999999" });
    expect((await app.inject(signedRequest(body))).statusCode).toBe(404);
  });

  it("accepts fast and writes a normalized record to the CRM", async () => {
    const written: CallRecord[] = [];
    const crm: CrmWriter = { writeCall: async (_t, r) => void written.push(r) };
    const { app, queue } = buildServer({ registry, crm, providerSecret });
    const res = await app.inject(signedRequest(JSON.stringify(payload)));
    expect(res.statusCode).toBe(202);
    await queue.idle();
    expect(written).toHaveLength(1);
    expect(written[0]).toMatchObject({ tenantId: "t1", callerNumber: "+447400123456", providerCallId: "call_123" });
  });

  it("retries a Twenty outage and delivers once it recovers", async () => {
    let calls = 0;
    const crm: CrmWriter = {
      writeCall: async () => {
        if (++calls < 3) throw new RetryableError("down");
      },
    };
    const queue = new RetryQueue<CallRecord>(async (r) => crm.writeCall(tenant, r), { baseDelayMs: 1 });
    const { app } = buildServer({ registry, crm, providerSecret, queue });
    expect((await app.inject(signedRequest(JSON.stringify(payload)))).statusCode).toBe(202);
    await queue.idle();
    expect(calls).toBe(3);
    expect(queue.deadLetters).toHaveLength(0);
  });

  it("dead-letters permanent failures without retrying", async () => {
    let calls = 0;
    const crm: CrmWriter = {
      writeCall: async () => {
        calls++;
        throw new PermanentError("rejected");
      },
    };
    const queue = new RetryQueue<CallRecord>(async (r) => crm.writeCall(tenant, r), { baseDelayMs: 1 });
    const { app } = buildServer({ registry, crm, providerSecret, queue });
    await app.inject(signedRequest(JSON.stringify(payload)));
    await queue.idle();
    expect(calls).toBe(1);
    expect(queue.deadLetters).toHaveLength(1);
  });
});
