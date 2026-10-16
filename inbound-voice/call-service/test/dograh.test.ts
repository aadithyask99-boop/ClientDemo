import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { ArtifactCopyingWriter, LocalArtifactStore, type ArtifactStore } from "../src/artifacts.js";
import type { CrmWriter } from "../src/crm.js";
import { dograhPayload, mapDisposition, toCallRecord } from "../src/dograh.js";
import { buildServer } from "../src/server.js";
import { InMemoryTenantRegistry } from "../src/tenants.js";
import type { CallRecord, Tenant } from "../src/types.js";

const tenant: Tenant = {
  id: "t1",
  name: "Acme Dental",
  defaultRegion: "GB",
  twenty: { baseUrl: "https://acme.crm.example.com", apiKey: "k", ingestSecret: "ingest" },

  numbers: ["+442071234567"],
  dograhWebhookToken: "tok_acme_123",
};
const other: Tenant = { ...tenant, id: "t2", name: "Beta Vets", numbers: [], dograhWebhookToken: "tok_beta_456" };
const registry = new InMemoryTenantRegistry([tenant, other]);

// What Dograh renders from our payload_template: every value is a string, unresolved variables are empty.
const payload = {
  run_id: "42",
  called_at: "2026-10-15T10:00:00Z",
  caller: "07400 123456",
  duration: "95",
  disposition: "booked",
  summary: "Booked a cleaning for Tuesday.",
  recording_url: "https://files.example.com/rec/42.wav",
  transcript_url: "https://files.example.com/tr/42.json",
};

describe("mapDisposition", () => {
  it("passes our own codes through in any case and format", () => {
    expect(mapDisposition("booked")).toBe("BOOKED");
    expect(mapDisposition("Message Taken")).toBe("MESSAGE_TAKEN");
    expect(mapDisposition("transfer-failed")).toBe("TRANSFER_FAILED");
  });
  it("maps Dograh's starter dispositions and falls back safely", () => {
    expect(mapDisposition("do_not_call")).toBe("OPTED_OUT");
    expect(mapDisposition("qualified")).toBe("BOOKED");
    expect(mapDisposition("user_hangup")).toBe("NO_OUTCOME");
    expect(mapDisposition("something_new")).toBe("NO_OUTCOME");
    expect(mapDisposition(undefined)).toBe("NO_OUTCOME");
  });
});

describe("toCallRecord", () => {
  it("builds a normalized record with a prefixed idempotency key", () => {
    const r = toCallRecord(tenant, dograhPayload.parse(payload));
    expect(r).toMatchObject({
      providerCallId: "dograh:42",
      tenantId: "t1",
      callerNumber: "+447400123456",
      durationSeconds: 95,
      outcome: "BOOKED",
      startedAt: "2026-10-15T10:00:00.000Z",
      endedAt: "2026-10-15T10:01:35.000Z",
    });
    expect(r.sourceArtifacts).toEqual({ recordingUrl: payload.recording_url, transcriptUrl: payload.transcript_url });
    expect(r.recordingRef).toBeUndefined();
  });

  it("treats empty and unresolved template values as missing", () => {
    const r = toCallRecord(tenant, dograhPayload.parse({ run_id: 7, caller: "", duration: "", disposition: "", recording_url: "{{recording_url}}", summary: "{{gathered_context.summary}}" }));
    expect(r.callerNumber).toBe("unknown");
    expect(r.durationSeconds).toBe(0);
    expect(r.outcome).toBe("NO_OUTCOME");
    expect(r.summary).toBe("");
    expect(r.sourceArtifacts).toBeUndefined();
    expect(r.providerCallId).toBe("dograh:7");
  });

  it("carries a message when one was taken", () => {
    const r = toCallRecord(tenant, dograhPayload.parse({ run_id: "9", disposition: "message_taken", message_body: "Call me back", callback_number: "07400 123456", urgent: "true" }));
    expect(r.message).toEqual({ body: "Call me back", callbackNumber: "07400 123456", urgent: true });
  });
});

describe("POST /webhooks/dograh", () => {
  const send = (app: ReturnType<typeof buildServer>["app"], body: unknown, token?: string) =>
    app.inject({
      method: "POST",
      url: "/webhooks/dograh",
      headers: { "content-type": "application/json", ...(token ? { authorization: `Bearer ${token}` } : {}) },
      payload: JSON.stringify(body),
    });

  it("rejects missing and unknown tokens", async () => {
    const { app } = buildServer({ registry, crm: { writeCall: async () => {} }, providerSecret: "p" });
    expect((await send(app, payload)).statusCode).toBe(401);
    expect((await send(app, payload, "nope")).statusCode).toBe(401);
  });

  it("routes by token: a call is written to the tenant that owns the token", async () => {
    const written: Array<{ tenant: string; record: CallRecord }> = [];
    const crm: CrmWriter = { writeCall: async (t, r) => void written.push({ tenant: t.id, record: r }) };
    const { app, queue } = buildServer({ registry, crm, providerSecret: "p" });
    expect((await send(app, payload, "tok_beta_456")).statusCode).toBe(202);
    await queue.idle();
    expect(written).toHaveLength(1);
    expect(written[0]!.tenant).toBe("t2");
    expect(written[0]!.record.tenantId).toBe("t2");
  });

  it("rejects an invalid payload", async () => {
    const { app } = buildServer({ registry, crm: { writeCall: async () => {} }, providerSecret: "p" });
    expect((await send(app, { no_run_id: true }, "tok_acme_123")).statusCode).toBe(400);
  });

  it("refuses two tenants sharing a token", () => {
    expect(() => new InMemoryTenantRegistry([tenant, { ...other, dograhWebhookToken: "tok_acme_123" }])).toThrow(/shared/);
  });
});

describe("artifact copying", () => {
  const base: CallRecord = {
    providerCallId: "dograh:42",
    tenantId: "t1",
    direction: "INBOUND",
    callerNumber: "+447400123456",
    startedAt: "2026-10-15T10:00:00Z",
    endedAt: "2026-10-15T10:01:00Z",
    durationSeconds: 60,
    outcome: "BOOKED",
    summary: "",
    sourceArtifacts: { recordingUrl: "https://files.example.com/rec/42.wav" },
  };

  it("replaces provider links with private references and never forwards the public link", async () => {
    let seen: CallRecord | undefined;
    const store: ArtifactStore = { save: async (_t, id, kind) => ({ ref: `artifact://t1/${id}.${kind}` }) };
    await new ArtifactCopyingWriter({ writeCall: async (_t, r) => void (seen = r) }, store).writeCall(tenant, base);
    expect(seen?.recordingRef).toBe("artifact://t1/dograh:42.recording");
    expect(seen?.sourceArtifacts).toBeUndefined();
  });

  it("drops the link, but still writes the record, when the copy fails or no store exists", async () => {
    const seen: CallRecord[] = [];
    const crm: CrmWriter = { writeCall: async (_t, r) => void seen.push(r) };
    await new ArtifactCopyingWriter(crm, { save: async () => { throw new Error("boom"); } }).writeCall(tenant, base);
    await new ArtifactCopyingWriter(crm, null).writeCall(tenant, base);
    expect(seen).toHaveLength(2);
    for (const r of seen) {
      expect(r.recordingRef).toBeUndefined();
      expect(r.sourceArtifacts).toBeUndefined();
    }
  });

  it("local store writes the file, and refuses hosts outside the allow-list and non-http schemes", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "art-"));
    try {
      const fetchImpl = (async () => new Response("audio-bytes")) as unknown as typeof fetch;
      const store = new LocalArtifactStore(dir, { allowedHosts: ["files.example.com"], fetchImpl });
      const ref = await store.save("t1", "dograh:42", "recording", "https://files.example.com/rec/42.wav");
      expect(ref).toEqual({ ref: "artifact://t1/dograh_42.recording" });
      expect(await readFile(path.join(dir, "t1", "dograh_42.recording"), "utf8")).toBe("audio-bytes");
      expect(await store.save("t1", "x", "recording", "https://evil.example.net/a.wav")).toBeNull();
      expect(await store.save("t1", "x", "recording", "file:///etc/passwd")).toBeNull();
      expect(await store.save("t1", "x", "recording", "not a url")).toBeNull();
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("local store can fetch through a local address instead of the public one", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "art-"));
    try {
      const seen: string[] = [];
      const fetchImpl = (async (u: URL) => {
        seen.push(String(u));
        return new Response("hello");
      }) as unknown as typeof fetch;
      const store = new LocalArtifactStore(dir, { fetchImpl, rewrite: [["https://pub.example.com:8000", "http://localhost:8000"]] });
      await store.save("t1", "dograh:1", "transcript", "https://pub.example.com:8000/api/v1/files/1.txt");
      await store.save("t1", "dograh:2", "transcript", "https://other.example.com/files/2.txt");
      expect(seen).toEqual(["http://localhost:8000/api/v1/files/1.txt", "https://other.example.com/files/2.txt"]); // only the matching start is rewritten
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});
